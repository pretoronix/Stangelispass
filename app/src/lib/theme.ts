import { Platform } from "react-native";

// iOS-inspired semantic color palette for dark mode
export const colors = {
  // Primary - Amber/Gold for the beer theme
  primary: "#F59E0B",
  primaryDark: "#D97706",
  primaryLight: "#FBBF24",

  // System Backgrounds (iOS Semantic style)
  background: "#000000", // True Black for OLED depth
  surface: "#1C1C1E", // System Material (Secondary)
  surfaceLight: "#2C2C2E", // System Material (Tertiary)

  // Text (iOS Dynamic Scale compatible)
  textPrimary: "#FFFFFF",
  textSecondary: "#EBEBF599", // Secondary Label (60% opacity)
  textMuted: "#EBEBF54D", // Tertiary Label (30% opacity)

  // Accents
  success: "#34C759", // iOS Green
  error: "#FF3B30", // iOS Red
  warning: "#FF9500", // iOS Orange
  info: "#007AFF", // iOS Blue

  // Feature colors
  beerAmber: "#F59E0B",
  beerDark: "#92400E",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Typography aligned with iOS HIG Dynamic Type
export const typography = {
  largeTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    fontWeight: "700" as const,
    letterSpacing: 0.37,
    color: colors.textPrimary,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 0.36,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    fontWeight: "600" as const,
    letterSpacing: 0.38,
    color: colors.textPrimary,
  },
  headline: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    fontWeight: "600" as const,
    letterSpacing: -0.41,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    fontWeight: "400" as const,
    letterSpacing: -0.41,
    color: colors.textPrimary,
  },
  callout: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    fontWeight: "400" as const,
    letterSpacing: -0.32,
    color: colors.textSecondary,
  },
  caption: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    fontWeight: "400" as const,
    letterSpacing: -0.15,
    color: colors.textSecondary,
  },
  small: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0,
    color: colors.textMuted,
  },
};
