import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { Card } from "@/components/ui/Card";
import { colors, spacing } from "@/lib/theme";
import { labels } from "@/ui/labels";

interface LiveBeerLogSectionProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export const LiveBeerLogSection: React.FC<LiveBeerLogSectionProps> = ({
  enabled,
  onToggle,
}) => {
  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.label}>Live Beer Log Updates</Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.surfaceLight, true: colors.primary }}
          testID={labels.settings.liveBeerLog.testID}
          accessibilityLabel={labels.settings.liveBeerLog.accessibilityLabel}
        />
      </View>
      <Text style={styles.disclaimer}>
        When off, the History screen updates only on manual refresh.
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  disclaimer: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: "center",
    fontStyle: "italic",
  },
});
