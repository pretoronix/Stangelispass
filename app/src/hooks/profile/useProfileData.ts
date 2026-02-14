import { useCallback, useEffect, useState } from 'react';
import { getBeersByUser, getUserAchievements } from '@/services/supabase';
import { reportError } from '@/utils/logger';
import type { Achievement, Beer, Event, User } from '@/services/supabase';

type ProfileData = {
    beers: Beer[];
    roundBeers: Beer[];
    achievements: Achievement[];
    loading: boolean;
    refreshing: boolean;
    refresh: () => void;
};

const getCurrentRoundBeers = (userBeers: Beer[], activeEventId?: string | null) =>
    activeEventId ? userBeers.filter(b => b.event_id === activeEventId) : [];

export function useProfileData(currentUser: User | null, activeEvent: Event | null): ProfileData {
    const [beers, setBeers] = useState<Beer[]>([]);
    const [roundBeers, setRoundBeers] = useState<Beer[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!currentUser) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            const [userBeers, userAchievements] = await Promise.all([
                getBeersByUser(currentUser.id),
                getUserAchievements(currentUser.id),
            ]);
            setBeers(userBeers);
            setRoundBeers(getCurrentRoundBeers(userBeers, activeEvent?.id));
            setAchievements(userAchievements);
        } catch (e) {
            reportError(new Error('Failed to fetch profile data:', e), { scope: 'profile', action: 'replace_console' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeEvent?.id, currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    return {
        beers,
        roundBeers,
        achievements,
        loading,
        refreshing,
        refresh,
    };
}
