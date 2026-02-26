import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import { reportError } from "@/utils/logger";

const QR_BASE64_TIMEOUT_MS = 3000;

export const showUnavailable = (message: string) => {
  Alert.alert("Unavailable", message);
};

export const showNoActiveRound = (message: string) => {
  Alert.alert("No Active Round", message);
};

export const showNotAuthorized = (message: string) => {
  Alert.alert("Not Authorized", message);
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
    Alert.alert("Error", "Failed to generate QR image (timeout).");
    return null;
  }

  const cacheDirectory = (FileSystem as any).cacheDirectory;
  if (!cacheDirectory) {
    showUnavailable("File system is not available on this device.");
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
