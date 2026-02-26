import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "./supabase";
import { NotificationTemplates } from "./notificationTemplates";
import { getEventMembers } from "./events";
import { reportError, logExpected } from "@/utils/logger";

const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"]);

const isMissingTableError = (error: any) =>
  !!error?.code && MISSING_TABLE_CODES.has(error.code);

const loadExpoNotificationsModule = () => {
  const NotificationsImport: any = require("expo-notifications");
  return (
    NotificationsImport?.default?.default ??
    NotificationsImport?.default ??
    NotificationsImport
  );
};

const resolveExpoProjectId = () =>
  (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
  (Constants as any)?.easConfig?.projectId;

const getExpoPushToken = async (Notifications: any, projectId?: string) => {
  const tokenData = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();
  return tokenData?.data ?? null;
};

const upsertPushToken = async (userId: string, token: string) => {
  const { error } = await supabase
    .from("device_tokens")
    .upsert([{ user_id: userId, token }] as any)
    .select();
  return error ?? null;
};

const validateBroadcastMessage = (message: string) => {
  if (!message || message.length === 0) {
    return "Message cannot be empty";
  }
  if (message.length > 100) {
    return "Message too long (max 100 characters)";
  }
  return null;
};

const fetchMembershipRole = async (eventId: string, userId: string) => {
  const { data: membership } = await (supabase.from("event_memberships") as any)
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return (membership as any)?.role ?? null;
};

const isAdminRole = (role: string | null) =>
  role === "owner" || role === "admin";

const fetchSenderName = async (senderId: string) => {
  const { data: sender } = await (supabase.from("users") as any)
    .select("name")
    .eq("id", senderId)
    .single();
  return (sender as any)?.name ?? null;
};

const fetchOptedInUsers = async (recipientIds: string[]) => {
  if (recipientIds.length === 0) return [];
  const { data: users } = await (supabase.from("users") as any)
    .select("id, notification_prefs")
    .in("id", recipientIds);
  return (users || []).filter((user: any) => {
    const prefs = user.notification_prefs as any;
    return prefs?.admin_broadcasts !== false;
  });
};

const insertNotifications = async (notifications: any[]) => {
  const { error } = await supabase
    .from("notifications")
    .insert(notifications as any);
  return error ?? null;
};

// Register the device for Expo push notifications and store the token in Supabase
export async function registerForPushNotificationsAsync(userId: string) {
  try {
    if (Platform.OS === "web") {
      logExpected("Push notifications not supported on web", "Notifications");
      return null;
    }
    if (!Device.isDevice) {
      logExpected(
        "Push notifications require physical device (simulator detected)",
        "Notifications",
      );
      return null;
    }

    // Load `expo-notifications` lazily to avoid web bundle-time initialization
    // (some builds access `localStorage` during module init).
    // Also: `require()` is easier to mock in Jest than dynamic `import()`.

    const Notifications: any = loadExpoNotificationsModule();

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      reportError(
        new Error("Failed to get push token for push notifications."),
        { scope: "notifications", action: "replace_console" },
      );
      return null;
    }

    const projectId = resolveExpoProjectId();
    const token = await getExpoPushToken(Notifications, projectId);
    if (!token) return null;

    // Upsert token into Supabase `device_tokens` table
    const error = await upsertPushToken(userId, token);
    if (error) {
      if (isMissingTableError(error)) {
        logExpected(
          "table `device_tokens` not found. Push token not persisted.",
          "Notifications",
        );
      } else {
        reportError(new Error("Failed to save push token to Supabase"), {
          scope: "notifications",
          action: "register_push_token",
          userId,
          metadata: { cause: (error as any)?.message || String(error) },
        });
      }
    }

    return token;
  } catch (err) {
    reportError(new Error("Error registering for push notifications"), {
      scope: "notifications",
      action: "register_push_token",
      userId,
      metadata: { cause: err instanceof Error ? err.message : String(err) },
    });
    return null;
  }
}

export async function unregisterPushToken(userId: string, token: string) {
  try {
    const { error } = await supabase
      .from("device_tokens")
      .delete()
      .match({ user_id: userId, token });
    if (error) {
      reportError(new Error("Failed to remove push token"), {
        scope: "notifications",
        action: "unregister_push_token",
        userId,
        metadata: { cause: (error as any)?.message || String(error) },
      });
    }
    return !error;
  } catch (err) {
    reportError(new Error("Error removing push token"), {
      scope: "notifications",
      action: "unregister_push_token",
      userId,
      metadata: { cause: err instanceof Error ? err.message : String(err) },
    });
    return false;
  }
}

