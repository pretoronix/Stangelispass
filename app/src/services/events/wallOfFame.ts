import { supabase } from '../client';
import { isMissingTableError } from '../helpers';

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
        if (isMissingTableError(error)) {
            console.log('[Events] table `wall_of_fame` not found. Returning empty wall of fame. (expected)');
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
        if (isMissingTableError(error)) {
            console.log('[Events] table `wall_of_fame` not found. addToWallOfFame skipped. (expected)');
            return null;
        }
        throw error;
    }
    return data || null;
};
