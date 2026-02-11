import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getBeers, 
    getBeersByUser, 
    addBeer, 
    removeBeer, 
    getBeerCountByUser,
    getUserAchievements,
    createBeerStamp,
    redeemBeerStamp,
} from '@/services/beers';

/**
 * React Query hooks for beer operations
 */

export const QUERY_KEYS = {
    beers: (eventId?: string) => eventId ? ['beers', eventId] : ['beers'] as const,
    beersByUser: (userId: string) => ['beers', 'user', userId] as const,
    beerCounts: (eventId?: string) => eventId ? ['beer-counts', eventId] : ['beer-counts'] as const,
    achievements: (userId: string) => ['achievements', userId] as const,
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
        mutationFn: ({ userId, addedBy, eventId }: { userId: string; addedBy: string; eventId: string }) =>
            addBeer(userId, addedBy, eventId),
        onSuccess: (data, variables) => {
            // Invalidate all beer-related queries
            queryClient.invalidateQueries({ queryKey: ['beers'] });
            queryClient.invalidateQueries({ queryKey: ['beer-counts'] });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.beersByUser(variables.userId) });
            
            // If new badges were unlocked, invalidate achievements
            if (data.newBadges && data.newBadges.length > 0) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.achievements(variables.userId) });
            }
        },
    });
}

export function useRemoveBeer() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (beerId: string) => removeBeer(beerId),
        onSuccess: () => {
            // Invalidate all beer queries
            queryClient.invalidateQueries({ queryKey: ['beers'] });
            queryClient.invalidateQueries({ queryKey: ['beer-counts'] });
        },
    });
}

export function useCreateBeerStamp() {
    return useMutation({
        mutationFn: ({ userId, eventId, issuedBy }: { userId: string; eventId: string; issuedBy: string }) =>
            createBeerStamp(userId, eventId, issuedBy),
    });
}

export function useRedeemBeerStamp() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ stampId, addedBy }: { stampId: string; addedBy: string }) =>
            redeemBeerStamp(stampId, addedBy),
        onSuccess: () => {
            // Invalidate beer queries on successful redemption
            queryClient.invalidateQueries({ queryKey: ['beers'] });
            queryClient.invalidateQueries({ queryKey: ['beer-counts'] });
        },
    });
}
