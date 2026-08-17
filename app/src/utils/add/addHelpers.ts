import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import { reportError } from "@/utils/logger";
import { copy } from "@/ui/copy";

const QR_BASE64_TIMEOUT_MS = 3000;

export const showUnavailable = (message: string) => {
  Alert.alert(copy.common.unavailable, message);
};

export const showNoActiveRound = (message: string) => {
  Alert.alert(copy.home.alerts.noActiveRound, message);
};

export const showNotAuthorized = (message: string) => {
  Alert.alert(copy.common.notAuthorized, message);
};

export const canProceed = (condition: boolean, onFail: () => void) => {
  if (!condition) {
    onFail();
  }
  return condition;
};

export const buildQrImageUriFromRef = async (
  qrRef: React.RefObject<any>,
  userId: string,
) => {
  const base64 = await new Promise<string | null>((resolve) => {
    const timeoutId = setTimeout(() => resolve(null), QR_BASE64_TIMEOUT_MS);
    qrRef.current.toDataURL((data: string) => {
      clearTimeout(timeoutId);
      resolve(data);
    });
  });

  if (!base64) {
    Alert.alert(copy.common.error, copy.add.alerts.qrImageTimeout);
    return null;
  }

  const cacheDirectory = (FileSystem as any).cacheDirectory;
  if (!cacheDirectory) {
    showUnavailable(copy.common.alerts.noFileSystem);
    return null;
  }
  const fileUri = `${cacheDirectory}qr-${userId}-${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: "base64",
  });
  return fileUri;
};

export const cleanupSharedFile = (fileUri: string | null) => {
  if (!fileUri) return;
  FileSystem.deleteAsync(fileUri, { idempotent: true }).catch((err) => {
    reportError(err, { scope: "add", action: "qr_cache_cleanup" });
  });
};
