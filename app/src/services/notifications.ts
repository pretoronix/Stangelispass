import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { NotificationTemplates } from './notificationTemplates';
import { getEventMembers } from './events';
import { reportError, logWarn } from '@/utils/logger';

// Register the device for Expo push notifications and store the token in Supabase
export async function registerForPushNotificationsAsync(userId: string) {
  try {
    if (Platform.OS === 'web') {
      // Expected on web - just log as info, not error
      console.log('[Notifications] Push notifications not supported on web (expected)');
      return null;
    }
    if (!Device.isDevice) {
      // Expected on simulator - just log as info, not error
      console.log('[Notifications] Push notifications require physical device (simulator detected - expected)');
      return null;
    }

    // Dynamically import `expo-notifications` to avoid executing web-specific
    // initialization code (which accesses `localStorage`) at bundle time in Metro.
    const Notifications = await import('expo-notifications');

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      reportError(new Error('Failed to get push token for push notifications.'), { scope: 'notifications', action: 'replace_console' });
      return null;
    }

    const projectId =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    const token = tokenData?.data;
    if (!token) return null;

    // Upsert token into Supabase `device_tokens` table
    const { error } = await supabase
      .from('device_tokens')
      .upsert([{ user_id: userId, token }] as any)
      .select();
    if (error) {
      if ((error as any)?.code === 'PGRST205' || (error as any)?.code === '42P01') {
        console.log('[Notifications] table `device_tokens` not found. Push token not persisted. (expected)');
      } else {
        reportError(new Error('Failed to save push token to Supabase:', error.message || error), { scope: 'notifications', action: 'replace_console' });
      }
    }

    return token;
  } catch (err) {
    reportError(new Error('Error registering for push notifications:', err), { scope: 'notifications', action: 'replace_console' });
    return null;
  }
}

export async function unregisterPushToken(userId: string, token: string) {
  try {
    const { error } = await supabase.from('device_tokens').delete().match({ user_id: userId, token });
    if (error) reportError(new Error('Failed to remove push token:', error.message || error), { scope: 'notifications', action: 'replace_console' });
    return !error;
  } catch (err) {
    reportError(new Error('Error removing push token:', err), { scope: 'notifications', action: 'replace_console' });
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
  senderId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // 1. Validate message
    const trimmedMessage = message.trim();
    if (!trimmedMessage || trimmedMessage.length === 0) {
      return { success: false, count: 0, error: 'Message cannot be empty' };
    }
    if (trimmedMessage.length > 100) {
      return { success: false, count: 0, error: 'Message too long (max 100 characters)' };
    }

    // 2. Check sender is event admin
    const { data: membership } = await (supabase
      .from('event_memberships') as any)
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', senderId)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership || ((membership as any).role !== 'owner' && (membership as any).role !== 'admin')) {
      reportError(new Error('Unauthorized broadcast attempt'), {
        scope: 'notifications',
        action: 'sendAdminBroadcast',
        userId: senderId,
        metadata: { eventId },
      });
      return { success: false, count: 0, error: 'Only event admins can send broadcasts' };
    }

    // 3. Get sender name
    const { data: sender } = await (supabase
      .from('users') as any)
      .select('name')
      .eq('id', senderId)
      .single();

    if (!sender) {
      return { success: false, count: 0, error: 'Sender not found' };
    }

    // 4. Get all active event members (except sender)
    const members = await getEventMembers(eventId);
    const recipientIds = members
      .filter(m => m.user_id !== senderId)
      .map(m => m.user_id);

    if (recipientIds.length === 0) {
      return { success: true, count: 0 };
    }

    // 5. Filter by opt-in preference
    const { data: users } = await (supabase
      .from('users') as any)
      .select('id, notification_prefs')
      .in('id', recipientIds);

    const optedInUsers = (users || []).filter((user: any) => {
      const prefs = user.notification_prefs as any;
      return prefs?.admin_broadcasts !== false;
    });

    if (optedInUsers.length === 0) {
      return { success: true, count: 0 };
    }

    // 6. Create notification template
    const template = NotificationTemplates.adminBroadcast(
      trimmedMessage,
      (sender as any).name,
      eventId
    );

    // 7. Enqueue notifications
    const notifications = optedInUsers.map((user: any) => ({
      user_id: user.id,
      type: 'admin_broadcast',
      title: template.title,
      body: template.body,
      data: template.data,
      priority: template.priority || 'normal',
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications as any);

    if (insertError) {
      if ((insertError as any)?.code === 'PGRST205' || (insertError as any)?.code === '42P01') {
        reportError(new Error('Cannot send broadcast: Supabase table `notifications` does not exist.'), { scope: 'notifications', action: 'replace_console' });
        return { success: false, count: 0, error: 'Notifications table not found' };
      }
      throw insertError;
    }

    return { success: true, count: optedInUsers.length };
  } catch (err: any) {
    reportError(err, {
      scope: 'notifications',
      action: 'sendAdminBroadcast',
      userId: senderId,
      metadata: { eventId },
    });
    return { success: false, count: 0, error: err.message || 'Failed to send broadcast' };
  }
}

