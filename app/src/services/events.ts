import { supabase } from './client';
import { Event, EventMembership, EventGameStats, EventLeaderState, EventRole } from './types';
import { isMissingTableError } from './helpers';

// Re-export types for convenience
export type { Event, EventMembership, EventGameStats, EventLeaderState, EventRole } from './types';

/**
 * Event operations module
 * Handles all event-related database operations including memberships and game stats
 */

export const getEventMembership = async (eventId: string, userId: string): Promise<{ membership: EventMembership | null; missingTable: boolean }> => {
    try {
        const { data, error } = await (supabase
            .from('event_memberships') as any)
            .select('*')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            if (isMissingTableError(error)) {
                return { membership: null as EventMembership | null, missingTable: true };
            }
            throw error;
        }

        return { membership: (data as EventMembership) || null, missingTable: false };
    } catch (e: any) {
        if (isMissingTableError(e)) {
            return { membership: null as EventMembership | null, missingTable: true };
        }
        throw e;
    }
};

export const getEventGameStats = async (eventId: string): Promise<{ stats: EventGameStats[]; missingTable: boolean }> => {
    try {
        const { data, error } = await (supabase
            .from('event_game_stats') as any)
            .select('*, user:users!user_id(id,name,is_admin)')
            .eq('event_id', eventId)
            .order('points', { ascending: false })
            .order('beer_count', { ascending: false });

        if (error) {
            if (isMissingTableError(error)) {
                return { stats: [] as EventGameStats[], missingTable: true };
            }
            throw error;
        }

        return { stats: (data as EventGameStats[]) || [], missingTable: false };
    } catch (e: any) {
        if (isMissingTableError(e)) {
            return { stats: [] as EventGameStats[], missingTable: true };
        }
        throw e;
    }
};

export const getEventLeaderState = async (eventId: string): Promise<{ leader: EventLeaderState | null; missingTable: boolean }> => {
    try {
        const { data, error } = await (supabase
            .from('event_leader_state') as any)
            .select('*, user:users!user_id(id,name,is_admin)')
            .eq('event_id', eventId)
            .maybeSingle();

        if (error) {
            if (isMissingTableError(error)) {
                return { leader: null as EventLeaderState | null, missingTable: true };
            }
            throw error;
        }

        return { leader: (data as EventLeaderState) || null, missingTable: false };
    } catch (e: any) {
        if (isMissingTableError(e)) {
            return { leader: null as EventLeaderState | null, missingTable: true };
        }
        throw e;
    }
};

export const getEventMembers = async (eventId: string): Promise<EventMembership[]> => {
    try {
        const { data, error } = await (supabase
            .from('event_memberships') as any)
            .select('*, user:users!user_id(id,name,is_admin)')
            .eq('event_id', eventId)
            .eq('status', 'active')
            .order('created_at', { ascending: true });

        if (error) {
            if (isMissingTableError(error)) return [] as EventMembership[];
            throw error;
        }

        return (data as EventMembership[]) || [];
    } catch (e: any) {
        if (isMissingTableError(e)) return [] as EventMembership[];
        throw e;
    }
};

export const upsertEventMemberRole = async (eventId: string, userId: string, role: EventRole, invitedBy?: string | null): Promise<EventMembership | null> => {
    const payload = {
        event_id: eventId,
        user_id: userId,
        role,
        status: 'active',
        invited_by: invitedBy || null,
        joined_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase
        .from('event_memberships') as any)
        .upsert(payload, { onConflict: 'event_id,user_id' })
        .select()
        .single();

    if (error) {
        if (isMissingTableError(error)) return null;
        throw error;
    }

    return (data as EventMembership) || null;
};

export const removeEventMember = async (eventId: string, userId: string): Promise<boolean> => {
    const { error } = await (supabase
        .from('event_memberships') as any)
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

    if (error) {
        if (isMissingTableError(error)) return false;
        throw error;
    }

    return true;
};

export const joinEvent = async (eventId: string, userId: string, invitedBy?: string | null): Promise<{ ok: boolean; fallbackLegacy: boolean }> => {
    const membership = await upsertEventMemberRole(eventId, userId, 'member', invitedBy || null);
    if (!membership) {
        // Legacy fallback when table doesn't exist yet.
        return { ok: true, fallbackLegacy: true };
    }
    return { ok: true, fallbackLegacy: false };
};

export const getWallOfFame = async (): Promise<any[]> => {
    const { data, error } = await supabase
        .from('wall_of_fame')
        .select(`
            *,
            winner:users!winner_id(*),
            event:events!event_id(*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        if ((error as any).code === 'PGRST205') {
            console.warn('Supabase: table `wall_of_fame` not found. Returning empty wall of fame.');
            return [];
        }
        throw error;
    }
    return data || [];
};

export const addToWallOfFame = async (eventId: string, winnerId: string, totalBeers: number): Promise<any> => {
    const { data, error } = await (supabase
        .from('wall_of_fame') as any)
        .insert({
            event_id: eventId,
            winner_id: winnerId,
            total_stängeli: totalBeers
        })
        .select()
        .single();

    if (error) {
        if ((error as any).code === 'PGRST205') {
            console.warn('Supabase: table `wall_of_fame` not found. addToWallOfFame skipped.');
            return null;
        }
        throw error;
    }
    return data || null;
};

export const resetEventData = async (): Promise<{ table: string; ok: boolean; skipped?: boolean; error?: any }[]> => {
    const results: { table: string; ok: boolean; skipped?: boolean; error?: any }[] = [];
    const tables = [
        'beers',
        'beer_stamps',
        'achievements',
        'notifications',
        'device_tokens',
        'wall_of_fame',
        'event_game_stats',
        'event_leader_state',
        'event_memberships',
        'events',
    ];

    for (const table of tables) {
        try {
            const { error } = await (supabase as any)
                .from(table)
                .delete()
                .neq('id', '');
            if (error) {
                if (isMissingTableError(error)) {
                    results.push({ table, ok: true, skipped: true });
                    continue;
                }
                results.push({ table, ok: false, error });
            } else {
                results.push({ table, ok: true });
            }
        } catch (e) {
            results.push({ table, ok: false, error: e });
        }
    }

    return results;
};
