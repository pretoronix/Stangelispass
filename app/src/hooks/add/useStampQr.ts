import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { createBeerStamp, Event, User } from "@/services/supabase";
import { reportError } from "@/utils/logger";
import { showNoActiveRound, showNotAuthorized } from "@/utils/add/addHelpers";

type QrMode = "stamp" | "log" | "participant_log";

type UseStampQrParams = {
  activeEvent: Event | null;
  currentUser: User | null;
  selectedUser: User | null;
  canIssueStamps: boolean;
  setQrMode: (mode: QrMode) => void;
  setStampId: (stampId: string | undefined) => void;
  openQrModal: () => void;
};

export const useStampQr = ({
  activeEvent,
  currentUser,
  selectedUser,
  canIssueStamps,
  setQrMode,
  setStampId,
  openQrModal,
}: UseStampQrParams) => {
  const [stampLoading, setStampLoading] = useState(false);

  const handleStampQr = useCallback(async () => {
    setQrMode("stamp");
    if (!canIssueStamps) {
      showNotAuthorized("Only admins can issue stamp QR codes.");
      return;
    }
    if (!activeEvent) {
      showNoActiveRound("Start a round before issuing stamp QR codes.");
      return;
    }
    if (!selectedUser || !currentUser) return;
    setStampLoading(true);
    try {
      const result = await createBeerStamp(
        selectedUser.id,
        activeEvent.id,
        currentUser.id,
      );
      if (result.fallbackLegacy) {
        Alert.alert(
          "Legacy QR",
          "Stamp table is not available yet. A legacy QR will be generated (not one-time).",
        );
        setStampId(undefined);
      } else if (!result.stamp) {
        Alert.alert(
          "Unavailable",
          "Stamp issuance is unavailable until the database is ready.",
        );
        return;
      } else {
        setStampId(result.stamp.id);
      }
    } catch (e) {
      reportError(new Error("Failed to create stamp"), {
        scope: "add",
        action: "create_stamp",
        metadata: { cause: e instanceof Error ? e.message : String(e) },
      });
      Alert.alert("Error", "Could not create stamp QR.");
      return;
    } finally {
      setStampLoading(false);
    }
    openQrModal();
  }, [
    activeEvent,
    canIssueStamps,
    currentUser,
    openQrModal,
    selectedUser,
    setQrMode,
    setStampId,
  ]);

  return { stampLoading, handleStampQr };
};
