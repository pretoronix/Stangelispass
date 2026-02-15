import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { colors, spacing, typography } from "@/lib/theme";
import type { User } from "@/services/supabase";

interface ProfileHeaderProps {
  user: User;
}

const getSubscriptionLabel = (tier?: string | null) =>
  tier === "lifetime"
    ? "🏆 Supporter"
    : tier === "craft"
      ? "💎 Craft Member"
      : "🍺 Pilsner Member";

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <View style={styles.profileHeader}>
      <Avatar name={user.name} size={100} />
      <Text style={styles.profileName}>{user.name}</Text>
      <Text style={styles.profileTag}>
        {getSubscriptionLabel(user.subscription_tier)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  profileName: {
    ...typography.title,
    marginTop: spacing.sm,
  },
  profileTag: {
    ...typography.headline,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 4,
  },
});
