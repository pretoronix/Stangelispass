import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, BADGES, BadgeType } from "@/services/achievements";
import { colors, spacing, borderRadius, typography } from "@/lib/theme";

interface BadgeIconProps {
  type: BadgeType;
  locked?: boolean;
  size?: number;
  showLabel?: boolean;
}

export const BadgeIcon: React.FC<BadgeIconProps> = ({
  type,
  locked = false,
  size = 60,
  showLabel = true,
}) => {
  const badge = BADGES[type];

  return (
    <View style={[styles.container, locked && styles.lockedContainer]}>
      <View
        style={[
          styles.iconCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: locked ? colors.surfaceLight : badge.color + "20", // 20% opacity
            borderColor: locked ? colors.textMuted : badge.color,
          },
        ]}
      >
        <Ionicons
          name={badge.icon as any}
          size={size * 0.6}
          color={locked ? colors.textMuted : badge.color}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, locked && styles.lockedLabel]}>
          {badge.name}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    margin: spacing.sm,
    width: 100,
  },
  lockedContainer: {
    opacity: 0.7,
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: "center",
    fontWeight: "600",
  },
  lockedLabel: {
    color: colors.textMuted,
  },
});
