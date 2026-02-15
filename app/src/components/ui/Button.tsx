import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  Platform,
  StyleProp,
} from "react-native";
import { colors, borderRadius, spacing, typography } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface ButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export const Button = ({
  title,
  onPress,
  icon,
  variant = "primary",
  disabled,
  style,
  haptic = true,
  testID,
  accessibilityLabel,
}: ButtonProps) => {
  const handlePress = () => {
    if (haptic && Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null);
    }
    onPress();
  };

  const getButtonStyle = (pressed: boolean): StyleProp<ViewStyle> => {
    const styles_list: StyleProp<ViewStyle>[] = [styles.button];

    switch (variant) {
      case "secondary":
        styles_list.push(styles.buttonSecondary);
        break;
      case "danger":
        styles_list.push(styles.buttonDanger);
        break;
      case "ghost":
        styles_list.push(styles.buttonGhost);
        break;
      default:
        styles_list.push(styles.buttonPrimary);
    }

    if (disabled) styles_list.push(styles.disabled);
    if (pressed && !disabled) styles_list.push(styles.pressed);

    return styles_list as StyleProp<ViewStyle>;
  };

  const getIconColor = () => {
    if (variant === "primary" || variant === "danger") return colors.background;
    return colors.primary;
  };

  return (
    <Pressable
      style={({ pressed }) => [getButtonStyle(pressed), style]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityState={{ disabled: disabled }}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {icon && <Ionicons name={icon} size={20} color={getIconColor()} />}
      <Text
        style={[
          styles.text,
          variant === "primary" || variant === "danger"
            ? styles.textLight
            : styles.textPrimary,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceLight,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    ...typography.headline,
    fontWeight: "600",
  },
  textLight: {
    color: colors.background,
  },
  textPrimary: {
    color: colors.primary,
  },
});
