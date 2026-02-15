import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBeers,
  getBeersByUser,
  addBeer,
  removeBeer,
  getBeerCountByUser,
  getUserAchievements,
  createBeerStamp,
  redeemBeerStamp,
} from "@/services/beers";

/**
 * React Query hooks for beer operations
 */

export const QUERY_KEYS = {
  beers: (eventId?: string) =>
    eventId ? ["beers", eventId] : (["beers"] as const),
  beersByUser: (userId: string) => ["beers", "user", userId] as const,
  beerCounts: (eventId?: string) =>
    eventId ? ["beer-counts", eventId] : (["beer-counts"] as const),
  achievements: (userId: string) => ["achievements", userId] as const,
};

export function useBeersQuery(eventId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.beers(eventId),
    queryFn: () => getBeers(eventId),
    staleTime: 10 * 1000, // Fresh for 10s
  });
}

export function useBeersByUser(userId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.beersByUser(userId),
    queryFn: () => getBeersByUser(userId),
    enabled,
    staleTime: 10 * 1000,
  });
}

export function useBeerCounts(eventId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.beerCounts(eventId),
    queryFn: () => getBeerCountByUser(eventId),
    staleTime: 5 * 1000, // Very fresh for leaderboard
  });
}

export function useUserAchievements(userId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.achievements(userId),
    queryFn: () => getUserAchievements(userId),
    enabled,
    staleTime: 60 * 1000, // Achievements change rarely
  });
}

export function useAddBeer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      addedBy,
      eventId,
    }: {
      userId: string;
      addedBy: string;
      eventId: string;
    }) => addBeer(userId, addedBy, eventId),

    // Optimistic update
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.beers(variables.eventId),
      });
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.beerCounts(variables.eventId),
      });

      // Snapshot previous values
      const previousBeers = queryClient.getQueryData(
        QUERY_KEYS.beers(variables.eventId),
      );
      const previousCounts = queryClient.getQueryData(
        QUERY_KEYS.beerCounts(variables.eventId),
      );

      // Optimistically update beer list
      queryClient.setQueryData<any[]>(
        QUERY_KEYS.beers(variables.eventId),
        (old = []) => {
          const optimisticBeer = {
            id: `temp-${Date.now()}`,
            user_id: variables.userId,
            added_by: variables.addedBy,
            event_id: variables.eventId,
            created_at: new Date().toISOString(),
            // Try to get user data from existing beers
            user: old.find((b: any) => b.user_id === variables.userId)?.user,
          };
          return [optimisticBeer, ...old];
        },
      );

      // Optimistically update counts
      queryClient.setQueryData<any[]>(
        QUERY_KEYS.beerCounts(variables.eventId),
        (old = []) => {
          const userExists = old.some(
            (u: any) => u.userId === variables.userId,
          );
          if (userExists) {
            return old.map((user: any) =>
              user.userId === variables.userId
                ? { ...user, count: user.count + 1 }
                : user,
            );
          } else {
            // Add new user to counts
            return [...old, { userId: variables.userId, count: 1 }];
          }
        },
      );

      // Return context for rollback
      return { previousBeers, previousCounts };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousBeers) {
        queryClient.setQueryData(
          QUERY_KEYS.beers(variables.eventId),
          context.previousBeers,
        );
      }
      if (context?.previousCounts) {
        queryClient.setQueryData(
          QUERY_KEYS.beerCounts(variables.eventId),
          context.previousCounts,
        );
      }
    },

    onSuccess: (data, variables) => {
      // Invalidate all beer-related queries to get real data
      queryClient.invalidateQueries({ queryKey: ["beers"] });
      queryClient.invalidateQueries({ queryKey: ["beer-counts"] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.beersByUser(variables.userId),
      });

      // If new badges were unlocked, invalidate achievements
      if (data.newBadges && data.newBadges.length > 0) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.achievements(variables.userId),
        });
      }
    },
  });
}

export function useRemoveBeer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (beerId: string) => removeBeer(beerId),

    // Optimistic update
    onMutate: async (beerId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["beers"] });
      await queryClient.cancelQueries({ queryKey: ["beer-counts"] });

      // Snapshot all beer queries
      const previousBeers = queryClient.getQueriesData({ queryKey: ["beers"] });
      const previousCounts = queryClient.getQueriesData({
        queryKey: ["beer-counts"],
      });

      // Optimistically remove from all beer lists
      queryClient.setQueriesData<any[]>({ queryKey: ["beers"] }, (old = []) =>
        old.filter((beer: any) => beer.id !== beerId),
      );

      // Return context for rollback
      return { previousBeers, previousCounts };
    },

    // Rollback on error
    onError: (error, beerId, context) => {
      if (context?.previousBeers) {
        context.previousBeers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousCounts) {
        context.previousCounts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSuccess: () => {
      // Invalidate all beer queries to sync with server
      queryClient.invalidateQueries({ queryKey: ["beers"] });
      queryClient.invalidateQueries({ queryKey: ["beer-counts"] });
    },
  });
}

export function useCreateBeerStamp() {
  return useMutation({
    mutationFn: ({
      userId,
      eventId,
      issuedBy,
    }: {
      userId: string;
      eventId: string;
      issuedBy: string;
    }) => createBeerStamp(userId, eventId, issuedBy),
  });
}

export function useRedeemBeerStamp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stampId, addedBy }: { stampId: string; addedBy: string }) =>
      redeemBeerStamp(stampId, addedBy),
    onSuccess: () => {
      // Invalidate beer queries on successful redemption
      queryClient.invalidateQueries({ queryKey: ["beers"] });
      queryClient.invalidateQueries({ queryKey: ["beer-counts"] });
    },
  });
}
