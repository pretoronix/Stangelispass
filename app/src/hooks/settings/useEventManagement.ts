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
import { NO_EVENT_CREDITS_MESSAGE } from "@/services/iap";
import { copy } from "@/ui/copy";

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
      Alert.alert(copy.settings.alerts.noUser, copy.settings.alerts.selectUserBeforeEvent);
      return;
    }
    if (!eventPermissions.canManageEvent) {
      Alert.alert(copy.common.notAuthorized, copy.settings.alerts.adminOnlyStartEvent);
      return;
    }
    if (!newEventName.trim()) {
      Alert.alert(copy.common.error, copy.settings.alerts.enterEventName);
      return;
    }
    try {
      await startEvent(newEventName.trim(), newEventPassType);
      setNewEventName("");
      setShowEventModal(false);
      Alert.alert(copy.settings.alerts.eventStarted, copy.settings.alerts.eventNowActive);
    } catch (e) {
      if ((e as Error)?.message === "NO_EVENT_CREDITS") {
        Alert.alert(copy.home.alerts.passRequired, NO_EVENT_CREDITS_MESSAGE);
        return;
      }
      Alert.alert(copy.common.error, copy.settings.alerts.startEventFailed);
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
      Alert.alert(copy.common.notAuthorized, copy.settings.alerts.adminOnlyReset);
      return;
    }
    Alert.alert(
      copy.settings.alerts.resetEventTitle,
      copy.settings.alerts.resetEventHint,
      [
        { text: copy.common.cancel, style: "cancel" },
        {
          text: copy.common.reset,
          style: "destructive",
          onPress: async () => {
            try {
              const results = await resetEventData();
              const failed = results.filter((r) => !r.ok);
              if (failed.length > 0) {
                Alert.alert(
                  copy.settings.alerts.partialReset,
                  copy.settings.alerts.partialResetHint,
                );
                reportError(new Error("Partial reset failure"), {
                  scope: "useEventManagement",
                  action: "handleResetEventData",
                  userId: currentUser?.id,
                  metadata: { results },
                });
              } else {
                Alert.alert(copy.settings.alerts.resetComplete, copy.settings.alerts.eventDataCleared);
              }
            } catch (e) {
              Alert.alert(copy.common.error, copy.settings.alerts.resetFailed);
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
        Alert.alert(copy.settings.alerts.notAllowed, copy.settings.alerts.ownerRoleFixed);
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
        Alert.alert(copy.common.error, copy.settings.alerts.roleUpdateFailed);
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
        Alert.alert(copy.settings.alerts.memberAdded, `Member added as ${role}.`);
      } catch (e) {
        reportError(e as Error, {
          scope: "useEventManagement",
          action: "handleAddEventMember",
          userId: currentUser.id,
          metadata: { eventId: activeEvent.id, newMemberId: userId, role },
        });
        Alert.alert(copy.common.error, copy.settings.alerts.addMemberFailed);
      }
    },
    [activeEvent, currentUser, refreshEventMembers],
  );

  const handleRemoveEventMember = useCallback(
    async (member: EventMembership) => {
      if (!activeEvent) return;
      if (member.role === "owner") {
        Alert.alert(copy.settings.alerts.notAllowed, copy.settings.alerts.ownerNotRemovable);
        return;
      }
      Alert.alert(
        copy.settings.alerts.removeMemberTitle,
        `Remove ${member.user?.name || "this user"} from the event?`,
        [
          { text: copy.common.cancel, style: "cancel" },
          {
            text: copy.common.remove,
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
                Alert.alert(copy.common.error, copy.settings.alerts.removeMemberFailed);
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
