import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography } from "@/lib/theme";

interface BeerLogToastProps {
  visible: boolean;
  message: string;
  subtitle?: string;
}

export function BeerLogToast({
  visible,
  message,
  subtitle,
}: BeerLogToastProps) {
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setRendered(false);
      }
    });
  }, [visible, progress]);

  if (!rendered) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  return (
    <View
      pointerEvents="none"
      style={[styles.overlay, { top: insets.top + spacing.md }]}
    >
      <Animated.View
        style={[
          styles.toast,
          {
            opacity: progress,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={styles.message}>{message}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  message: {
    ...typography.callout,
    color: colors.textPrimary,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
});
