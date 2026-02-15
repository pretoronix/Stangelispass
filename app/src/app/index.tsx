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
import { useBeers } from "@/hooks/useBeers";
import { LeaderboardItem } from "@/components/features/LeaderboardItem";
import { useApp } from "@/providers/AppProvider";
import { BlurView } from "expo-blur";
import { MVPModal } from "@/components/features/MVPModal";
import { QRScanner } from "@/components/features/QRScanner";
import { calculateVelocity, prepareTrendData } from "@/utils/statsCalculator";
import { InviteModal } from "@/components/features/InviteModal";
import { BroadcastModal } from "@/components/notifications/BroadcastModal";
import { Confetti } from "@/components/animations/Confetti";
import { usePacePreset } from "@/hooks/usePacePreset";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Extracted hooks
import { useLeaderboardAnnouncements } from "@/hooks/home/useLeaderboardAnnouncements";
import { useScanHandler } from "@/hooks/home/useScanHandler";
import { useEventActions } from "@/hooks/home/useEventActions";
import { useExportData } from "@/hooks/home/useExportData";

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

// Extracted styles
import { homeScreenStyles as styles } from "@/styles/screens/homeScreenStyles";

// Safety features
import { estimateBAC } from "@/services/safety";
import { SafeRideCard } from "@/components/features/SafeRideCard";

export default function HomeScreen() {
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
  } = useBeers();
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

  const [scanning, setScanning] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const pacePreset = usePacePreset();

  // Custom hooks for business logic
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

  // Calculate metrics
  const groupVelocity = calculateVelocity(
    rawBeers.map((b) => b.created_at),
    activeEvent?.created_at,
  );
  const trendData = prepareTrendData(rawBeers.map((b) => b.created_at));
  const beerPriceFromEvent = activeEvent?.beer_price ?? 5.0;
  const totalBill = calculateBill(totalBeers, beerPriceFromEvent);
  const winner = leaderInfo ?? beerCounts[0];
  const startRoundPriceLabel = getStartRoundPriceLabel();
  const activeEventDurationLabel = getEventDurationLabel(
    activeEvent?.pass_type,
  );

  // Safety Stats
  const currentUserStats = beerCounts.find((b) => b.userId === currentUser?.id);
  const bacStats = estimateBAC(
    currentUserStats?.count || 0,
    activeEvent?.created_at ? new Date(activeEvent.created_at) : new Date(),
    currentUser,
  );

  const handleSavePace = React.useCallback(() => {
    if (groupVelocity <= 0) return;
    pacePreset.savePace(groupVelocity);
  }, [groupVelocity, pacePreset.savePace]);

  // Event handlers
  const handleWhoPays = () => selectRandomPayer(beerCounts);
  const handleStartRound = async () => {
    if (!currentUser) {
      eventActions.openNamePrompt("start_round");
      return;
    }
    if (!eventPermissions.canManageEvent) {
      Alert.alert(
        "Admin Required",
        "Only admins can start a round and invite others.",
      );
      return;
    }
    try {
      await startEvent("Night Out", "day");
    } catch (_e) {
      if ((_e as Error)?.message === "NO_EVENT_CREDITS") {
        Alert.alert(
          "Pass Required",
          "No event passes available. Purchase a day or weekend pass in Settings.",
        );
        return;
      }
      Alert.alert("Error", "Failed to start round. Please try again.");
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* MVP Recap Modal */}
      <MVPModal
        visible={showRecap}
        onClose={() => setShowRecap(false)}
        winnerName={winner?.name || "Unknown"}
        totalBeers={winner?.count || 0}
      />

      {/* QR Scanner Modal */}
      <Modal
        visible={scanning}
        animationType="slide"
        onRequestClose={() => setScanning(false)}
      >
        <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />
      </Modal>

      {/* Start Round / Join Event Prompt */}
      <StartRoundPrompt
        visible={eventActions.showStartRoundPrompt}
        pendingAction={eventActions.pendingAction}
        startRoundName={eventActions.startRoundName}
        setStartRoundName={eventActions.setStartRoundName}
        beerPrice={eventActions.beerPrice}
        setBeerPrice={eventActions.setBeerPrice}
        pendingJoinEventName={eventActions.pendingJoinEventName}
        promptSubmitting={eventActions.promptSubmitting}
        onSubmit={eventActions.submitNamePrompt}
        onCancel={() => {
          eventActions.setStartRoundName("");
          eventActions.setBeerPrice("5.00");
          eventActions.setShowStartRoundPrompt(false);
        }}
      />

      <InviteModal
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        eventId={activeEvent?.id || ""}
        eventName={activeEvent?.name || ""}
      />

      {activeEvent && currentUser && (
        <BroadcastModal
          visible={showBroadcast}
          onClose={() => setShowBroadcast(false)}
          eventId={activeEvent.id}
          senderId={currentUser.id}
          eventName={activeEvent.name}
        />
      )}

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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="beer-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No beers logged yet!</Text>
            <Text style={styles.emptySubtext}>Time to start tracking? </Text>
          </View>
        }
      />

      {/* 🎉 Confetti Animation for leader changes & achievements */}
      <Confetti
        trigger={showConfetti}
        count={150}
        origin={{ x: Dimensions.get("window").width / 2, y: 0 }}
        explosionSpeed={350}
        fallSpeed={2500}
        onAnimationEnd={() => setShowConfetti(false)}
      />
    </SafeAreaView>
  );
}
