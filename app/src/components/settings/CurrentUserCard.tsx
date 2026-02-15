import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/lib/theme";
import { User, EventRole } from "@/services/supabase";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { labels } from "@/ui/labels";

interface CurrentUserCardProps {
  currentUser: User | null;
  isAdmin: boolean;
  currentEventRole?: EventRole | null;
  onSwitch: () => void;
}

export const CurrentUserCard: React.FC<CurrentUserCardProps> = ({
  currentUser,
  isAdmin,
  currentEventRole,
  onSwitch,
}) => {
  if (!currentUser) {
    return (
      <Card style={styles.noUserCard}>
        <Ionicons
          name="person-circle-outline"
          size={32}
          color={colors.textMuted}
        />
        <Text style={styles.noUserText}>No user selected. Pick one below!</Text>
      </Card>
    );
  }

  return (
    <Card style={styles.currentUserCard}>
      <Avatar name={currentUser.name} size={50} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{currentUser.name}</Text>
        {(isAdmin ||
          currentEventRole === "owner" ||
          currentEventRole === "admin") && (
          <View style={styles.adminBadge}>
            <Ionicons
              name="shield-checkmark"
              size={12}
              color={colors.primary}
            />
            <Text style={styles.adminText}>
              {isAdmin ? "Admin Access" : `Event ${currentEventRole}`}
            </Text>
          </View>
        )}
      </View>
      <Button
        title="Switch"
        onPress={onSwitch}
        variant="ghost"
        testID={labels.settings.switchUser.testID}
        accessibilityLabel={labels.settings.switchUser.accessibilityLabel}
        style={styles.switchButton}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  currentUserCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  adminText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "bold",
  },
  switchButton: {
    height: 32,
    paddingHorizontal: spacing.md,
  },
  noUserCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.textMuted,
    backgroundColor: "transparent",
  },
  noUserText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
