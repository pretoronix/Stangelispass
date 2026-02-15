import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { colors, spacing, borderRadius, typography } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";

interface VelocityMetricCardProps {
  velocity: number;
  trendData: { value: number; label: string }[];
  savedPace?: number | null;
  onSavePace?: () => void;
  onClearSavedPace?: () => void;
}

export const VelocityMetricCard = ({
  velocity,
  trendData,
  savedPace,
  onSavePace,
  onClearSavedPace,
}: VelocityMetricCardProps) => {
  const canSave = typeof onSavePace === "function" && velocity > 0;
  const hasSaved = typeof savedPace === "number" && savedPace > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.velocityInfo}>
          <Text style={styles.label}>Velocity (Pace)</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{velocity.toFixed(1)}</Text>
            <Text style={styles.unit}>Beers/hr</Text>
          </View>
        </View>
        <View
          style={[
            styles.indicator,
            { backgroundColor: getVelocityColor(velocity) },
          ]}
        >
          <Ionicons
            name={
              velocity > 4
                ? "flame"
                : velocity > 2
                  ? "speedometer"
                  : "cafe-outline"
            }
            size={16}
            color="#FFF"
          />
        </View>
      </View>

      {(canSave || hasSaved) && (
        <View style={styles.paceRow}>
          {hasSaved && (
            <View style={styles.savedPace}>
              <Ionicons name="repeat" size={14} color={colors.textMuted} />
              <Text style={styles.savedPaceText}>
                Saved pace: {savedPace?.toFixed(1)} beers/hr
              </Text>
            </View>
          )}
          <View style={styles.paceActions}>
            {canSave && (
              <TouchableOpacity
                onPress={onSavePace}
                style={styles.paceButton}
                accessibilityLabel="Save current pace"
              >
                <Text style={styles.paceButtonText}>Save pace</Text>
              </TouchableOpacity>
            )}
            {hasSaved && onClearSavedPace && (
              <TouchableOpacity
                onPress={onClearSavedPace}
                style={[styles.paceButton, styles.clearButton]}
                accessibilityLabel="Clear saved pace"
              >
                <Text style={[styles.paceButtonText, styles.clearButtonText]}>
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {trendData.length > 1 && (
        <View style={styles.chartWrapper}>
          <LineChart
            data={trendData}
            thickness={3}
            color={colors.primary}
            hideDataPoints
            hideAxesAndRules
            curved
            width={Dimensions.get("window").width - spacing.xl * 4}
            height={40}
            areaChart
            startFillColor={colors.primary}
            endFillColor={colors.background}
            startOpacity={0.4}
            endOpacity={0.01}
          />
        </View>
      )}
    </View>
  );
};

const getVelocityColor = (v: number) => {
  if (v > 5) return colors.error;
  if (v > 3) return colors.warning;
  return colors.success;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: "100%",
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  velocityInfo: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginTop: 4,
  },
  value: {
    ...typography.title,
    color: colors.primary,
    fontWeight: "800",
  },
  unit: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chartWrapper: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  paceRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  savedPace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  savedPaceText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  paceActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  paceButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    backgroundColor: colors.surfaceLight,
  },
  paceButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  clearButton: {
    backgroundColor: "transparent",
  },
  clearButtonText: {
    color: colors.textMuted,
  },
});
