import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "@/lib/theme";
import { User } from "@/services/supabase";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { router } from "expo-router";

interface UserSelectionGridProps {
  users: User[];
  currentUserId?: string;
  onSelectUser: (user: User) => void;
  onManageUsers: () => void;
}

export const UserSelectionGrid: React.FC<UserSelectionGridProps> = ({
  users,
  currentUserId,
  onSelectUser,
  onManageUsers,
}) => {
  return (
    <View style={styles.userGrid}>
      <SettingItem
        icon="trophy"
        label="Trophy Case (Profile)"
        onPress={() => router.push("/profile")}
        showChevron
      />

      <SettingItem icon="people" label="Manage Users" onPress={onManageUsers} />
      {users.map((user) => (
        <Pressable
          key={user.id}
          onPress={() => onSelectUser(user)}
          style={styles.userSelectWrapper}
        >
          <Card
            style={[
              styles.userSelectCard,
              currentUserId === user.id && styles.selectedCard,
            ]}
          >
            <Avatar name={user.name} size={40} />
            <View style={styles.userSelectInfo}>
              <Text style={styles.userSelectName} numberOfLines={1}>
                {user.name}
              </Text>
              {user.is_admin && (
                <Text style={styles.adminSmallText}>Admin</Text>
              )}
            </View>
            {currentUserId === user.id && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
            )}
          </Card>
        </Pressable>
      ))}
    </View>
  );
};

const SettingItem = ({
  icon,
  label,
  onPress,
  showChevron,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
}) => (
  <Pressable onPress={onPress} style={styles.settingItem}>
    <View style={styles.settingLeft}>
      <Ionicons
        name={icon}
        size={22}
        color={colors.primary}
        style={styles.settingIcon}
      />
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    {showChevron && (
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  userGrid: {
    gap: spacing.sm,
  },
  userSelectWrapper: {
    width: "100%",
  },
  userSelectCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
  },
  selectedCard: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  userSelectInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userSelectName: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  adminSmallText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
