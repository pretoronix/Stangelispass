import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, typography } from "@/lib/theme";
import { EventMembership, EventRole } from "@/services/supabase";

interface EventMemberRowProps {
  member: EventMembership;
  isOwner: boolean;
  onRoleChange: (role: EventRole) => void;
  onRemove: () => void;
}

export const EventMemberRow: React.FC<EventMemberRowProps> = ({
  member,
  isOwner,
  onRoleChange,
  onRemove,
}) => {
  return (
    <View style={styles.eventMemberRow}>
      <View style={styles.eventMemberInfo}>
        <Text style={styles.eventMemberName}>
          {member.user?.name || member.user_id.slice(0, 8)}
        </Text>
        <Text style={styles.eventMemberRole}>{member.role}</Text>
      </View>
      <View style={styles.eventRoleActions}>
        {!isOwner && (
          <>
            <Pressable
              onPress={() => onRoleChange("admin")}
              style={styles.roleActionButton}
            >
              <Text style={styles.roleActionText}>Admin</Text>
            </Pressable>
            <Pressable
              onPress={() => onRoleChange("member")}
              style={styles.roleActionButton}
            >
              <Text style={styles.roleActionText}>Member</Text>
            </Pressable>
            <Pressable
              onPress={onRemove}
              style={[styles.roleActionButton, styles.roleActionDanger]}
            >
              <Text style={styles.roleActionText}>Remove</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  eventMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
    gap: spacing.sm,
  },
  eventMemberInfo: {
    flex: 1,
    gap: 2,
  },
  eventMemberName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  eventMemberRole: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  eventRoleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  roleActionButton: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    backgroundColor: colors.surface,
  },
  roleActionDanger: {
    borderColor: colors.error,
  },
  roleActionText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "700",
  },
});
