import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/Card";
import { colors, spacing, typography } from "@/lib/theme";
import { formatBAC, getBACEffect } from "@/utils/bacCalculator";

interface ProfileBACCardProps {
  bac: number;
  beerCount: number;
}

const getBACColor = (bac: number) => {
  if (bac <= 0.02) return colors.success;
  if (bac <= 0.05) return "#FFCC00"; // Yellow
  if (bac <= 0.08) return "#FF9500"; // Orange
  return colors.error;
};

export function ProfileBACCard({ bac, beerCount }: ProfileBACCardProps) {
  return (
    <Card style={styles.bacCard}>
      <View style={styles.bacHeader}>
        <Text style={styles.bacValue}>{formatBAC(bac)}</Text>
        <Text style={styles.bacState}>{getBACEffect(bac)}</Text>
      </View>

      <View style={styles.meterContainer}>
        <View
          style={[
            styles.meterFill,
            {
              width: `${Math.min(100, bac * 500)}%`,
              backgroundColor: getBACColor(bac),
            },
          ]}
        />
      </View>

      <View style={styles.bacFooter}>
        <Text style={styles.bacDisclaimer}>
          Estimation based on {beerCount} beers. Strictly for entertainment.
          Never drive after drinking.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bacCard: {
    padding: spacing.md,
    alignItems: "center",
  },
  bacHeader: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  bacValue: {
    ...typography.largeTitle,
    color: colors.primary,
    fontSize: 40,
  },
  bacState: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  meterContainer: {
    width: "100%",
    height: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  meterFill: {
    height: "100%",
    borderRadius: 6,
  },
  bacFooter: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
    paddingTop: spacing.sm,
  },
  bacDisclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
  },
});
