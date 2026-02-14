import { supabase } from '../client';
import { Beer, BeerStamp, BeerStampIssueResult } from '../types';
import { isMissingTableError } from '../helpers';
import { logMissingTable } from './beerUtils';
import { addBeer } from './addBeer';
import type { BadgeType } from '../achievements';

export const createBeerStamp = async (
    userId: string,
    eventId: string,
    issuedBy: string
): Promise<BeerStampIssueResult> => {
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
            logMissingTable('beer_stamps', 'createBeerStamp skipped (expected)');
            return { stamp: null, fallbackLegacy: true };
        }
        throw error;
    }

    return { stamp: (data as BeerStamp) || null, fallbackLegacy: false };
};

export const redeemBeerStamp = async (
    stampId: string,
    addedBy: string
): Promise<{ ok: boolean; reason: string; beer: Beer | null; newBadges: BadgeType[] }> => {
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
