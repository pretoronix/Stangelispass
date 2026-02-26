import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { addBeer, Event, User } from "@/services/supabase";
import { BADGES } from "@/services/achievements";
import { reportError } from "@/utils/logger";
import {
  showNoActiveRound,
  showNotAuthorized,
  showUnavailable,
} from "@/utils/add/addHelpers";
import type { OfflineMutation } from "@/hooks/useOfflineMutations";

type UseAddBeerActionParams = {
  currentUser: User | null;
  selectedUser: User | null;
  activeEvent: Event | null;
  canManageLogs: boolean;
  isOnline: boolean;
  addOfflineMutation: (
    mutation: Omit<OfflineMutation, "id" | "timestamp">,
  ) => Promise<void>;
  onAnimationStart: () => void;
  onAnimationStop: () => void;
  onUserCleared: () => void;
};

export const useAddBeerAction = ({
  currentUser,
  selectedUser,
  activeEvent,
  canManageLogs,
  isOnline,
  addOfflineMutation,
  onAnimationStart,
  onAnimationStop,
  onUserCleared,
}: UseAddBeerActionParams) => {
  const [loading, setLoading] = useState(false);

  const handleAddBeer = useCallback(async () => {
    if (!selectedUser || !currentUser) return;

    if (!activeEvent) {
      showNoActiveRound(
        "Please start a round from the Home screen before logging beers. ",
      );
      return;
    }

    if (!canManageLogs && selectedUser.id !== currentUser.id) {
      showNotAuthorized("Only admins can add beers for other users.");
      return;
    }

    const mutationPayload = {
      userId: selectedUser.id,
      addedBy: currentUser.id,
      eventId: activeEvent.id,
    };

    setLoading(true);
    onAnimationStart();

    try {
      if (!isOnline) {
        await addOfflineMutation({
          type: "addBeer",
          data: mutationPayload,
        });
        Alert.alert("Queued", "Beer will be logged when you reconnect.");
        onUserCleared();
        return;
      }

      const { beer, newBadges } = await addBeer(
        mutationPayload.userId,
        mutationPayload.addedBy,
        mutationPayload.eventId,
      );
      if (!beer) {
        onAnimationStop();
        showUnavailable(
          "Beer logging is unavailable until the database is ready.",
        );
        return;
      }

      if (newBadges.length > 0) {
        const badgeNames = newBadges.map((b) => BADGES[b].name).join(", ");
        setTimeout(() => {
          Alert.alert(
            "🏆 Achievement Unlocked!",
            `You earned: ${badgeNames}\n\nAdded a beer for ${selectedUser.name}!`,
            [{ text: "Awesome!" }],
          );
        }, 500);
      }

      onUserCleared();
    } catch (e) {
      onAnimationStop();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => null,
      );
      Alert.alert("Error", "Failed to add beer. Please try again.");
      reportError(e as Error, { scope: "add", action: "replace_console" });
    } finally {
      setLoading(false);
    }
  }, [
    activeEvent,
    addOfflineMutation,
    canManageLogs,
    currentUser,
    isOnline,
    onAnimationStart,
    onAnimationStop,
    onUserCleared,
    selectedUser,
  ]);

  return { loading, handleAddBeer };
};
