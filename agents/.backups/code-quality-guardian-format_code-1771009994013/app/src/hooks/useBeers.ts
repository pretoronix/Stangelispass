import { useState, useCallback, useEffect } from 'react';
import { supabase, getBeerCountByUser, getEventGameStats, getEventLeaderState, getUsers, User } from '@/services/supabase';
import { useApp } from '@/providers/AppProvider';
import { reportError } from '@/utils/logger';

export interface UserBeerCount {
    userId: string;
    name: string;
    count: number;
    isAdmin: boolean;
    points?: number;
    streakCount?: number;
    longestStreak?: number;
    leadChanges?: number;
}

export const useBeers = () => {
    const { activeEvent } = useApp();
    const [beerCounts, setBeerCounts] = useState<UserBeerCount[]>([]);
    const [rawBeers, setRawBeers] = useState<any[]>([]);
    const [totalBeers, setTotalBeers] = useState(0);
    const [leaderInfo, setLeaderInfo] = useState<UserBeerCount | null>(null);
    const [leaderLead, setLeaderLead] = useState(0);
    const [hotStreak, setHotStreak] = useState<UserBeerCount | null>(null);
    const [gameStatsAvailable, setGameStatsAvailable] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            if (activeEvent?.id) {
                const [statsResult, leaderResult, users] = await Promise.all([
                    getEventGameStats(activeEvent.id),
                    getEventLeaderState(activeEvent.id),
                    getUsers(),
                ]);

                if (!statsResult.missingTable) {
                    setGameStatsAvailable(true);
                    const statsByUser = new Map(
                        statsResult.stats.map((stat) => [stat.user_id, stat])
                    );

                    const merged = (users || []).map((user: User): UserBeerCount => {
                        const stat = statsByUser.get(user.id);
                        return {
                            userId: user.id,
                            name: user.name,
                            count: stat?.beer_count ?? 0,
                            isAdmin: !!user.is_admin,
                            points: stat?.points ?? 0,
                            streakCount: stat?.streak_count ?? 0,
                            longestStreak: stat?.longest_streak ?? 0,
                            leadChanges: stat?.lead_changes ?? 0,
                        };
                    });

                    const sorted = merged.sort((a: UserBeerCount, b: UserBeerCount) => {
                        const pointsDiff = (b.points || 0) - (a.points || 0);
                        if (pointsDiff !== 0) return pointsDiff;
                        return b.count - a.count;
                    });

                    setBeerCounts(sorted);
                    setTotalBeers(sorted.reduce((sum: number, u: UserBeerCount) => sum + u.count, 0));

                    const leaderFallback = sorted[0] || null;
                    const leaderFromState = leaderResult.leader?.user_id
                        ? sorted.find((u: UserBeerCount) => u.userId === leaderResult.leader?.user_id) || leaderFallback
                        : leaderFallback;
                    setLeaderInfo(leaderFromState || null);

                    if (sorted.length > 1 && leaderFromState) {
                        const runnerUp = sorted.find((u: UserBeerCount) => u.userId !== leaderFromState.userId);
                        const lead = runnerUp ? (leaderFromState.points || 0) - (runnerUp.points || 0) : (leaderFromState.points || 0);
                        setLeaderLead(Math.max(lead, 0));
                    } else {
                        setLeaderLead(leaderFromState?.points || 0);
                    }

                    const hot = sorted.reduce((best: UserBeerCount | null, current: UserBeerCount) => {
                        if (!best) return current;
                        const bestStreak = best.streakCount || 0;
                        const currentStreak = current.streakCount || 0;
                        if (currentStreak > bestStreak) return current;
                        return best;
                    }, null);
                    setHotStreak(hot && (hot.streakCount || 0) > 0 ? hot : null);
                } else {
                    setGameStatsAvailable(false);
                    const counts = (await getBeerCountByUser(activeEvent.id)) as UserBeerCount[];
                    const sorted = counts.sort((a, b) => b.count - a.count);
                    setBeerCounts(sorted);
                    setTotalBeers(sorted.reduce((sum, u) => sum + u.count, 0));
                    setLeaderInfo(sorted[0] || null);
                    setLeaderLead(sorted[0]?.count || 0);
                    setHotStreak(null);
                }
            } else {
                setGameStatsAvailable(false);
                const counts = (await getBeerCountByUser()) as UserBeerCount[];
                const sorted = counts.sort((a, b) => b.count - a.count);
                setBeerCounts(sorted);
                setTotalBeers(sorted.reduce((sum, u) => sum + u.count, 0));
                setLeaderInfo(sorted[0] || null);
                setLeaderLead(sorted[0]?.count || 0);
                setHotStreak(null);
            }

            // Fetch raw beers for velocity calculation if there's an active event
            if (activeEvent) {
                const { data } = await supabase
                    .from('beers')
                    .select('created_at')
                    .eq('event_id', activeEvent.id);
                setRawBeers(data || []);
            } else {
                setRawBeers([]);
            }
        } catch (e) {
            reportError(new Error('Failed to fetch beer data:', e), { scope: 'useBeers', action: 'replace_console' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeEvent]);

    const refresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('beers_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'beers' }, () => {
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_game_stats' }, () => {
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_leader_state' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    return { beerCounts, rawBeers, totalBeers, leaderInfo, leaderLead, hotStreak, gameStatsAvailable, loading, refreshing, refresh };
};
