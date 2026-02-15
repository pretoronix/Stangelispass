import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography, borderRadius } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui/Avatar";
import { UserBeerCount } from "@/hooks/useBeers";

interface LeaderboardItemProps {
  item: UserBeerCount;
  index: number;
  isLeader?: boolean;
}

export const LeaderboardItem = memo(
  ({ item, index, isLeader }: LeaderboardItemProps) => {
    const isTopThree = index < 3;
    const medalColor =
      index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32";
    const showStreak = (item.streakCount || 0) >= 3;
    const showPoints = typeof item.points === "number";
    const displayValue = showPoints ? item.points : item.count;
    const displayLabel = showPoints ? "PTS" : "BEERS";

    return (
      <View style={styles.container}>
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Ionicons name="medal" size={24} color={medalColor} />
          ) : (
            <Text style={styles.rankText}>{index + 1}</Text>
          )}
        </View>

        <Avatar name={item.name} size={40} />

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{item.name}</Text>
            {isLeader && (
              <Ionicons
                name="trophy"
                size={14}
                color="#FFD700"
                style={styles.leaderIcon}
              />
            )}
          </View>
          {item.isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminText}>ADMIN</Text>
            </View>
          )}
          {showStreak && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 x{item.streakCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.countContainer}>
          <Text style={styles.countText}>{displayValue}</Text>
          <Text style={styles.countLabel}>{displayLabel}</Text>
          {showPoints && (
            <Text style={styles.subCountText}>{item.count} BEERS</Text>
          )}
        </View>
      </View>
    );
  },
);

LeaderboardItem.displayName = "LeaderboardItem";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    height: 80,
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    ...typography.headline,
    color: colors.textMuted,
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nameText: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  leaderIcon: {
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  adminText: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  streakBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  streakText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  countContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 60,
  },
  countText: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.primary,
  },
  countLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: -4,
  },
  subCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: 2,
  },
});