/**
 * Send an admin broadcast notification to all active event members
 * @param eventId - The event to broadcast to
 * @param message - The message to send (1-100 characters)
 * @param senderId - The user ID of the sender (must be event admin)
 * @returns Result with success status and recipient count
 */
export async function sendAdminBroadcast(
  eventId: string,
  message: string,
  senderId: string,
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // 1. Validate message
    const trimmedMessage = message.trim();
    const validationError = validateBroadcastMessage(trimmedMessage);
    if (validationError) {
      return { success: false, count: 0, error: validationError };
    }

    // 2. Check sender is event admin
    const role = await fetchMembershipRole(eventId, senderId);
    if (!role || !isAdminRole(role)) {
      reportError(new Error("Unauthorized broadcast attempt"), {
        scope: "notifications",
        action: "sendAdminBroadcast",
        userId: senderId,
        metadata: { eventId },
      });
      return {
        success: false,
        count: 0,
        error: "Only event admins can send broadcasts",
      };
    }

    // 3. Get sender name
    const senderName = await fetchSenderName(senderId);
    if (!senderName) {
      return { success: false, count: 0, error: "Sender not found" };
    }

    // 4. Get all active event members (except sender)
    const members = await getEventMembers(eventId);
    const recipientIds = members
      .filter((m) => m.user_id !== senderId)
      .map((m) => m.user_id);

    if (recipientIds.length === 0) {
      return { success: true, count: 0 };
    }

    // 5. Filter by opt-in preference
    const optedInUsers = await fetchOptedInUsers(recipientIds);

    if (optedInUsers.length === 0) {
      return { success: true, count: 0 };
    }

    // 6. Create notification template
    const template = NotificationTemplates.adminBroadcast(
      trimmedMessage,
      senderName,
      eventId,
    );

    // 7. Enqueue notifications
    const payload = {
      type: "admin_broadcast",
      title: template.title,
      body: template.body,
      data: template.data,
      priority: template.priority || "normal",
      sender_id: senderId,
    };
    const notifications = optedInUsers.map((user: any) => ({
      event_id: eventId,
      target_user: user.id,
      payload,
    }));

    const insertError = await insertNotifications(notifications);
    if (insertError) {
      if (isMissingTableError(insertError)) {
        reportError(
          new Error(
            "Cannot send broadcast: Supabase table `notifications` does not exist.",
          ),
          { scope: "notifications", action: "replace_console" },
        );
        return {
          success: false,
          count: 0,
          error: "Notifications table not found",
        };
      }
      throw insertError;
    }

    return { success: true, count: optedInUsers.length };
  } catch (err: any) {
    reportError(err, {
      scope: "notifications",
      action: "sendAdminBroadcast",
      userId: senderId,
      metadata: { eventId },
    });
    return {
      success: false,
      count: 0,
      error: err.message || "Failed to send broadcast",
    };
  }
}

/**
 * Enqueue "new round started" notifications for opted-in users.
 * Uses admin_broadcasts preference for now (same opt-in surface).
 */
export async function enqueueNewRoundNotifications(
  eventId: string,
  eventName: string,
  senderId: string,
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const { data: users } = await (supabase.from("users") as any).select(
      "id, notification_prefs",
    );
    const optedInUsers = (users || []).filter((user: any) => {
      if (user.id === senderId) return false;
      const prefs = user.notification_prefs as any;
      return prefs?.admin_broadcasts !== false;
    });

    if (optedInUsers.length === 0) {
      return { success: true, count: 0 };
    }

    const template = NotificationTemplates.newRound(eventName, eventId);
    const payload = {
      type: "new_round",
      title: template.title,
      body: template.body,
      data: template.data,
      event_name: eventName,
      priority: template.priority || "normal",
      sender_id: senderId,
    };

    const notifications = optedInUsers.map((user: any) => ({
      event_id: eventId,
      target_user: user.id,
      payload,
    }));

    const insertError = await insertNotifications(notifications);

    if (insertError) {
      if (isMissingTableError(insertError)) {
        reportError(
          new Error(
            "Cannot enqueue new round notifications: Supabase table `notifications` does not exist.",
          ),
          {
            scope: "notifications",
            action: "enqueue_new_round",
          },
        );
        return {
          success: false,
          count: 0,
          error: "Notifications table not found",
        };
      }
      throw insertError;
    }

    return { success: true, count: optedInUsers.length };
  } catch (err: any) {
    reportError(err, {
      scope: "notifications",
      action: "enqueue_new_round",
      userId: senderId,
      metadata: { eventId },
    });
    return {
      success: false,
      count: 0,
      error: err.message || "Failed to enqueue new round notifications",
    };
  }
}
