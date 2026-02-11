import { supabase } from './client';
import { Beer, BeerStamp, BeerStampIssueResult, Achievement } from './types';
import { checkAchievements, BadgeType } from './achievements';
import { isMissingTableError } from './helpers';

/**
 * Beer operations module
 * Handles all beer logging, stamps, and achievement operations
 */

export const addBeer = async (userId: string, addedBy: string, eventId: string): Promise<{ beer: Beer | null; newBadges: BadgeType[] }> => {
    if (!eventId) {
        throw new Error('eventId is required to log a beer');
    }
    
    // 1. Insert Beer
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
        if ((error as any).code === 'PGRST205') {
            console.warn('Supabase: table `beers` not found. addBeer skipped.');
            return { beer: null, newBadges: [] };
        }
        throw error;
    }

    // 2. Context for Achievements
    const { data: recentBeers } = await supabase
        .from('beers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

    const { count: lifetimeCount } = await supabase
        .from('beers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    // 3. Check Logic
    const safeRecent = (recentBeers as Beer[]) || [];
    const safeNewBeer = (newBeer as Beer) || { created_at: new Date().toISOString(), user_id: userId } as Beer;
    const safeLifetime = (lifetimeCount as number) || 0;

    const potentialBadges = checkAchievements(
        safeRecent,
        safeNewBeer,
        safeLifetime
    );

    // 4. Dedup against existing
    const { data: existing } = await supabase
        .from('achievements')
        .select('badge_type')
        .eq('user_id', userId);

    const owned = new Set(existing?.map((b: any) => b.badge_type) || []);
    const newlyUnlocked = potentialBadges.filter(b => !owned.has(b));

    // 5. Award new badges
    if (newlyUnlocked.length > 0) {
        try {
            await (supabase.from('achievements') as any).insert(
                newlyUnlocked.map(type => ({
                    user_id: userId,
                    badge_type: type
                }))
            );
        } catch (e: any) {
            if (e?.code === 'PGRST205') {
                console.warn('Supabase: table `achievements` not found. Skipping badge award.');
            } else {
                throw e;
            }
        }
    }

    return { beer: newBeer, newBadges: newlyUnlocked };
};

export const getBeers = async (eventId?: string): Promise<Beer[]> => {
    let query = supabase
        .from('beers')
        .select(`
            *,
            user:users!user_id(*),
            added_by_user:users!added_by(*)
        `)
        .order('created_at', { ascending: false });

    if (eventId) {
        query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) {
        if ((error as any).code === 'PGRST205') {
            console.warn('Supabase: table `beers` not found. Returning empty beers list.');
            return [];
        }
        throw error;
    }
    return (data as unknown as Beer[]) || [];
};

export const getBeersByUser = async (userId: string): Promise<Beer[]> => {
    const { data, error } = await supabase
        .from('beers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        if ((error as any).code === 'PGRST205') {
            console.warn('Supabase: table `beers` not found. Returning empty beers list.');
            return [];
        }
        throw error;
    }
    return (data as Beer[]) || [];
};

export const removeBeer = async (beerId: string): Promise<void> => {
    const { error } = await supabase
        .from('beers')
        .delete()
        .eq('id', beerId);

    if (error) {
        if ((error as any).code === 'PGRST205') {
            console.warn('Supabase: table `beers` not found. removeBeer skipped.');
            return;
        }
        throw error;
    }
};

export const getBeerCountByUser = async (eventId?: string): Promise<{ userId: string; name: string; count: number; isAdmin: boolean }[]> => {
    const { data: users, error: usersError } = await (supabase
        .from('users') as any)
        .select('id,name,is_admin');

    if (usersError) {
        if ((usersError as any).code === 'PGRST205') {
            console.warn('Supabase: table `users` not found. Returning empty beer counts.');
            return [];
        }
        throw usersError;
    }

    let beersQuery = (supabase
        .from('beers') as any)
        .select('user_id');

    if (eventId) {
        beersQuery = beersQuery.eq('event_id', eventId);
    }

    const { data: beers, error: beersError } = await beersQuery;
    if (beersError) {
        if ((beersError as any).code === 'PGRST205') {
            console.warn('Supabase: table `beers` not found. Returning zero beer counts.');
            return (users || []).map((u: any) => ({
                userId: u.id,
                name: u.name,
                count: 0,
                isAdmin: !!u.is_admin,
            }));
        }
        throw beersError;
    }

    const counts = new Map<string, number>();
    for (const row of beers || []) {
        const key = (row as any).user_id as string;
        counts.set(key, (counts.get(key) || 0) + 1);
    }

    return (users || []).map((u: any) => ({
        userId: u.id,
        name: u.name,
        count: counts.get(u.id) || 0,
        isAdmin: !!u.is_admin,
    }));
};

export const createBeerStamp = async (userId: string, eventId: string, issuedBy: string): Promise<BeerStampIssueResult> => {
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const { data, error } = await (supabase
        .from('beer_stamps') as any)
        .insert({
            user_id: userId,
            event_id: eventId,
            issued_by: issuedBy,
            expires_at: expiresAt,
        })
        .select()
        .single();

    if (error) {
        if (isMissingTableError(error)) {
            console.warn('Supabase: table `beer_stamps` not found. createBeerStamp skipped.');
            return { stamp: null, fallbackLegacy: true };
        }
        throw error;
    }

    return { stamp: (data as BeerStamp) || null, fallbackLegacy: false };
};

export const redeemBeerStamp = async (stampId: string, addedBy: string): Promise<{ ok: boolean; reason: string; beer: Beer | null; newBadges: BadgeType[] }> => {
    const { data: stamp, error: fetchError } = await (supabase
        .from('beer_stamps') as any)
        .select('*')
        .eq('id', stampId)
        .maybeSingle();

    if (fetchError) {
        if (isMissingTableError(fetchError)) {
            return { ok: false, reason: 'stamps_unavailable', beer: null, newBadges: [] as BadgeType[] };
        }
        throw fetchError;
    }

    if (!stamp) return { ok: false, reason: 'invalid_stamp', beer: null, newBadges: [] as BadgeType[] };
    if (stamp.consumed_at) return { ok: false, reason: 'already_redeemed', beer: null, newBadges: [] as BadgeType[] };
    if (new Date(stamp.expires_at).getTime() < Date.now()) {
        return { ok: false, reason: 'expired_stamp', beer: null, newBadges: [] as BadgeType[] };
    }

    const { data: claimed, error: claimError } = await (supabase
        .from('beer_stamps') as any)
        .update({ consumed_at: new Date().toISOString(), consumed_by: addedBy })
        .eq('id', stampId)
        .is('consumed_at', null)
        .select()
        .single();

    if (claimError || !claimed) {
        return { ok: false, reason: 'already_redeemed', beer: null, newBadges: [] as BadgeType[] };
    }

    try {
        const { beer, newBadges } = await addBeer(claimed.user_id, addedBy, claimed.event_id);
        return { ok: true, reason: 'redeemed', beer, newBadges };
    } catch (e) {
        // Best-effort rollback of redemption marker if beer insertion fails.
        await (supabase
            .from('beer_stamps') as any)
            .update({ consumed_at: null, consumed_by: null })
            .eq('id', stampId)
            .eq('consumed_by', addedBy);
        throw e;
    }
};

export const getUserAchievements = async (userId: string): Promise<Achievement[]> => {
    const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        if ((error as any).code === 'PGRST205') {
            console.warn('Supabase: table `achievements` not found. Returning empty achievements.');
            return [];
        }
        throw error;
    }
    return (data as Achievement[]) || [];
};
