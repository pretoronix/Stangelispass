import { supabase } from '../client';
import { isMissingTableError } from '../helpers';
import { getEventGameStats } from './stats';
import { getBeerCountByUser } from '../beers/beerQueries';
import type { EventLeaderSnapshot } from '../types';
import { logExpected } from '@/utils/logger';

type LeaderboardRow = {
    user_id: string;
    name: string;
    beer_count: number;
    points?: number;
    last_beer_at?: string | null;
};

const fetchLeaderLastBeerAt = async (eventId: string, leaderId: string) => {
    const { data, error } = await (supabase
        .from('beers') as any)
        .select('created_at')
        .eq('event_id', eventId)
        .eq('user_id', leaderId)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        if (isMissingTableError(error)) {
            return null;
        }
        throw error;
    }
    return ((data as any[]) && (data as any[])[0]?.created_at) || null;
};

const buildLastBeerByUser = async (eventId: string) => {
    const { data, error } = await (supabase
        .from('beers') as any)
        .select('user_id, created_at')
        .eq('event_id', eventId);

    if (error) {
        if (isMissingTableError(error)) {
            return new Map<string, string>();
        }
        throw error;
    }

    const lastByUser = new Map<string, string>();
    for (const row of data || []) {
        const userId = (row as any).user_id as string;
        const createdAt = (row as any).created_at as string;
        const current = lastByUser.get(userId);
        if (!current || new Date(createdAt) > new Date(current)) {
            lastByUser.set(userId, createdAt);
        }
    }
    return lastByUser;
};

export const createLeaderEventSnapshot = async (eventId: string): Promise<EventLeaderSnapshot | null> => {
    try {
        const statsResult = await getEventGameStats(eventId);
        let leaderboard: LeaderboardRow[] = [];

        if (!statsResult.missingTable) {
            leaderboard = statsResult.stats.map((stat) => ({
                user_id: stat.user_id,
                name: stat.user?.name || 'Unknown',
                beer_count: stat.beer_count,
                points: stat.points,
                last_beer_at: stat.last_beer_at || null,
            }));
        } else {
            const counts = await getBeerCountByUser(eventId);
            const lastBeerByUser = await buildLastBeerByUser(eventId);
            leaderboard = counts.map((row) => ({
                user_id: row.userId,
                name: row.name,
                beer_count: row.count,
                last_beer_at: lastBeerByUser.get(row.userId) || null,
            }));
        }

        if (leaderboard.length === 0) {
            return null;
        }

        const sorted = leaderboard.slice().sort((a, b) => {
            const pointsDiff = (b.points || 0) - (a.points || 0);
            if (pointsDiff !== 0) return pointsDiff;
            return b.beer_count - a.beer_count;
        });

        const leader = sorted[0];
        if (!leader) return null;

        const leaderLastBeerAt = leader.last_beer_at || await fetchLeaderLastBeerAt(eventId, leader.user_id);

        const { data, error } = await (supabase
            .from('event_leader_snapshots') as any)
            .insert({
                event_id: eventId,
                leader_id: leader.user_id,
                leader_beer_count: leader.beer_count,
                leader_points: leader.points || 0,
                leader_last_beer_at: leaderLastBeerAt,
                leaderboard: sorted,
                snapshot_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                logExpected('table `event_leader_snapshots` not found. Snapshot skipped.', 'Events');
                return null;
            }
            throw error;
        }

        return (data as EventLeaderSnapshot) || null;
    } catch (e: any) {
        if (isMissingTableError(e)) {
            logExpected('table `event_leader_snapshots` not found. Snapshot skipped.', 'Events');
            return null;
        }
        throw e;
    }
};
