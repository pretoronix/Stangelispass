import { createClient } from "@supabase/supabase-js";

/**
 * Database Health Integration Test
 *
 * This test verifies that the database schema is complete and accessible.
 * It checks for the existence of all 14 core tables.
 */

const env: Record<string, string | undefined> =
  typeof process !== "undefined" && (process as any).env
    ? ((process as any).env as any)
    : {};

const shouldRun =
  env.RUN_DB_HEALTH_TESTS === "1" &&
  Boolean(env.EXPO_PUBLIC_SUPABASE_URL) &&
  Boolean(env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const describeIf = shouldRun ? describe : describe.skip;

describeIf("Database Schema Health", () => {
  const supabase = createClient(
    env.EXPO_PUBLIC_SUPABASE_URL as string,
    env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string,
  );
  const tablesToCheck = [
    "users",
    "events",
    "event_memberships",
    "beers",
    "achievements",
    "wall_of_fame",
    "toasts",
    "beer_stamps",
    "device_tokens",
    "notifications",
    "comments",
    "event_game_stats",
    "event_leader_state",
    "event_leader_snapshots",
  ];

  tablesToCheck.forEach((table) => {
    it(`should have table "${table}" accessible`, async () => {
      const { error, count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      // We expect the table to exist (no PGRST204/PGRST205 errors)
      // Even if empty, count should be 0 or more
      if (error) {
        console.error(`Error checking table ${table}:`, error);
      }

      expect(error).toBeNull();
      expect(typeof count).toBe("number");
    });
  });

  it("should be able to fetch the Admin user", async () => {
    const { data, error } = await (supabase.from("users") as any)
      .select("name")
      .eq("name", "Admin")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.name).toBe("Admin");
  });

  it("should have basic column integrity in event_game_stats", async () => {
    const { data, error } = await supabase
      .from("event_game_stats")
      .select("beer_count, points, lead_changes")
      .limit(1);

    if (error) {
      console.error("Error checking columns in event_game_stats:", error);
    }

    expect(error).toBeNull();
  });
});
