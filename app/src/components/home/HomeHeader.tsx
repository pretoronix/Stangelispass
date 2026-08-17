import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { VelocityMetricCard } from "@/components/features/VelocityMetricCard";
import { labels } from "@/ui/labels";
import type { Event, EventPermissions, User } from "@/services/supabase";
import type { UserBeerCount } from "@/hooks/useBeers";
import { homeScreenStyles as styles } from "@/styles/screens/homeScreenStyles";
import { copy } from "@/ui/copy";

type HomeHeaderProps = {
  activeEvent: Event | null;
  currentUser: User | null;
  eventPermissions: EventPermissions;
  onStartRound: () => void;
  onWhoPays: () => void;
  onExport: () => void;
  onScan: () => void;
  onEnd: () => void;
  onInvite: () => void;
  onShareLeaderboard: () => void;
  onBroadcast: () => void;
  startRoundPriceLabel: string;
  activeEventDurationLabel: string;
  showVelocityCard: boolean;
  groupVelocity: number;
  trendData: { value: number; label: string }[];
  savedPace?: number | null;
  onSavePace?: () => void;
  onClearSavedPace?: () => void;
  gameStatsAvailable: boolean;
  leaderInfo: UserBeerCount | null;
  leaderLead: number;
  hotStreak: UserBeerCount | null;
  leaderAnnouncement?: string;
  streakAnnouncement?: string;
  totalBeers: number;
  totalBill: number;
};

export function HomeHeader({
  activeEvent,
  currentUser,
  eventPermissions,
  onStartRound,
  onWhoPays,
  onExport,
  onScan,
  onEnd,
  onInvite,
  onShareLeaderboard,
  onBroadcast,
  startRoundPriceLabel,
  activeEventDurationLabel,
  showVelocityCard,
  groupVelocity,
  trendData,
  savedPace,
  onSavePace,
  onClearSavedPace,
  gameStatsAvailable,
  leaderInfo,
  leaderLead,
  hotStreak,
  leaderAnnouncement,
  streakAnnouncement,
  totalBeers,
  totalBill,
}: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      {!activeEvent ? (
        <View style={styles.startEventBanner}>
          <Ionicons name="sparkles" size={24} color={colors.primary} />
          <Text style={styles.startEventText}>{copy.home.noActiveRound}</Text>
          <Button
            title={`${copy.home.startRound} (${startRoundPriceLabel})`}
            testID={labels.home.startRound.testID}
            accessibilityLabel={labels.home.startRound.accessibilityLabel}
            onPress={onStartRound}
            style={styles.startButton}
          />
          <Text style={styles.trialText}>{copy.home.firstRoundFree}</Text>
        </View>
      ) : (
        <View style={styles.activeEventBanner}>
          <View style={styles.eventInfo}>
            <Text style={styles.activeEventName}>{activeEvent.name}</Text>
            <Text style={styles.activeEventTime}>
              {activeEventDurationLabel}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannerActions}
          >
            <Button
              title={copy.home.whoPays}
              testID={labels.home.whoPays.testID}
              accessibilityLabel={labels.home.whoPays.accessibilityLabel}
              onPress={onWhoPays}
              icon="cash-outline"
              variant="ghost"
              style={styles.whoPaysButton}
            />
            <Button
              title={copy.home.export}
              testID={labels.home.export.testID}
              accessibilityLabel={labels.home.export.accessibilityLabel}
              onPress={onExport}
              icon="download-outline"
              variant="ghost"
              style={styles.exportButton}
            />
            <Button
              title={copy.home.scan}
              testID={labels.home.scan.testID}
              accessibilityLabel={labels.home.scan.accessibilityLabel}
              onPress={onScan}
              icon="qr-code"
              style={styles.scanButton}
            />
            <Button
              title={copy.home.endRound}
              testID={labels.home.endRound.testID}
              accessibilityLabel={labels.home.endRound.accessibilityLabel}
              onPress={onEnd}
              variant="ghost"
              disabled={!eventPermissions.canCloseEvent}
              style={styles.endButton}
            />
            {eventPermissions.canInvite && (
              <Button
                title={copy.home.invite}
                testID={labels.home.invite.testID}
                accessibilityLabel={labels.home.invite.accessibilityLabel}
                onPress={onInvite}
                icon="person-add-outline"
                variant="ghost"
                style={styles.inviteButton}
              />
            )}
            <Button
              title={copy.home.shareLeaderboard}
              testID={labels.home.shareLeaderboard.testID}
              accessibilityLabel={
                labels.home.shareLeaderboard.accessibilityLabel
              }
              onPress={onShareLeaderboard}
              icon="share-social-outline"
              variant="ghost"
              style={styles.shareLeaderboardButton}
            />
            {eventPermissions.canManageEvent && currentUser && (
              <Button
                title={copy.home.notifyAll}
                testID="home.notify_all"
                accessibilityLabel="Broadcast notification to all members"
                onPress={onBroadcast}
                icon="megaphone-outline"
                variant="ghost"
                style={styles.broadcastButton}
              />
            )}
          </ScrollView>
        </View>
      )}

      {showVelocityCard && (
        <VelocityMetricCard
          velocity={groupVelocity}
          trendData={trendData}
          savedPace={savedPace}
          onSavePace={onSavePace}
          onClearSavedPace={onClearSavedPace}
        />
      )}

      {gameStatsAvailable && (leaderInfo || hotStreak) && (
        <View style={styles.gameSummaryRow}>
          {leaderInfo && (
            <View style={styles.gameChip}>
              <Ionicons name="trophy" size={14} color={colors.primary} />
              <Text style={styles.gameChipText}>
                {copy.home.leaderPrefix} {leaderInfo.name} (+{leaderLead}{" "}
                {copy.home.pointsSuffix})
              </Text>
            </View>
          )}
          {hotStreak && (
            <View style={styles.gameChip}>
              <Ionicons name="flame" size={14} color={colors.primary} />
              <Text style={styles.gameChipText}>
                {copy.home.hotStreakPrefix} {hotStreak.name} x
                {hotStreak.streakCount}
              </Text>
            </View>
          )}
        </View>
      )}

      {(leaderAnnouncement || streakAnnouncement) && (
        <View style={styles.gameBanner}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.gameBannerText}>
            {leaderAnnouncement || streakAnnouncement}
          </Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{copy.home.stangeliTotal}</Text>
          <Text style={styles.statValue}>{totalBeers}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{copy.home.totalBill}</Text>
          <Text style={styles.statValue}>{totalBill.toFixed(2)} CHF</Text>
        </View>
      </View>

      <View style={styles.divider} />
      <Text style={styles.largeTitle}>{copy.home.leaderboard}</Text>
    </View>
  );
}
