import { useState, useCallback, useMemo } from "react";
import { Alert } from "react-native";
import {
  User,
  EventMembership,
  EventRole,
  resetEventData,
  upsertEventMemberRole,
  removeEventMember,
} from "@/services/supabase";
import { PassType } from "@/utils/settings/settingsConstants";
import { reportError } from "@/utils/logger";

interface UseEventManagementProps {
  currentUser: User | null;
  isAdmin: boolean;
  startEvent: (name: string, passType: PassType) => Promise<void>;
  activeEvent: any;
  eventPermissions: { canManageEvent: boolean; canManageMembers: boolean };
  eventMembers: EventMembership[];
  refreshEventMembers: () => Promise<void>;
  users: User[];
}

export const useEventManagement = ({
  currentUser,
  isAdmin,
  startEvent,
  activeEvent,
  eventPermissions,
  eventMembers,
  refreshEventMembers,
  users,
}: UseEventManagementProps) => {
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventPassType, setNewEventPassType] = useState<PassType>("day");

  const availableUsersForEvent = useMemo(() => {
    if (!activeEvent) return [];
    const currentMemberIds = new Set(
      eventMembers.map((member) => member.user_id),
    );
    return users.filter((user) => !currentMemberIds.has(user.id));
  }, [activeEvent, eventMembers, users]);

  const handleStartEvent = useCallback(async () => {
    if (!currentUser) {
      Alert.alert("No User", "Select a user before starting a new event.");
      return;
    }
    if (!eventPermissions.canManageEvent) {
      Alert.alert("Not Authorized", "Only admins can start new events.");
      return;
    }
    if (!newEventName.trim()) {
      Alert.alert("Error", "Enter a name for the event.");
      return;
    }
    try {
      await startEvent(newEventName.trim(), newEventPassType);
      setNewEventName("");
      setShowEventModal(false);
      Alert.alert("Event Started", "A new event is now active.");
    } catch (e) {
      if ((e as Error)?.message === "NO_EVENT_CREDITS") {
        Alert.alert(
          "Pass Required",
          "No event passes available. Purchase a day or weekend pass in Settings.",
        );
        return;
      }
      Alert.alert("Error", "Failed to start event.");
      reportError(e as Error, {
        scope: "useEventManagement",
        action: "handleStartEvent",
        userId: currentUser?.id,
        metadata: { eventName: newEventName, passType: newEventPassType },
      });
    }
  }, [
    currentUser,
    eventPermissions,
    newEventName,
    newEventPassType,
    startEvent,
  ]);

  const handleResetEventData = useCallback(() => {
    if (!isAdmin) {
      Alert.alert("Not Authorized", "Only admins can reset event data.");
      return;
    }
    Alert.alert(
      "Reset Event Data",
      "This will delete events, beers, achievements, wall of fame, notifications, and device tokens. Users are kept. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const results = await resetEventData();
              const failed = results.filter((r) => !r.ok);
              if (failed.length > 0) {
                Alert.alert(
                  "Partial Reset",
                  "Some tables could not be cleared. Check logs.",
                );
                reportError(new Error("Partial reset failure"), {
                  scope: "useEventManagement",
                  action: "handleResetEventData",
                  userId: currentUser?.id,
                  metadata: { results },
                });
              } else {
                Alert.alert("Reset Complete", "Event data has been cleared.");
              }
            } catch (e) {
              Alert.alert("Error", "Failed to reset event data.");
              reportError(e as Error, {
                scope: "useEventManagement",
                action: "handleResetEventData",
                userId: currentUser?.id,
              });
            }
          },
        },
      ],
    );
  }, [isAdmin]);

  const handleEventRoleChange = useCallback(
    async (member: EventMembership, role: EventRole) => {
      if (!activeEvent || !currentUser) return;
      if (member.role === "owner" && role !== "owner") {
        Alert.alert("Not Allowed", "Owner role cannot be changed here.");
        return;
      }
      try {
        await upsertEventMemberRole(
          activeEvent.id,
          member.user_id,
          role,
          currentUser.id,
        );
        await refreshEventMembers();
      } catch (e) {
        reportError(e as Error, {
          scope: "useEventManagement",
          action: "handleEventRoleChange",
          userId: currentUser.id,
          metadata: {
            eventId: activeEvent.id,
            memberId: member.user_id,
            newRole: role,
          },
        });
        Alert.alert("Error", "Could not update event role.");
      }
    },
    [activeEvent, currentUser, refreshEventMembers],
  );

  const handleAddEventMember = useCallback(
    async (userId: string, role: EventRole) => {
      if (!activeEvent || !currentUser) return;
      try {
        await upsertEventMemberRole(
          activeEvent.id,
          userId,
          role,
          currentUser.id,
        );
        await refreshEventMembers();
        Alert.alert("Added", `Member added as ${role}.`);
      } catch (e) {
        reportError(e as Error, {
          scope: "useEventManagement",
          action: "handleAddEventMember",
          userId: currentUser.id,
          metadata: { eventId: activeEvent.id, newMemberId: userId, role },
        });
        Alert.alert("Error", "Could not add member to this event.");
      }
    },
    [activeEvent, currentUser, refreshEventMembers],
  );

  const handleRemoveEventMember = useCallback(
    async (member: EventMembership) => {
      if (!activeEvent) return;
      if (member.role === "owner") {
        Alert.alert("Not Allowed", "Owner cannot be removed from the event.");
        return;
      }
      Alert.alert(
        "Remove Member",
        `Remove ${member.user?.name || "this user"} from the event?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await removeEventMember(activeEvent.id, member.user_id);
                await refreshEventMembers();
              } catch (e) {
                reportError(e as Error, {
                  scope: "useEventManagement",
                  action: "handleRemoveEventMember",
                  metadata: {
                    eventId: activeEvent.id,
                    memberId: member.user_id,
                  },
                });
                Alert.alert("Error", "Could not remove event member.");
              }
            },
          },
        ],
      );
    },
    [activeEvent],
  );

  return {
    showEventModal,
    setShowEventModal,
    newEventName,
    setNewEventName,
    newEventPassType,
    setNewEventPassType,
    availableUsersForEvent,
    handleStartEvent,
    handleResetEventData,
    handleEventRoleChange,
    handleAddEventMember,
    handleRemoveEventMember,
  };
};
