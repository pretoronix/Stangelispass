import React from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { colors, spacing, borderRadius, typography } from "@/lib/theme";
import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@/services/supabase";

type AddUserGridProps = {
  users: User[];
  selectedUserId?: string | null;
  onSelectUser: (user: User) => void;
};

export function AddUserGrid({
  users,
  selectedUserId,
  onSelectUser,
}: AddUserGridProps) {
  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          style={[
            styles.userCard,
            selectedUserId === item.id && styles.selectedUserCard,
          ]}
          onPress={() => onSelectUser(item)}
        >
          <Avatar name={item.name} size={50} />
          <Text
            style={[
              styles.userName,
              selectedUserId === item.id && styles.selectedText,
            ]}
          >
            {item.name}
          </Text>
        </Pressable>
      )}
      {...{ contentContainerStyle: styles.listContent }}
      numColumns={2}
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          No users found. Add some in Settings!
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xxl,
  },
  userCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    margin: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedUserCard: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  userName: {
    ...typography.headline,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  selectedText: {
    color: colors.primary,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
