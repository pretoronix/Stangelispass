import { createClient } from "@supabase/supabase-js";

const env: Record<string, string | undefined> =
  typeof process !== "undefined" && (process as any).env
    ? ((process as any).env as any)
    : {};

const shouldRun =
  env.RUN_DB_HEALTH_TESTS === "1" &&
  Boolean(env.EXPO_PUBLIC_SUPABASE_URL) &&
  Boolean(env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const describeIf = shouldRun ? describe : describe.skip;

describeIf("db health (remote supabase)", () => {
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  it("can query users and events and events has beer_price", async () => {
    const usersRes = await supabase
      .from("users")
      .select("id", { head: true, count: "exact" });
    expect(usersRes.error).toBeNull();

    const eventsRes = await supabase
      .from("events")
      .select("id", { head: true, count: "exact" });
    expect(eventsRes.error).toBeNull();

    // This fails with PGRST204 if the migration (014_add_beer_price_to_events.sql) was not applied.
    const beerPriceRes = await supabase
      .from("events")
      .select("id, beer_price", { head: true, count: "exact" });
    expect(beerPriceRes.error).toBeNull();
  }, 30_000);
});
