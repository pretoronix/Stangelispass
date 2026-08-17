import { useRef } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { addBeer, joinEvent, redeemBeerStamp } from "@/services/supabase";
import { parseScanPayload } from "@/utils/scanPayload";
import { BADGES } from "@/services/achievements";
import { audioService } from "@/services/audio";
import { reportError, addBreadcrumb } from "@/utils/logger";
import { copy } from "@/ui/copy";

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
      copy.common.notAuthorized,
      copy.home.alerts.organizerOnlyScan,
    );
    return false;
  }
  if (!activeEventId) {
    Alert.alert(
      copy.home.alerts.noActiveRound,
      copy.home.alerts.qrNoActiveRound,
    );
    return false;
  }
  if (payloadEventId !== activeEventId) {
    Alert.alert(copy.home.alerts.wrongRound, copy.home.alerts.qrOtherEvent);
    return false;
  }
  return true;
};

const notifyNewBadges = (badgeKeys: string[]) => {
  if (badgeKeys.length === 0) return;
  const badgeNames = badgeKeys
    .map((b) => BADGES[b as keyof typeof BADGES]?.name || "Unknown")
    .filter(Boolean)
    .join(", ");
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => null,
  );
  Alert.alert(
    copy.home.alerts.achievementUnlocked,
    `You earned: ${badgeNames}\n\nBeer logged via scan!`,
    [{ text: copy.common.nice }],
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
  // Persist the de-dupe marker across renders. A plain `let` is re-initialised
  // on every render, so the 800ms duplicate-scan guard below would reset
  // whenever logging a beer triggers a re-render, allowing the same QR code to
  // be processed multiple times in quick succession.
  const lastScan = useRef<{ data: string; ts: number } | null>(null);
  const handleUnknownPayload = (data: string) => {
    addBreadcrumb("handleScan_unknown_payload", { data });
    Alert.alert(copy.common.alerts.invalidQr, copy.common.alerts.unknownQr);
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
            copy.home.alerts.joined,
            `You are now part of ${payload.eventName || "the round"}.`,
          );
        } catch (e) {
          reportError(new Error("Failed to join event membership"), {
            scope: "useScanHandler",
            action: "join_event",
            metadata: { cause: e instanceof Error ? e.message : String(e) },
          });
          Alert.alert(copy.common.error, copy.home.alerts.joinFailed);
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
        copy.common.selectUser,
        copy.home.alerts.selectUserForStamp,
      );
      return;
    }

    try {
      const redemption = await redeemBeerStamp(payload.stampId, currentUser.id);
      if (!redemption.ok) {
        const reasonMessage = {
          invalid_stamp: copy.home.alerts.stampInvalid,
          already_redeemed: copy.home.alerts.stampAlreadyRedeemed,
          expired_stamp: copy.home.alerts.stampExpired,
          stamps_unavailable: copy.home.alerts.stampsUnavailable,
        } as Record<string, string>;
        Alert.alert(
          copy.home.alerts.stamp,
          reasonMessage[redemption.reason] || copy.home.alerts.stampRedeemFailed,
        );
        setScanning(false);
        return;
      }

      audioService.playPsst();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null);

      const badges = redemption.newBadges || [];
      if (badges.length > 0) {
        const badgeNames = badges
          .map((b) => BADGES[b as keyof typeof BADGES]?.name || "Unknown")
          .filter(Boolean)
          .join(", ");
        Alert.alert(
          copy.home.alerts.stampRedeemed,
          `+1 beer added.\nNew badges: ${badgeNames}`,
        );
      } else {
        Alert.alert(copy.home.alerts.stampRedeemed, copy.home.alerts.stampAdded);
      }
    } catch (e) {
      reportError(e as Error, {
        scope: "useScanHandler",
        action: "redeem_stamp_catch",
      });
      Alert.alert(copy.common.error, copy.home.alerts.stampFailed);
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
        copy.common.selectUser,
        copy.home.alerts.selectUserForScan,
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
        copy.home.alerts.noActiveRound,
        copy.home.alerts.qrNoActiveRound,
      );
      return;
    }

    if (!eventPermissions.canManageLogs && payload.userId !== currentUser.id) {
      Alert.alert(
        copy.common.notAuthorized,
        copy.home.alerts.adminOnlyLogForOthers,
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
      Alert.alert(copy.common.error, copy.home.alerts.logBeerFailed);
    } finally {
      setScanning(false);
      await refreshSafely(refresh);
    }
  };

  const handleScan = async (data: string) => {
    try {
      const now = Date.now();
      if (
        lastScan.current &&
        lastScan.current.data === data &&
        now - lastScan.current.ts < 800
      ) {
        return;
      }
      lastScan.current = { data, ts: now };
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
      Alert.alert(copy.common.error, copy.home.alerts.scanFailed);
    } finally {
      addBreadcrumb("handleScan_complete");
    }
  };

  return { handleScan };
}
