import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/client';
import { COMMENT_QUERY_KEYS } from './useCommentsQuery';
import { reportError } from '@/utils/logger';

/**
 * Real-time subscription hook for comments
 * Subscribes to INSERT, UPDATE, DELETE events for a specific beer
 * Auto-updates React Query cache when changes occur
 */
export function useRealtimeComments(beerId: string, enabled = true) {
    const queryClient = useQueryClient();
    
    useEffect(() => {
        if (!beerId || !enabled) return;
        
        const channelName = `comments:${beerId}`;
        
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'comments',
                    filter: `beer_id=eq.${beerId}`,
                },
                (payload) => {
                    console.log('[Comments] New comment received:', payload.new);
                    queryClient.invalidateQueries({ 
                        queryKey: COMMENT_QUERY_KEYS.byBeer(beerId) 
                    });
                    queryClient.invalidateQueries({ 
                        queryKey: COMMENT_QUERY_KEYS.count(beerId) 
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'comments',
                    filter: `beer_id=eq.${beerId}`,
                },
                (payload) => {
                    console.log('[Comments] Comment updated:', payload.new);
                    queryClient.invalidateQueries({ 
                        queryKey: COMMENT_QUERY_KEYS.byBeer(beerId) 
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'comments',
                    filter: `beer_id=eq.${beerId}`,
                },
                (payload) => {
                    console.log('[Comments] Comment deleted:', payload.old);
                    queryClient.invalidateQueries({ 
                        queryKey: COMMENT_QUERY_KEYS.byBeer(beerId) 
                    });
                    queryClient.invalidateQueries({ 
                        queryKey: COMMENT_QUERY_KEYS.count(beerId) 
                    });
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Comments] Subscribed to ${channelName}`);
                } else if (status === 'CHANNEL_ERROR') {
                    reportError(err || new Error('Channel subscription error'), {
                        scope: 'useRealtimeComments',
                        action: 'subscribe',
                        metadata: { beerId, channelName, status },
                    });
                } else if (status === 'TIMED_OUT') {
                    console.warn(`[Comments] Subscription timed out for ${channelName}`);
                } else if (status === 'CLOSED') {
                    console.log(`[Comments] Channel closed: ${channelName}`);
                }
            });
        
        return () => {
            console.log(`[Comments] Unsubscribing from ${channelName}`);
            supabase.removeChannel(channel);
        };
    }, [beerId, enabled, queryClient]);
}
