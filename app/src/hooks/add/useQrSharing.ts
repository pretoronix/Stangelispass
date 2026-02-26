import { useCallback, useState } from "react";
import { Alert, Platform, View } from "react-native";
import * as Sharing from "expo-sharing";
import { User } from "@/services/supabase";
import { reportError } from "@/utils/logger";
import { captureView } from "@/utils/shareImage";
import {
  buildQrImageUriFromRef,
  canProceed,
  cleanupSharedFile,
  showUnavailable,
} from "@/utils/add/addHelpers";

type QrMode = "stamp" | "log" | "participant_log";

type UseQrSharingParams = {
  selectedUser: User | null;
  qrMode: QrMode;
  qrRef: React.RefObject<any>;
  qrViewRef: React.RefObject<View | null>;
};

export const useQrSharing = ({
  selectedUser,
  qrMode,
  qrRef,
  qrViewRef,
}: UseQrSharingParams) => {
  const [shareLoading, setShareLoading] = useState(false);

  const validateShareQr = useCallback(() => {
    if (!selectedUser) return false;
    if (Platform.OS === "web") {
      showUnavailable("Sharing QR codes is not supported on web.");
      return false;
    }
    if (qrMode === "participant_log") {
      return canProceed(!!qrViewRef.current, () => {
        showUnavailable("QR code image is not ready yet.");
      });
    }
    return canProceed(
      !!qrRef.current && typeof qrRef.current.toDataURL === "function",
      () => {
        showUnavailable("QR code image is not ready yet.");
      },
    );
  }, [qrMode, qrRef, qrViewRef, selectedUser]);

  const handleShareQr = useCallback(async () => {
    if (!validateShareQr() || !selectedUser) return;
    setShareLoading(true);
    let fileUri: string | null = null;
    try {
      if (qrMode === "participant_log") {
        fileUri = await captureView(qrViewRef, { format: "png", quality: 1 });
      } else {
        fileUri = await buildQrImageUriFromRef(qrRef, selectedUser.id);
      }
      if (!fileUri) return;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        showUnavailable("Sharing is not available on this device.");
      }
    } catch (e) {
      reportError(new Error("Failed to share QR"), {
        scope: "add",
        action: "share_qr",
        metadata: { cause: e instanceof Error ? e.message : String(e) },
      });
      Alert.alert("Error", "Could not share QR code.");
    } finally {
      setShareLoading(false);
      cleanupSharedFile(fileUri);
    }
  }, [qrMode, qrRef, qrViewRef, selectedUser, validateShareQr]);

  return {
    shareLoading,
    handleShareQr,
  };
};
