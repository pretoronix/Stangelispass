import { supabase } from "../client";
import { isMissingTableError } from "../helpers";

export const resetEventData = async (): Promise<
  { table: string; ok: boolean; skipped?: boolean; error?: any }[]
> => {
  const results: {
    table: string;
    ok: boolean;
    skipped?: boolean;
    error?: any;
  }[] = [];
  const tableConfigs = [
    { table: "beers", filterColumn: "id" },
    { table: "beer_stamps", filterColumn: "id" },
    { table: "achievements", filterColumn: "id" },
    { table: "notifications", filterColumn: "id" },
    { table: "device_tokens", filterColumn: "id" },
    { table: "wall_of_fame", filterColumn: "id" },
    { table: "event_leader_snapshots", filterColumn: "id" },
    { table: "event_game_stats", filterColumn: "event_id" },
    { table: "event_leader_state", filterColumn: "event_id" },
    { table: "event_memberships", filterColumn: "id" },
    { table: "events", filterColumn: "id" },
  ];

  for (const { table, filterColumn } of tableConfigs) {
    try {
      const { error } = await (supabase as any)
        .from(table)
        .delete()
        .not(filterColumn, "is", null);
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
