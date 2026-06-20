import React, { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Event,
  EventRole,
  EventPermissions,
  EventMembership,
  getPermissionsForRole,
  consumeEventCredit,
  hasLifetimeAccess,
  User,
} from "@/services/supabase";
import { reportError } from "@/utils/logger";
import { assertSupabaseConfigured } from "@/utils/preflight";
import { useNotifications } from "@/hooks/useNotifications";
import { useUsers as useUsersQuery } from "@/hooks/useUsersQuery";
import {
  useActiveEventQuery,
  useEventMembers,
  useEventMembership,
  useStartEvent,
  useCloseEvent,
} from "@/hooks/useEventsQuery";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useOfflineMutations } from "@/hooks/useOfflineMutations";
import { useOfflineQueueProcessor } from "@/hooks/useOfflineQueueProcessor";
import { useAppSync } from "@/hooks/useAppSync";
import { getEventPricingType } from "@/utils/eventPricing";

import type { AppContextType } from "@/providers/appProviderTypes";

const buildPermissions = (
  user: User | null,
  activeEventId: string | undefined,
  currentRole: EventRole | null,
  missingTable: boolean,
) => {
  if (!user) return getPermissionsForRole(null, false);
  if (!activeEventId) return getPermissionsForRole(null, !!user.is_admin);
  if (missingTable) return getPermissionsForRole(null, !!user.is_admin);
  return getPermissionsForRole(currentRole, !!user.is_admin);
};

