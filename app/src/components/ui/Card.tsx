import React, { ReactNode } from "react";
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from "react-native";
import { colors, borderRadius, spacing } from "@/lib/theme";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export const Card = ({
  children,
  style,
  testID,
  accessibilityLabel,
}: CardProps) => {
  return (
    <View
      style={[styles.card, style]}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
