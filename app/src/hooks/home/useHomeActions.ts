import { useCallback } from "react";
import { Platform, Alert, Share } from "react-native";
import { getLeaderboardLinks } from "@/utils/links";

interface UseHomeActionsProps {
  currentUser: any;
  activeEvent: any;
  eventPermissions: any;
  startEvent: (name: string, type: string) => Promise<void>;
  eventActions: any;
  groupVelocity: number;
  savePace: (pace: number) => void;
  beerCounts: any[];
  selectRandomPayer: (counts: any[]) => any;
  showAdminRequired: (msg: string) => void;
  showNoActiveRound: (msg: string) => void;
  showPassRequired: (msg: string) => void;
}

export function useHomeActions({
  currentUser,
  activeEvent,
  eventPermissions,
  startEvent,
  eventActions,
  groupVelocity,
  savePace,
  beerCounts,
  selectRandomPayer,
  showAdminRequired,
  showNoActiveRound,
  showPassRequired,
}: UseHomeActionsProps) {
  const handleSavePace = useCallback(() => {
    if (groupVelocity <= 0) return;
    savePace(groupVelocity);
  }, [groupVelocity, savePace]);

  const handleWhoPays = useCallback(
    () => selectRandomPayer(beerCounts),
    [beerCounts, selectRandomPayer],
  );

  const handleShareLeaderboard = useCallback(async () => {
    if (!activeEvent?.id) {
      showNoActiveRound("Start a round before sharing the leaderboard.");
      return;
    }

    const { nativeUrl, webUrl } = getLeaderboardLinks(activeEvent.id);

    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(webUrl);
        Alert.alert("Link Copied", "Leaderboard link copied to clipboard.");
        return;
      }
      Alert.alert("Leaderboard Link", webUrl);
      return;
    }

    await Share.share({
      message: webUrl,
      url: nativeUrl,
    });
  }, [activeEvent?.id, showNoActiveRound]);

  const handleStartRound = useCallback(async () => {
    if (!currentUser) {
      eventActions.openNamePrompt("start_round");
      return;
    }
    if (!eventPermissions.canManageEvent) {
      showAdminRequired("Only admins can start a round and invite others.");
      return;
    }
    try {
      await startEvent("Night Out", "day");
    } catch (_e) {
      if ((_e as Error)?.message === "NO_EVENT_CREDITS") {
        showPassRequired(
          "No event passes available. Purchase a day or weekend pass in Settings.",
        );
        return;
      }
      Alert.alert("Error", "Failed to start round. Please try again.");
    }
  }, [
    currentUser,
    eventActions,
    eventPermissions.canManageEvent,
    startEvent,
    showAdminRequired,
    showPassRequired,
  ]);

  return {
    handleSavePace,
    handleWhoPays,
    handleShareLeaderboard,
    handleStartRound,
  };
}