export const useAppProviderState = (): AppContextType => {
  const {
    currentUser,
    setCurrentUser,
    loading: userLoading,
  } = useCurrentUser();

  const initialSupabaseConfigured = assertSupabaseConfigured();

  // Primary Data Queries
  const usersQuery = useUsersQuery();
  const activeEventQuery = useActiveEventQuery(initialSupabaseConfigured);
  const queryClient = useQueryClient();

  // Mutations
  const startEventMutation = useStartEvent();
  const closeEventMutation = useCloseEvent();

  // UI State
  const [showRecap, setShowRecap] = useState(false);

  // Sync / Refresh Callbacks
  const refreshUsers = useCallback(async () => {
    await usersQuery
      .refetch()
      .catch((e) =>
        reportError(e, { scope: "app_provider", action: "refresh_users" }),
      );
  }, [usersQuery]);

  const refreshActiveEvent = useCallback(async () => {
    await activeEventQuery.refetch().catch((e) =>
      reportError(e, {
        scope: "app_provider",
        action: "refresh_active_event",
      }),
    );
  }, [activeEventQuery]);

  // Sync Logic Hook (Connectivity, Local Overrides, Subscriptions)
  const {
    supabaseConfigured,
    remoteAvailable,
    localActiveEventOverride,
    setLocalActiveEventOverride,
  } = useAppSync({
    refreshUsers,
    refreshActiveEvent,
    refreshEventMembers: async () => {
      await eventMembersQuery.refetch();
    },
    refreshEventAccess: async () => {
      await eventMembershipQuery.refetch();
    },
    activeEventId: activeEventQuery.data?.event?.id, // Use remote ID initially
  });

  const effectiveActiveEvent =
    localActiveEventOverride || activeEventQuery.data?.event || null;

  // Membership Queries dependent on active event
  const eventMembersQuery = useEventMembers(
    effectiveActiveEvent?.id || "",
    !!effectiveActiveEvent?.id,
  );

  const eventMembershipQuery = useEventMembership(
    effectiveActiveEvent?.id || "",
    currentUser?.id || "",
    !!effectiveActiveEvent?.id && !!currentUser?.id,
  );

  const refreshEventMembers = useCallback(async () => {
    await eventMembersQuery
      .refetch()
      .catch((e) =>
        reportError(e, { scope: "app_provider", action: "refresh_members" }),
      );
  }, [eventMembersQuery]);

  const currentEventRole: EventRole | null = React.useMemo(() => {
    if (!currentUser || !effectiveActiveEvent?.id) return null;
    if (eventMembershipQuery.data?.missingTable) return null;
    return eventMembershipQuery.data?.membership?.role || null;
  }, [currentUser, effectiveActiveEvent?.id, eventMembershipQuery.data]);

  const eventPermissions: EventPermissions = React.useMemo(
    () =>
      buildPermissions(
        currentUser as any,
        effectiveActiveEvent?.id,
        currentEventRole,
        !!eventMembershipQuery.data?.missingTable,
      ),
    [
      currentUser,
      effectiveActiveEvent?.id,
      currentEventRole,
      eventMembershipQuery.data?.missingTable,
    ],
  );

  // Infrastructure Hooks
  const offlineMutations = useOfflineMutations();
  useOfflineQueueProcessor(offlineMutations);
  useNotifications(currentUser?.id || null);

  // Actions
  const startEvent = useCallback(
    async (name: string, passType: Event["pass_type"], beerPrice?: number) => {
      if (!currentUser) throw new Error("No current user selected");
      if (!eventPermissions.canManageEvent)
        throw new Error("Only admins can start a round");

      try {
        if (!hasLifetimeAccess(currentUser as any)) {
          const pricingType = getEventPricingType(new Date());
          const consumeResult = await consumeEventCredit(
            currentUser.id,
            pricingType,
          );
          if (
            !consumeResult.ok &&
            consumeResult.reason === "no_credits" &&
            supabaseConfigured
          ) {
            const err = new Error("NO_EVENT_CREDITS");
            (err as any).pricingType = pricingType;
            throw err;
          }
          await refreshUsers();
        }

        await startEventMutation.mutateAsync({
          name,
          userId: currentUser.id,
          passType,
          beerPrice,
        });
        setLocalActiveEventOverride(null);
        queryClient.invalidateQueries({ queryKey: ["active-event"] });
      } catch (e) {
        reportError(e, { scope: "app_provider", action: "start_event" });
        throw e;
      }
    },
    [
      currentUser,
      eventPermissions.canManageEvent,
      refreshUsers,
      supabaseConfigured,
      startEventMutation,
      setLocalActiveEventOverride,
    ],
  );

  const closeEvent = useCallback(async () => {
    if (!effectiveActiveEvent) return;
    if (!eventPermissions.canCloseEvent) {
      reportError(new Error("Not authorized to close event"), {
        scope: "app_provider",
        action: "close_event",
      });
      return;
    }

    try {
      await closeEventMutation.mutateAsync(effectiveActiveEvent);
      setShowRecap(true);
      setLocalActiveEventOverride(null);
      queryClient.invalidateQueries({ queryKey: ["active-event"] });
    } catch (e) {
      reportError(e, { scope: "app_provider", action: "close_event" });
    }
  }, [
    effectiveActiveEvent,
    eventPermissions.canCloseEvent,
    closeEventMutation,
    queryClient,
    setLocalActiveEventOverride,
  ]);

  return React.useMemo(
    () => ({
      currentUser: currentUser as any,
      isAdmin: (currentUser as any)?.is_admin || false,
      setCurrentUser,
      users: usersQuery.data || [],
      refreshUsers,
      loading:
        userLoading || usersQuery.isLoading || activeEventQuery.isLoading,
      activeEvent: effectiveActiveEvent,
      startEvent,
      closeEvent,
      showRecap,
      setShowRecap,
      remoteAvailable,
      supabaseConfigured,
      currentEventRole,
      eventPermissions,
      eventMembers: (eventMembersQuery.data as EventMembership[]) || [],
      refreshEventMembers,
      offlineQueue: offlineMutations.queue,
      addOfflineMutation: offlineMutations.addToQueue,
      offlineQueueProcessing: offlineMutations.isProcessing,
    }),
    [
      currentUser,
      setCurrentUser,
      refreshUsers,
      userLoading,
      effectiveActiveEvent,
      startEvent,
      closeEvent,
      showRecap,
      setShowRecap,
      remoteAvailable,
      supabaseConfigured,
      refreshEventMembers,
      offlineMutations.queue,
      offlineMutations.addToQueue,
      offlineMutations.isProcessing,
      usersQuery.data,
      usersQuery.isLoading,
      activeEventQuery.isLoading,
      eventMembershipQuery.data,
      eventMembersQuery.data,
      currentEventRole,
      eventPermissions,
    ],
  );
};
