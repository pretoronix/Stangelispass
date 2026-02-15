import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { BADGES, BadgeType } from "@/services/achievements";
import { BadgeIcon } from "./BadgeIcon";
import { colors, spacing, borderRadius } from "@/lib/theme";

interface BadgeGridProps {
  unlockedBadges: BadgeType[];
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({ unlockedBadges }) => {
  const allBadges = Object.keys(BADGES) as BadgeType[];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trophy Case</Text>
      <View style={styles.grid}>
        {allBadges.map((type) => (
          <BadgeIcon
            key={type}
            type={type}
            locked={!unlockedBadges.includes(type)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});
