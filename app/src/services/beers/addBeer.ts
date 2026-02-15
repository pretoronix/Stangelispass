import { supabase } from '../client';
import { Beer } from '../types';
import { checkAchievements, BadgeType } from '../achievements';
import { isMissingTableError } from '../helpers';
import { logMissingTable } from './beerUtils';

const fetchRecentBeers = async (userId: string): Promise<Beer[]> => {
    const { data } = await supabase
        .from('beers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
    return (data as Beer[]) || [];
};

const fetchLifetimeCount = async (userId: string): Promise<number> => {
    const { count } = await supabase
        .from('beers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
    return (count as number) || 0;
};

const fetchOwnedBadges = async (userId: string): Promise<Set<BadgeType>> => {
    const { data } = await supabase
        .from('achievements')
        .select('badge_type')
        .eq('user_id', userId);
    return new Set((data || []).map((b: any) => b.badge_type as BadgeType));
};

const awardBadges = async (userId: string, newlyUnlocked: BadgeType[]) => {
    if (newlyUnlocked.length === 0) return;
    try {
        await (supabase.from('achievements') as any).insert(
            newlyUnlocked.map(type => ({
                user_id: userId,
                badge_type: type
            }))
        );
    } catch (e: any) {
        if (isMissingTableError(e)) {
            logMissingTable('achievements', 'Skipping badge award (expected)');
        } else {
            throw e;
        }
    }
};

export const addBeer = async (
    userId: string,
    addedBy: string,
    eventId: string
): Promise<{ beer: Beer | null; newBadges: BadgeType[] }> => {
    if (!eventId) {
        throw new Error('eventId is required to log a beer');
    }

    const { data: newBeer, error } = await (supabase
        .from('beers') as any)
        .insert({
            user_id: userId,
            added_by: addedBy,
            event_id: eventId
        })
        .select()
        .single();

    if (error) {
        if (isMissingTableError(error)) {
            logMissingTable('beers', 'addBeer skipped (expected)');
            return { beer: null, newBadges: [] };
        }
        throw error;
    }

    // ✅ CRASH PREVENTION: Ensure we got valid data back from insert
    if (!newBeer || !newBeer.id) {
        throw new Error('Failed to create beer: Supabase returned no data. Check database connection and RLS policies.');
    }

    const recentBeers = await fetchRecentBeers(userId);
    const lifetimeCount = await fetchLifetimeCount(userId);

    const safeRecent = (recentBeers as Beer[]) || [];
    const safeNewBeer = (newBeer as Beer) || { created_at: new Date().toISOString(), user_id: userId } as Beer;
    const safeLifetime = (lifetimeCount as number) || 0;

    const potentialBadges = checkAchievements(
        safeRecent,
        safeNewBeer,
        safeLifetime
    );

    const owned = await fetchOwnedBadges(userId);
    const newlyUnlocked = potentialBadges.filter(b => !owned.has(b));

    await awardBadges(userId, newlyUnlocked);

    return { beer: newBeer, newBadges: newlyUnlocked };
};
