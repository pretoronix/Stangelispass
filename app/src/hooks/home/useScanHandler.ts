import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { addBeer, joinEvent, redeemBeerStamp } from "@/services/supabase";
import { parseScanPayload } from "@/utils/scanPayload";
import { BADGES } from "@/services/achievements";
import { audioService } from "@/services/audio";
import { reportError, addBreadcrumb } from "@/utils/logger";

interface User {
  id: string;
}

interface Event {
  id: string;
}

interface EventPermissions {
  canManageLogs: boolean;
}

const refreshSafely = async (refresh: () => void) => {
  try {
    refresh();
  } catch (refreshError) {
    reportError(refreshError as Error, {
      scope: "useScanHandler",
      action: "post_action_refresh",
    });
  }
};

const validateParticipantQr = (
  payloadEventId: string | undefined,
  activeEventId: string | undefined,
  canManageLogs: boolean,
) => {
  if (!payloadEventId) {
    return true;
  }
  if (!canManageLogs) {
    Alert.alert(
      "Not Authorized",
      "Only organizers can scan participant QR codes.",
    );
    return false;
  }
  if (!activeEventId) {
    Alert.alert(
      "No Active Round",
      "This QR code is not linked to an active round.",
    );
    return false;
  }
  if (payloadEventId !== activeEventId) {
    Alert.alert("Wrong Round", "This QR code belongs to a different event.");
    return false;
  }
  return true;
};

const notifyNewBadges = (badgeKeys: string[]) => {
  if (badgeKeys.length === 0) return;
  const badgeNames = badgeKeys
    .map((b) => BADGES[b]?.name || "Unknown")
    .filter(Boolean)
    .join(", ");
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => null,
  );
  Alert.alert(
    "🏆 Achievement Unlocked!",
    `You earned: ${badgeNames}\n\nBeer logged via scan!`,
    [{ text: "Woohoo!" }],
  );
};

export function useScanHandler(
  currentUser: User | null,
  activeEvent: Event | null,
  eventPermissions: EventPermissions,
  openNamePrompt: (
    action: "start_round" | "join_event",
    eventName?: string,
    eventId?: string,
  ) => void,
  setScanning: (value: boolean) => void,
  refresh: () => void,
) {
  let lastScan: { data: string; ts: number } | null = null;
  const handleUnknownPayload = (data: string) => {
    addBreadcrumb("handleScan_unknown_payload", { data });
    Alert.alert("Invalid QR", "This code is not recognized by Stangelispass.");
  };

  const handleJoinEvent = async (payload: {
    eventId?: string;
    eventName?: string;
  }) => {
    if (currentUser) {
      if (payload.eventId) {
        try {
          await joinEvent(payload.eventId, currentUser.id);
          Alert.alert(
            "Joined!",
            `You are now part of ${payload.eventName || "the round"}.`,
          );
        } catch (e) {
          reportError(new Error("Failed to join event membership"), {
            scope: "useScanHandler",
            action: "join_event",
            metadata: { cause: e instanceof Error ? e.message : String(e) },
          });
          Alert.alert("Error", "Failed to join the round. Please try again.");
        }
      }
      setScanning(false);
      return;
    }

    openNamePrompt(
      "join_event",
      payload.eventName || "the round",
      payload.eventId,
    );
    setScanning(false);
  };

  const handleStampRedeem = async (payload: { stampId: string }) => {
    if (!currentUser) {
      Alert.alert(
        "Select User",
        "Please select a user in Settings before redeeming stamps.",
      );
      return;
    }

    try {
      const redemption = await redeemBeerStamp(payload.stampId, currentUser.id);
      if (!redemption.ok) {
        const reasonMessage = {
          invalid_stamp: "This stamp is invalid.",
          already_redeemed: "This stamp has already been redeemed.",
          expired_stamp: "This stamp has expired.",
          stamps_unavailable:
            "Stamp feature is not available in the database yet.",
        } as Record<string, string>;
        Alert.alert(
          "Stamp",
          reasonMessage[redemption.reason] || "Could not redeem stamp.",
        );
        setScanning(false);
        return;
      }

      audioService.playPsst();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null);

      const badges = redemption.newBadges || [];
      if (badges.length > 0) {
        const badgeNames = badges
          .map((b) => BADGES[b]?.name || "Unknown")
          .filter(Boolean)
          .join(", ");
        Alert.alert(
          "Stamp Redeemed",
          `+1 beer added.\nNew badges: ${badgeNames}`,
        );
      } else {
        Alert.alert("Stamp Redeemed", "+1 beer added successfully.");
      }
    } catch (e) {
      reportError(e as Error, {
        scope: "useScanHandler",
        action: "redeem_stamp_catch",
      });
      Alert.alert("Error", "An error occurred while redeeming the stamp.");
    } finally {
      setScanning(false);
      await refreshSafely(refresh);
    }
  };

  const handleBeerLog = async (payload: {
    userId: string;
    eventId?: string;
  }) => {
    if (!currentUser) {
      Alert.alert(
        "Select User",
        "Please select a user in Settings before scanning beer QR codes.",
      );
      return;
    }
    if (
      !validateParticipantQr(
        payload.eventId,
        activeEvent?.id,
        eventPermissions.canManageLogs,
      )
    ) {
      return;
    }

    const effectiveEventId = payload.eventId || activeEvent?.id;
    if (!effectiveEventId) {
      Alert.alert(
        "No Active Round",
        "This QR code is not linked to an active round.",
      );
      return;
    }

    if (!eventPermissions.canManageLogs && payload.userId !== currentUser.id) {
      Alert.alert(
        "Not Authorized",
        "Only admins can log beers for other users.",
      );
      return;
    }

    try {
      const result = await addBeer(
        payload.userId,
        currentUser.id,
        effectiveEventId,
      );
      const newBadges = result?.newBadges || [];

      audioService.playPsst();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null);

      notifyNewBadges(newBadges);
    } catch (e) {
      reportError(e as Error, {
        scope: "useScanHandler",
        action: "scan_add_beer",
      });
      Alert.alert("Error", "Failed to log beer. Please try again.");
    } finally {
      setScanning(false);
      await refreshSafely(refresh);
    }
  };

  const handleScan = async (data: string) => {
    try {
      const now = Date.now();
      if (lastScan && lastScan.data === data && now - lastScan.ts < 800) {
        return;
      }
      lastScan = { data, ts: now };
      addBreadcrumb("handleScan_start", { dataLength: data?.length });
      const payload = parseScanPayload(data);
      if (payload.type === "unknown") {
        handleUnknownPayload(data);
        return;
      }

      addBreadcrumb(`handleScan_type_${payload.type}`, { payload });

      if (payload.type === "join_event") {
        await handleJoinEvent(payload);
        return;
      }

      if (payload.type === "stamp_redeem") {
        await handleStampRedeem(payload);
        return;
      }

      if (payload.type === "beer_log") {
        await handleBeerLog(payload);
        return;
      }
    } catch (e) {
      addBreadcrumb(
        "handleScan_crash",
        { error: e instanceof Error ? e.message : String(e) },
        "error",
      );
      reportError(e as Error, {
        scope: "useScanHandler",
        action: "handleScan_outer_catch",
      });
      Alert.alert("Error", "Failed to process scan.");
    } finally {
      addBreadcrumb("handleScan_complete");
    }
  };

  return { handleScan };
}
