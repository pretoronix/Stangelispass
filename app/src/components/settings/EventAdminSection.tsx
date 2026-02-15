import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, spacing, typography } from "@/lib/theme";
import { EventMembership, EventRole, User } from "@/services/supabase";
import { Card } from "@/components/ui/Card";
import { EventMemberRow } from "./EventMemberRow";

interface EventAdminSectionProps {
  eventName: string;
  eventMembers: EventMembership[];
  availableUsers: User[];
  onRoleChange: (member: EventMembership, role: EventRole) => void;
  onRemoveMember: (member: EventMembership) => void;
  onAddMember: (userId: string, role: EventRole) => void;
}

export const EventAdminSection: React.FC<EventAdminSectionProps> = ({
  eventName,
  eventMembers,
  availableUsers,
  onRoleChange,
  onRemoveMember,
  onAddMember,
}) => {
  return (
    <Card>
      <Text style={styles.eventAdminTitle}>{eventName}</Text>
      {eventMembers.length === 0 && (
        <Text style={styles.bioDisclaimer}>
          No members found for this event yet.
        </Text>
      )}
      {eventMembers.map((member) => (
        <EventMemberRow
          key={member.id}
          member={member}
          isOwner={member.role === "owner"}
          onRoleChange={(role) => onRoleChange(member, role)}
          onRemove={() => onRemoveMember(member)}
        />
      ))}
      <View style={styles.eventMemberDivider} />
      <Text style={styles.eventAdminSubtitle}>Add Existing User</Text>
      {availableUsers.length === 0 && (
        <Text style={styles.bioDisclaimer}>
          All users are already part of this event.
        </Text>
      )}
      {availableUsers.map((user) => (
        <View key={`available-${user.id}`} style={styles.eventMemberRow}>
          <View style={styles.eventMemberInfo}>
            <Text style={styles.eventMemberName}>{user.name}</Text>
            <Text style={styles.eventMemberRole}>not in event</Text>
          </View>
          <View style={styles.eventRoleActions}>
            <Pressable
              onPress={() => onAddMember(user.id, "member")}
              style={styles.roleActionButton}
            >
              <Text style={styles.roleActionText}>Add</Text>
            </Pressable>
            <Pressable
              onPress={() => onAddMember(user.id, "admin")}
              style={styles.roleActionButton}
            >
              <Text style={styles.roleActionText}>Admin</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  eventAdminTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  eventAdminSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  eventMemberDivider: {
    height: 1,
    backgroundColor: colors.surfaceLight,
    marginVertical: spacing.md,
  },
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    backgroundColor: colors.surface,
  },
  roleActionText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  bioDisclaimer: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: "center",
    fontStyle: "italic",
  },
});
