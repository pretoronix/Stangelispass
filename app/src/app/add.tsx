import React, { useRef, useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Alert, Platform } from "react-native";
import { colors, spacing, borderRadius, typography } from "@/lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, addBeer, createBeerStamp } from "@/services/supabase";
import { useApp } from "@/providers/AppProvider";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { SelectedUserCard } from "@/components/add/SelectedUserCard";
import { SyncIndicator } from "@/components/ui/SyncIndicator";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { BADGES } from "@/services/achievements";
import { PourAnimation } from "@/components/animations/PourAnimation";
import { SimplePourFeedback } from "@/components/animations/SimplePourFeedback";
import { shouldShowAnimations } from "@/utils/deviceInfo";
import { reportError } from "@/utils/logger";
import { AddUserGrid } from "@/components/add/AddUserGrid";
import { AddQrModal } from "@/components/add/AddQrModal";
import { captureView } from "@/utils/shareImage";

export default function AddBeerScreen() {
  const {
    currentUser,
    users,
    activeEvent,
    eventPermissions,
    addOfflineMutation,
  } = useApp();
  const { isOnline } = useNetworkStatus();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [stampLoading, setStampLoading] = useState(false);
  const [stampId, setStampId] = useState<string | undefined>(undefined);
  const [qrMode, setQrMode] = useState<"stamp" | "log" | "participant_log">(
    "stamp",
  );
  const [shareLoading, setShareLoading] = useState(false);
  const qrRef = useRef<any>(null);
  const qrViewRef = useRef<View | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [useFullAnimation, setUseFullAnimation] = useState(true);

  // Check device capability on mount
  useEffect(() => {
    shouldShowAnimations().then(setUseFullAnimation);
  }, []);

  const openQrModal = useCallback(() => setShowQR(true), []);
  const closeQrModal = useCallback(() => {
    setShowQR(false);
    setStampId(undefined);
  }, []);

  const validateShareQr = useCallback(() => {
    if (!selectedUser) return false;
    if (Platform.OS === "web") {
      Alert.alert("Unavailable", "Sharing QR codes is not supported on web.");
      return false;
    }
    if (qrMode === "participant_log") {
      if (!qrViewRef.current) {
        Alert.alert("Unavailable", "QR code image is not ready yet.");
        return false;
      }
      return true;
    }
    if (!qrRef.current || typeof qrRef.current.toDataURL !== "function") {
      Alert.alert("Unavailable", "QR code image is not ready yet.");
      return false;
    }
    return true;
  }, [qrMode, selectedUser]);

  const buildQrImageUri = useCallback(async (userId: string) => {
    const base64 = await new Promise<string | null>((resolve) => {
      const timeoutId = setTimeout(() => resolve(null), 3000);
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
      Alert.alert(
        "Unavailable",
        "File system is not available on this device.",
      );
      return null;
    }
    const fileUri = `${cacheDirectory}qr-${userId}-${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: "base64",
    });
    return fileUri;
  }, []);

  const handleShareQr = useCallback(async () => {
    if (!validateShareQr() || !selectedUser) return;
    setShareLoading(true);
    let fileUri: string | null = null;
    try {
      if (qrMode === "participant_log") {
        fileUri = await captureView(qrViewRef, { format: "png", quality: 1 });
      } else {
        fileUri = await buildQrImageUri(selectedUser.id);
      }
      if (!fileUri) return;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Unavailable", "Sharing is not available on this device.");
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
      // Clean up temporary file
      if (fileUri) {
        FileSystem.deleteAsync(fileUri, { idempotent: true }).catch((err) => {
          reportError(err, { scope: "add", action: "qr_cache_cleanup" });
        });
      }
    }
  }, [buildQrImageUri, captureView, qrMode, selectedUser, validateShareQr]);

  const handleAddBeer = useCallback(async () => {
    if (!selectedUser || !currentUser) return;

    if (!activeEvent) {
      Alert.alert(
        "No Active Round",
        "Please start a round from the Home screen before logging beers. ",
      );
      return;
    }

    // Allow regular users to add beers for themselves, but only admins can add for others
    if (!eventPermissions.canManageLogs && selectedUser.id !== currentUser.id) {
      Alert.alert(
        "Not Authorized",
        "Only admins can add beers for other users.",
      );
      return;
    }

    const mutationPayload = {
      userId: selectedUser.id,
      addedBy: currentUser.id,
      eventId: activeEvent.id,
    };

    setLoading(true);

    // Show animation immediately (optimistic)
    setShowAnimation(true);

    try {
      if (!isOnline) {
        await addOfflineMutation({
          type: "addBeer",
          data: mutationPayload,
        });
        Alert.alert("Queued", "Beer will be logged when you reconnect.");
        setSelectedUser(null);
        return;
      }

      const { beer, newBadges } = await addBeer(
        mutationPayload.userId,
        mutationPayload.addedBy,
        mutationPayload.eventId,
      );
      if (!beer) {
        setShowAnimation(false);
        Alert.alert(
          "Unavailable",
          "Beer logging is unavailable until the database is ready.",
        );
        return;
      }

      // Animation will handle haptics, no manual haptic needed

      // After animation completes, show achievements if any
      if (newBadges.length > 0) {
        const badgeNames = newBadges.map((b) => BADGES[b].name).join(", ");
        // Delay alert until after animation
        setTimeout(() => {
          Alert.alert(
            "🏆 Achievement Unlocked!",
            `You earned: ${badgeNames}\n\nAdded a beer for ${selectedUser.name}!`,
            [{ text: "Awesome!" }],
          );
        }, 500);
      }

      setSelectedUser(null);
    } catch (e) {
      setShowAnimation(false);
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
    currentUser,
    eventPermissions.canManageLogs,
    isOnline,
    selectedUser,
  ]);

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false);
  }, []);

  const handleSelectUser = useCallback((user: User) => {
    Haptics.selectionAsync().catch(() => null);
    setSelectedUser(user);
  }, []);

  const handleStampQr = useCallback(async () => {
    setQrMode("stamp");
    if (!eventPermissions.canIssueStamps) {
      Alert.alert("Not Authorized", "Only admins can issue stamp QR codes.");
      return;
    }
    if (!activeEvent) {
      Alert.alert(
        "No Active Round",
        "Start a round before issuing stamp QR codes.",
      );
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
    currentUser,
    eventPermissions.canIssueStamps,
    openQrModal,
    selectedUser,
  ]);

  const handleUserQr = useCallback(() => {
    setQrMode("log");
    if (!activeEvent) {
      Alert.alert(
        "No Active Round",
        "Start a round before sharing user QR codes.",
      );
      return;
    }
    if (!selectedUser) return;
    setStampId(undefined);
    openQrModal();
  }, [activeEvent, openQrModal, selectedUser]);

  const handleParticipantQr = useCallback(() => {
    setQrMode("participant_log");
    if (!activeEvent) {
      Alert.alert(
        "No Active Round",
        "Start a round before sharing participant QR codes.",
      );
      return;
    }
    if (!eventPermissions.canManageLogs) {
      Alert.alert(
        "Not Authorized",
        "Only organizers can generate participant QR codes.",
      );
      return;
    }
    if (!selectedUser) return;
    setStampId(undefined);
    openQrModal();
  }, [activeEvent, eventPermissions.canManageLogs, openQrModal, selectedUser]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Who's drinking?</Text>
        <SyncIndicator />
        {!isOnline && (
          <Text style={styles.offlineWarning}>
            Offline - changes will sync when you reconnect.
          </Text>
        )}

        <AddUserGrid
          users={users}
          selectedUserId={selectedUser?.id}
          onSelectUser={handleSelectUser}
        />

        {selectedUser && (
          <SelectedUserCard
            user={selectedUser}
            loading={loading}
            canIssueStamps={eventPermissions.canIssueStamps && !stampLoading}
            hasActiveEvent={!!activeEvent}
            showParticipantQr={
              !!activeEvent && eventPermissions.canManageLogs && !stampLoading
            }
            onAddBeer={handleAddBeer}
            onStampQr={handleStampQr}
            onUserQr={handleUserQr}
            onParticipantQr={handleParticipantQr}
          />
        )}

        <AddQrModal
          visible={showQR}
          onClose={closeQrModal}
          selectedUser={selectedUser}
          eventName={activeEvent?.name}
          eventId={activeEvent?.id}
          stampId={stampId}
          mode={qrMode}
          onShareQr={handleShareQr}
          shareLoading={shareLoading}
          onQrRef={(ref) => {
            qrRef.current = ref;
          }}
          qrViewRef={qrViewRef}
        />

        {/* Pour Animation */}
        {useFullAnimation ? (
          <PourAnimation
            visible={showAnimation}
            onComplete={handleAnimationComplete}
          />
        ) : (
          <SimplePourFeedback
            visible={showAnimation}
            onComplete={handleAnimationComplete}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    ...typography.largeTitle,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  offlineWarning: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
});
