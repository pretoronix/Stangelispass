import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEventMembership,
  getEventGameStats,
  getEventLeaderState,
  getEventMembers,
  upsertEventMemberRole,
  removeEventMember,
  joinEvent,
  getWallOfFame,
  addToWallOfFame,
  EventRole,
  Event,
  startEventInSupabase,
  closeEventInSupabase,
} from "@/services/events";
import { supabase } from "@/services/supabase";
import { isMissingTableError } from "@/services/helpers";
import { enqueueNewRoundNotifications } from "@/services/notifications";

/**
 * React Query hooks for event operations
 */

export const QUERY_KEYS = {
  activeEvent: ["active-event"] as const,
  eventMembership: (eventId: string, userId: string) =>
    ["event-membership", eventId, userId] as const,
  eventGameStats: (eventId: string) => ["event-game-stats", eventId] as const,
  eventLeaderState: (eventId: string) =>
    ["event-leader-state", eventId] as const,
  eventMembers: (eventId: string) => ["event-members", eventId] as const,
  wallOfFame: ["wall-of-fame"] as const,
};

type ActiveEventQueryResult = {
  event: Event | null;
  missingSchema: boolean;
};

export function useActiveEventQuery(enabled = true) {
  return useQuery<ActiveEventQueryResult>({
    queryKey: QUERY_KEYS.activeEvent,
    queryFn: async () => {
      const from = (supabase as any).from && (supabase as any).from("events");
      if (!from || typeof from.select !== "function") {
        return { event: null, missingSchema: true };
      }

      const { data, error } = await from
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (isMissingTableError(error)) {
          return { event: null, missingSchema: true };
        }
        throw error;
      }

      return { event: (data as Event | null) || null, missingSchema: false };
    },
    enabled,
    staleTime: 10 * 1000,
  });
}

export function useEventMembership(
  eventId: string,
  userId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: QUERY_KEYS.eventMembership(eventId, userId),
    queryFn: () => getEventMembership(eventId, userId),
    enabled: enabled && !!eventId && !!userId,
    staleTime: 30 * 1000,
  });
}

export function useEventGameStats(eventId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.eventGameStats(eventId),
    queryFn: () => getEventGameStats(eventId),
    enabled: enabled && !!eventId,
    staleTime: 10 * 1000,
  });
}

export function useEventLeaderState(eventId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.eventLeaderState(eventId),
    queryFn: () => getEventLeaderState(eventId),
    enabled: enabled && !!eventId,
    staleTime: 5 * 1000, // Very fresh for leader changes
  });
}

export function useEventMembers(eventId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.eventMembers(eventId),
    queryFn: () => getEventMembers(eventId),
    enabled: enabled && !!eventId,
    staleTime: 30 * 1000,
  });
}

export function useWallOfFame() {
  return useQuery({
    queryKey: QUERY_KEYS.wallOfFame,
    queryFn: getWallOfFame,
    staleTime: 60 * 1000, // Wall of fame changes rarely
  });
}

export function useUpsertEventMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      userId,
      role,
      invitedBy,
    }: {
      eventId: string;
      userId: string;
      role: EventRole;
      invitedBy?: string | null;
    }) => upsertEventMemberRole(eventId, userId, role, invitedBy),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.eventMembers(variables.eventId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.eventMembership(
          variables.eventId,
          variables.userId,
        ),
      });
    },
  });
}

export function useRemoveEventMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) =>
      removeEventMember(eventId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.eventMembers(variables.eventId),
      });
    },
  });
}

export function useJoinEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      userId,
      invitedBy,
    }: {
      eventId: string;
      userId: string;
      invitedBy?: string | null;
    }) => joinEvent(eventId, userId, invitedBy),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.eventMembers(variables.eventId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.eventMembership(
          variables.eventId,
          variables.userId,
        ),
      });
    },
  });
}

export function useAddToWallOfFame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      winnerId,
      totalBeers,
    }: {
      eventId: string;
      winnerId: string;
      totalBeers: number;
    }) => addToWallOfFame(eventId, winnerId, totalBeers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallOfFame });
    },
  });
}

export function useStartEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startEventInSupabase,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeEvent });
      enqueueNewRoundNotifications(data.id, data.name, data.created_by).catch(
        () => null,
      );
    },
  });
}

export function useCloseEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeEventInSupabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeEvent });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallOfFame });
    },
  });
}
