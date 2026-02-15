import { supabase } from "../client";
import { EventGameStats, EventLeaderState } from "../types";
import { isMissingTableError } from "../helpers";

export const getEventGameStats = async (
  eventId: string,
): Promise<{ stats: EventGameStats[]; missingTable: boolean }> => {
  try {
    const { data, error } = await (supabase.from("event_game_stats") as any)
      .select("*, user:users!user_id(id,name,is_admin)")
      .eq("event_id", eventId)
      .order("points", { ascending: false })
      .order("beer_count", { ascending: false });

    if (error) {
      if (isMissingTableError(error)) {
        return { stats: [] as EventGameStats[], missingTable: true };
      }
      throw error;
    }

    return { stats: (data as EventGameStats[]) || [], missingTable: false };
  } catch (e: any) {
    if (isMissingTableError(e)) {
      return { stats: [] as EventGameStats[], missingTable: true };
    }
    throw e;
  }
};

export const getEventLeaderState = async (
  eventId: string,
): Promise<{ leader: EventLeaderState | null; missingTable: boolean }> => {
  try {
    const { data, error } = await (supabase.from("event_leader_state") as any)
      .select("*, user:users!user_id(id,name,is_admin)")
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        return { leader: null as EventLeaderState | null, missingTable: true };
      }
      throw error;
    }

    return { leader: (data as EventLeaderState) || null, missingTable: false };
  } catch (e: any) {
    if (isMissingTableError(e)) {
      return { leader: null as EventLeaderState | null, missingTable: true };
    }
    throw e;
  }
};
