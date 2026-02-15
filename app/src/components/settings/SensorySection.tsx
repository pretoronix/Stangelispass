import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { colors, spacing } from "@/lib/theme";
import { Card } from "@/components/ui/Card";
import { labels } from "@/ui/labels";

interface SensorySectionProps {
  isAudioEnabled: boolean;
  onToggleAudio: (value: boolean) => void;
  pourAnimationEnabled: boolean;
  onTogglePourAnimation: (value: boolean) => void;
}

export const SensorySection: React.FC<SensorySectionProps> = ({
  isAudioEnabled,
  onToggleAudio,
  pourAnimationEnabled,
  onTogglePourAnimation,
}) => {
  return (
    <Card>
      <View style={styles.bioRow}>
        <Text style={styles.bioLabel}>Play "Psst!" Sound</Text>
        <Switch
          value={isAudioEnabled}
          onValueChange={onToggleAudio}
          trackColor={{ false: colors.surfaceLight, true: colors.primary }}
        />
      </View>
      <Text style={styles.bioDisclaimer}>
        Plays a crisp bottle opening sound when a beer is logged.
      </Text>

      <View style={[styles.bioRow, { marginTop: spacing.md }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bioLabel}>🍺 Pour Animation</Text>
          <Text style={[styles.bioDisclaimer, { marginTop: 4 }]}>
            {pourAnimationEnabled
              ? "Show animated beer pour when logging"
              : "Use simple feedback instead"}
          </Text>
        </View>
        <Switch
          testID={labels.settings.pourAnimation.testID}
          accessibilityLabel={labels.settings.pourAnimation.accessibilityLabel}
          value={pourAnimationEnabled}
          onValueChange={onTogglePourAnimation}
          trackColor={{ false: colors.surfaceLight, true: colors.primary }}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  bioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  bioLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  bioDisclaimer: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: "center",
    fontStyle: "italic",
  },
});
