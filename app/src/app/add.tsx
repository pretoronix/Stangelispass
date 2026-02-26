import React, { useRef, useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, typography } from "@/lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { User } from "@/services/supabase";
import { useApp } from "@/providers/AppProvider";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { SelectedUserCard } from "@/components/add/SelectedUserCard";
import { SyncIndicator } from "@/components/ui/SyncIndicator";
import * as Haptics from "expo-haptics";
import { PourAnimation } from "@/components/animations/PourAnimation";
import { SimplePourFeedback } from "@/components/animations/SimplePourFeedback";
import { shouldShowAnimations } from "@/utils/deviceInfo";
import { AddUserGrid } from "@/components/add/AddUserGrid";
import { AddBeerModals } from "@/components/add/AddBeerModals";
import { useUserSelection } from "@/hooks/add/useUserSelection";
import { useQrSharing } from "@/hooks/add/useQrSharing";
import { useStampQr } from "@/hooks/add/useStampQr";
import { useAddBeerAction } from "@/hooks/add/useAddBeerAction";
import { showNoActiveRound, showNotAuthorized } from "@/utils/add/addHelpers";

export default function AddBeerScreen() {
  const {
    currentUser,
    users,
    activeEvent,
    eventPermissions,
    addOfflineMutation,
  } = useApp();
  const { isOnline } = useNetworkStatus();
  const { selectedUser, setSelectedUser, handleSelectUser, clearSelection } =
    useUserSelection();
  const [showQR, setShowQR] = useState(false);
  const [stampId, setStampId] = useState<string | undefined>(undefined);
  const [qrMode, setQrMode] = useState<"stamp" | "log" | "participant_log">(
    "stamp",
  );
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

  const { shareLoading, handleShareQr } = useQrSharing({
    selectedUser,
    qrMode,
    qrRef,
    qrViewRef,
  });

  const { loading, handleAddBeer } = useAddBeerAction({
    currentUser,
    selectedUser,
    activeEvent,
    canManageLogs: eventPermissions.canManageLogs,
    isOnline,
    addOfflineMutation,
    onAnimationStart: () => setShowAnimation(true),
    onAnimationStop: () => setShowAnimation(false),
    onUserCleared: clearSelection,
  });

  const { stampLoading, handleStampQr } = useStampQr({
    activeEvent,
    currentUser,
    selectedUser,
    canIssueStamps: eventPermissions.canIssueStamps,
    setQrMode,
    setStampId,
    openQrModal,
  });

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false);
  }, []);

  const handleUserQr = useCallback(() => {
    setQrMode("log");
    if (!activeEvent) {
      showNoActiveRound("Start a round before sharing user QR codes.");
      return;
    }
    if (!selectedUser) return;
    setStampId(undefined);
    openQrModal();
  }, [activeEvent, openQrModal, selectedUser]);

  const handleParticipantQr = useCallback(() => {
    setQrMode("participant_log");
    if (!activeEvent) {
      showNoActiveRound("Start a round before sharing participant QR codes.");
      return;
    }
    if (!eventPermissions.canManageLogs) {
      showNotAuthorized("Only organizers can generate participant QR codes.");
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

        <AddBeerModals
          showQR={showQR}
          closeQrModal={closeQrModal}
          selectedUser={selectedUser}
          activeEvent={activeEvent}
          stampId={stampId}
          qrMode={qrMode}
          handleShareQr={handleShareQr}
          shareLoading={shareLoading}
          qrRef={qrRef}
          qrViewRef={qrViewRef}
          useFullAnimation={useFullAnimation}
          showAnimation={showAnimation}
          handleAnimationComplete={handleAnimationComplete}
        />
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
