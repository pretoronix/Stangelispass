import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { useHomeEventData } from "@/hooks/home/useHomeEventData";
import { useHomeSubscriptions } from "@/hooks/home/useHomeSubscriptions";
import { LeaderboardItem } from "@/components/features/LeaderboardItem";
import { useApp } from "@/providers/AppProvider";
import { BlurView } from "expo-blur";
import { MVPModal } from "@/components/features/MVPModal";
import { QRScanner } from "@/components/features/QRScanner";
import { calculateVelocity, prepareTrendData } from "@/utils/statsCalculator";
import { InviteModal } from "@/components/features/InviteModal";
import { BroadcastModal } from "@/components/notifications/BroadcastModal";
import { Confetti } from "@/components/animations/Confetti";
import { HomeModals } from "@/components/home/HomeModals";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import { usePacePreset } from "@/hooks/usePacePreset";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Extracted hooks
import { useHomeActions } from "@/hooks/home/useHomeActions";
import { useLeaderboardAnnouncements } from "@/hooks/home/useLeaderboardAnnouncements";
import { useScanHandler } from "@/hooks/home/useScanHandler";
import { useEventActions } from "@/hooks/home/useEventActions";
import { useExportData } from "@/hooks/home/useExportData";
import { useHomeStats } from "@/hooks/home/useHomeStats";

// Extracted components
import { StartRoundPrompt } from "@/components/home/StartRoundPrompt";
import { HomeHeader } from "@/components/home/HomeHeader";

// Extracted utilities
import {
  selectRandomPayer,
  calculateBill,
  getEventDurationLabel,
  getStartRoundPriceLabel,
} from "@/utils/home/homeHelpers";
import { getLeaderboardLinks } from "@/utils/links";

// Extracted styles
import { homeScreenStyles as styles } from "@/styles/screens/homeScreenStyles";

// Safety features
import { estimateBAC } from "@/services/safety";
import { SafeRideCard } from "@/components/features/SafeRideCard";

const showNoActiveRound = (message: string) => {
  Alert.alert("No Active Round", message);
};

const showAdminRequired = (message: string) => {
  Alert.alert("Admin Required", message);
};

const showPassRequired = (message: string) => {
  Alert.alert("Pass Required", message);
};

export default function HomeScreen() {
  const {
    currentUser,
    setCurrentUser,
    activeEvent,
    startEvent,
    closeEvent,
    showRecap,
    setShowRecap,
    eventPermissions,
  } = useApp();

  // Business logic & data hooks
  const {
    beerCounts,
    rawBeers,
    totalBeers,
    leaderInfo,
    leaderLead,
    hotStreak,
    gameStatsAvailable,
    loading,
    refreshing,
    refresh,
  } = useHomeEventData(activeEvent?.id);

  useHomeSubscriptions(activeEvent?.id, refresh);

  const [scanning, setScanning] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const pacePreset = usePacePreset();

  const {
    leaderAnnouncement,
    streakAnnouncement,
    showConfetti,
    setShowConfetti,
  } = useLeaderboardAnnouncements({
    activeEventId: activeEvent?.id,
    leaderInfo: leaderInfo ?? undefined,
    beerCounts,
    currentUserId: currentUser?.id,
  });

  const eventActions = useEventActions(
    setCurrentUser,
    startEvent as any,
    refresh,
  );
  const { handleExportData } = useExportData();
  const { handleScan } = useScanHandler(
    currentUser,
    activeEvent,
    eventPermissions,
    eventActions.openNamePrompt,
    setScanning,
    refresh,
  );

  // Derive all metrics and labels via hook
  const {
    groupVelocity,
    trendData,
    totalBill,
    winner,
    startRoundPriceLabel,
    activeEventDurationLabel,
    bacStats,
  } = useHomeStats({
    activeEvent,
    currentUser,
    rawBeers,
    totalBeers,
    leaderInfo,
    beerCounts,
  });

  const {
    handleSavePace,
    handleWhoPays,
    handleShareLeaderboard,
    handleStartRound,
  } = useHomeActions({
    currentUser,
    activeEvent,
    eventPermissions,
    startEvent: startEvent as any,
    eventActions,
    groupVelocity,
    savePace: pacePreset.savePace,
    beerCounts,
    selectRandomPayer,
    showAdminRequired,
    showNoActiveRound,
    showPassRequired,
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <HomeModals
        showRecap={showRecap}
        setShowRecap={setShowRecap}
        winner={winner}
        scanning={scanning}
        setScanning={setScanning}
        handleScan={handleScan}
        eventActions={eventActions}
        activeEvent={activeEvent}
        currentUser={currentUser}
        showInvite={showInvite}
        setShowInvite={setShowInvite}
        showBroadcast={showBroadcast}
        setShowBroadcast={setShowBroadcast}
        showConfetti={showConfetti}
        setShowConfetti={setShowConfetti}
      />

      {/* iOS Style Translucent Header Background */}
      {Platform.OS === "ios" && (
        <BlurView
          intensity={80}
          tint="dark"
          style={
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            } as any
          }
        />
      )}

      <FlatList
        data={beerCounts}
        keyExtractor={(item) => item.userId}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.itemWrapper,
              currentUser?.id === item.userId && styles.currentUserHighlight,
            ]}
          >
            <ErrorBoundary name="leaderboard_item">
              <LeaderboardItem
                item={item}
                index={index}
                isLeader={item.userId === leaderInfo?.userId}
              />
            </ErrorBoundary>
          </View>
        )}
        contentContainerStyle={styles.listContent as any}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            progressViewOffset={Platform.OS === "ios" ? 0 : 50}
          />
        }
        ListHeaderComponent={
          <View>
            <ErrorBoundary name="home_header">
              <HomeHeader
                activeEvent={activeEvent}
                currentUser={currentUser}
                eventPermissions={eventPermissions}
                onStartRound={handleStartRound}
                onWhoPays={handleWhoPays}
                onExport={() => activeEvent && handleExportData(activeEvent)}
                onScan={() => setScanning(true)}
                onEnd={closeEvent}
                onInvite={() => setShowInvite(true)}
                onShareLeaderboard={handleShareLeaderboard}
                onBroadcast={() => setShowBroadcast(true)}
                startRoundPriceLabel={startRoundPriceLabel}
                activeEventDurationLabel={activeEventDurationLabel}
                showVelocityCard={
                  !!activeEvent &&
                  (rawBeers.length > 0 || !!pacePreset.savedPace)
                }
                groupVelocity={groupVelocity}
                trendData={trendData}
                savedPace={pacePreset.savedPace}
                onSavePace={handleSavePace}
                onClearSavedPace={pacePreset.clearSavedPace}
                gameStatsAvailable={gameStatsAvailable}
                leaderInfo={leaderInfo}
                leaderLead={leaderLead}
                hotStreak={hotStreak}
                leaderAnnouncement={leaderAnnouncement ?? undefined}
                streakAnnouncement={streakAnnouncement ?? undefined}
                totalBeers={totalBeers}
                totalBill={totalBill}
              />
            </ErrorBoundary>
            {!!activeEvent && (
              <ErrorBoundary name="safe_ride">
                <SafeRideCard stats={bacStats} />
              </ErrorBoundary>
            )}
          </View>
        }
        ListEmptyComponent={<HomeEmptyState />}
      />
    </SafeAreaView>
  );
}
