import { supabase } from './supabase';

export interface WallOfFameEntry {
  id: string;
  event_id: string;
  winner_id: string;
  total_stängeli: number;
  image_url: string | null;
  created_at: string;
  winner_name?: string;
  event_name?: string;
  toast_count?: number;
}

export interface Toast {
  id: string;
  wall_id: string;
  user_id: string;
  created_at: string;
}

export async function getWallOfFame(): Promise<WallOfFameEntry[]> {
  try {
    const { data, error } = await supabase
      .from('wall_of_fame')
      .select(`
        *,
        winner:users!winner_id(name),
        event:events!event_id(name),
        toasts:toasts(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to include winner_name and toast_count
    return (data || []).map((entry: any) => ({
      id: entry.id,
      event_id: entry.event_id,
      winner_id: entry.winner_id,
      total_stängeli: entry.total_stängeli || 0,
      image_url: entry.image_url,
      created_at: entry.created_at,
      winner_name: entry.winner?.name || 'Unknown',
      event_name: entry.event?.name || 'Unknown Event',
      toast_count: Array.isArray(entry.toasts) ? entry.toasts.length : 0,
    }));
  } catch (error) {
    console.error('Failed to fetch wall of fame:', error);
    return [];
  }
}

export async function createWallOfFameEntry(entry: {
  event_id: string;
  winner_id: string;
  total_stängeli: number;
  image_url?: string;
}): Promise<WallOfFameEntry | null> {
  try {
    const { data, error } = await supabase
      .from('wall_of_fame')
      .insert([entry] as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to create wall of fame entry:', error);
    return null;
  }
}

export async function addToast(wallId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('toasts')
      .insert([{ wall_id: wallId, user_id: userId }] as any);

    if (error) {
      // Check if it's a unique constraint violation (already toasted)
      if (error.code === '23505') {
        console.log('User has already toasted this entry');
        return false;
      }
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to add toast:', error);
    return false;
  }
}

export async function removeToast(wallId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('toasts')
      .delete()
      .eq('wall_id', wallId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to remove toast:', error);
    return false;
  }
}

export async function getUserToasts(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('toasts')
      .select('wall_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((t: any) => t.wall_id);
  } catch (error) {
    console.error('Failed to fetch user toasts:', error);
    return [];
  }
}

export async function getToastCount(wallId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('toasts')
      .select('*', { count: 'exact', head: true })
      .eq('wall_id', wallId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Failed to get toast count:', error);
    return 0;
  }
}
