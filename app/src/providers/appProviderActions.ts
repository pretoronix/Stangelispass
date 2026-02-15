import { supabase, Event, isMissingTableError, createLeaderEventSnapshot } from '@/services/supabase';
import { reportError } from '@/utils/logger';
import { getPassExpiresAt } from '@/providers/appProviderUtils';

interface StartEventInput {
    name: string;
    userId: string;
    passType: Event['pass_type'];
    beerPrice?: number;
}

export async function startEventInSupabase({
    name,
    userId,
    passType,
    beerPrice,
}: StartEventInput): Promise<Event> {
    let resolvedPassType: Event['pass_type'] = passType;

    if (passType !== 'free') {
        try {
            const { count, error: countError } = await (supabase.from('events') as any)
                .select('*', { count: 'exact', head: true });
            if (countError) {
                if (!isMissingTableError(countError)) {
                    throw countError;
                }
            } else if ((count as number) === 0) {
                resolvedPassType = 'free';
            }
        } catch (countErr) {
            reportError(countErr as Error, { scope: 'app_provider', action: 'resolve_pass_type' });
        }
    }

    const { data, error } = await (supabase.from('events') as any)
        .insert({
            name,
            created_by: userId,
            is_active: true,
            pass_type: resolvedPassType,
            beer_price: beerPrice ?? 5.0,
            expires_at: getPassExpiresAt(resolvedPassType),
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    if (!data || !(data as any).id) {
        throw new Error(
            'Failed to create event: Supabase returned no data. Check database connection, migrations (beer_price), and RLS policies.'
        );
    }

    return data as Event;
}

export async function closeEventInSupabase(activeEvent: Event): Promise<void> {
    const { data: counts, error: countError } = await supabase
        .from('users')
        .select(`
            id,
            name,
            beers:beers!user_id(count)
        `)
        .filter('beers.event_id', 'eq', activeEvent.id);

    if (!countError && counts && counts.length > 0) {
        const winner: any = (counts as any[]).reduce((prev: any, current: any) => {
            const prevCount = prev.beers[0]?.count || 0;
            const currentCount = current.beers[0]?.count || 0;
            return (currentCount > prevCount) ? current : prev;
        }, counts[0]);

        const winnerCount = winner.beers[0]?.count || 0;
        if (winnerCount > 0) {
            await (supabase
                .from('wall_of_fame') as any)
                .insert({
                    event_id: activeEvent.id,
                    winner_id: winner.id,
                    total_stängeli: winnerCount,
                });
        }
    }

    try {
        await createLeaderEventSnapshot(activeEvent.id);
    } catch (snapshotError) {
        reportError(snapshotError as Error, { scope: 'app_provider', action: 'leader_snapshot' });
    }

    const { error } = await (supabase
        .from('events') as any)
        .update({ is_active: false } as Partial<Event>)
        .eq('id', activeEvent.id);

    if (error) {
        throw error;
    }
}
