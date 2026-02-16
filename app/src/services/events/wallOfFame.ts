import { supabase } from "../client";
import { isMissingTableError } from "../helpers";
import { logExpected, reportError } from "@/utils/logger";

export const getWallOfFame = async (): Promise<any[]> => {
  const { data, error } = await (supabase.from("wall_of_fame") as any)
    .select(
      `
            *,
            winner:users!winner_id(*),
            event:events!event_id(*)
        `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      logExpected(
        "table `wall_of_fame` not found. Returning empty wall of fame.",
        "events",
      );
      return [];
    }
    throw error;
  }
  return data || [];
};

export const addToWallOfFame = async (
  eventId: string,
  winnerId: string,
  totalBeers: number,
): Promise<any> => {
  const { data, error } = await (supabase.from("wall_of_fame") as any)
    .insert({
      event_id: eventId,
      winner_id: winnerId,
      total_stängeli: totalBeers,
    })
    .select()
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      logExpected(
        "table `wall_of_fame` not found. addToWallOfFame skipped.",
        "events",
      );
      return null;
    }
    throw error;
  }
  return data || null;
};
