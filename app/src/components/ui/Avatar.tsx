import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, borderRadius, typography } from "@/lib/theme";

interface AvatarProps {
  name: string;
  size?: number;
}

export const Avatar = ({ name, size = 48 }: AvatarProps) => {
  const initials = name.charAt(0).toUpperCase();

  return (
    <View style={[styles.avatar, { width: size, height: size }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: "bold",
  },
});
