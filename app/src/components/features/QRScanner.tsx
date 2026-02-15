import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/lib/theme";
import * as Haptics from "expo-haptics";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  const requestPermissionCallback = useCallback(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    requestPermissionCallback();
  }, [requestPermissionCallback]);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Ionicons
          name="camera-outline"
          size={64}
          color={colors.textMuted}
          style={{ marginBottom: spacing.lg }}
        />
        <Text style={styles.text}>
          Camera access is required to scan QR codes.
        </Text>

        {permission.canAskAgain ? (
          <TouchableOpacity onPress={requestPermission} style={styles.button}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => Linking.openSettings()}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Open Settings</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (data && data.trim().length > 0) {
      onScan(data);
    } else {
      Alert.alert(
        "Invalid QR",
        "This code is not recognized by Stangelispass.",
      );
      setTimeout(() => setScanned(false), 2000);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        enableTorch={torch}
      />
      <View style={styles.overlay}>
        <View style={[styles.unfocusedContainer, styles.headerOverlay]}>
          <TouchableOpacity
            onPress={() => setTorch((t) => !t)}
            style={styles.torchButton}
          >
            <Ionicons
              name={torch ? "flash" : "flash-off"}
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.focusedWrapper}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.focusedContainer} />
          <View style={styles.unfocusedContainer} />
        </View>
        <View style={styles.unfocusedContainer}>
          <Text style={styles.instruction}>Center the QR code here</Text>
          <TouchableOpacity onPress={onClose} style={styles.bottomClose}>
            <Ionicons name="close-circle" size={64} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
  },
  buttonText: {
    ...typography.headline,
    color: "#FFFFFF",
  },
  closeButton: {
    marginTop: spacing.lg,
  },
  closeButtonText: {
    color: colors.textMuted,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerOverlay: {
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: spacing.xl,
  },
  torchButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  focusedWrapper: {
    flexDirection: "row",
    height: 250,
  },
  focusedContainer: {
    width: 250,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  instruction: {
    ...typography.headline,
    color: "#FFFFFF",
    marginTop: spacing.md,
  },
  bottomClose: {
    marginTop: spacing.xl,
    opacity: 0.8,
  },
});
