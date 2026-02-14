import { supabase } from '../client';
import { isMissingTableError } from '../helpers';

export const resetEventData = async (): Promise<{ table: string; ok: boolean; skipped?: boolean; error?: any }[]> => {
    const results: { table: string; ok: boolean; skipped?: boolean; error?: any }[] = [];
    const tables = [
        'beers',
        'beer_stamps',
        'achievements',
        'notifications',
        'device_tokens',
        'wall_of_fame',
        'event_leader_snapshots',
        'event_game_stats',
        'event_leader_state',
        'event_memberships',
        'events',
    ];
    const deleteFilters: Record<string, string> = {
        event_game_stats: 'event_id',
        event_leader_state: 'event_id',
        event_leader_snapshots: 'event_id',
        event_memberships: 'event_id',
    };

    for (const table of tables) {
        try {
            const filterColumn = deleteFilters[table] || 'id';
            const { error } = await (supabase as any)
                .from(table)
                .delete()
                .neq(filterColumn, '');
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
