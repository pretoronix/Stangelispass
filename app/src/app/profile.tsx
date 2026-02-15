import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/lib/theme";
import { useApp } from "@/providers/AppProvider";
import { calculateBAC } from "@/utils/bacCalculator";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { CostSummaryCard } from "@/components/features/CostSummaryCard";
import { useProfileData } from "@/hooks/profile/useProfileData";
import {
  ProfileAchievements,
  ProfileBACCard,
  ProfileHeader,
  ProfileStats,
} from "@/components/profile";
import type { Beer } from "@/services/supabase";

function NoUserView() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={styles.textMuted}>
          Please select a user in Settings first.
        </Text>
        <Pressable onPress={() => router.push("/settings")} style={styles.btn}>
          <Text style={styles.btnText}>Go to Settings</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function ProfileScreen() {
  const { currentUser, activeEvent } = useApp();
  const { beers, roundBeers, achievements, refreshing, refresh } =
    useProfileData(currentUser, activeEvent);

  if (!currentUser) {
    return <NoUserView />;
  }

  const currentBAC = calculateBAC(
    currentUser.weight_kg || 80,
    currentUser.gender || "neutral",
    beers.map((b) => b.created_at),
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </Pressable>
          <Text style={styles.navTitle}>Trophy Case</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
        >
          <ProfileHeader user={currentUser} />

          {/* Cost Summary - Current Round */}
          {activeEvent && roundBeers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Current Round Spending</Text>
              <CostSummaryCard
                beerCount={roundBeers.length}
                pricePerBeer={activeEvent.beer_price ?? 5.0}
                eventName={activeEvent.name}
              />
            </View>
          )}

          {/* BAC Meter */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Soberness Estimator</Text>
            <ProfileBACCard bac={currentBAC} beerCount={beers.length} />
          </View>

          {/* Achievements */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Unlocked Badges ({achievements.length})
            </Text>
            <ProfileAchievements achievements={achievements} />
          </View>

          {/* Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Consumption Stats</Text>
            <ProfileStats
              totalBeers={beers.length}
              lastLogDateLabel={getLastLogDate(beers)}
            />
          </View>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const getLastLogDate = (userBeers: Beer[]) => {
  const last =
    userBeers.length > 0 ? userBeers[userBeers.length - 1] : undefined;
  return last ? new Date(last.created_at).toLocaleDateString() : "N/A";
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  textMuted: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  btnText: {
    ...typography.headline,
    color: "#FFFFFF",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    ...typography.headline,
    fontSize: 17,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.small,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
});
