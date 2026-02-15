import { supabase } from "@/services/supabase";
import { resetEventData } from "@/services/events/reset";

describe("resetEventData", () => {
  const mockFrom = jest.spyOn(supabase, "from");

  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReset();
  });

  test("skips missing tables and uses correct delete filters", async () => {
    const columns: Record<string, string> = {};

    mockFrom.mockImplementation(
      (table: string) =>
        ({
          delete: () => ({
            not: jest.fn().mockImplementation((column: string) => {
              columns[table] = column;
              if (table === "beers") {
                return Promise.resolve({ error: { code: "PGRST205" } });
              }
              return Promise.resolve({ error: null });
            }),
          }),
        }) as any,
    );

    const results = await resetEventData();

    const beerResult = results.find((r) => r.table === "beers");
    const gameStatsResult = results.find((r) => r.table === "event_game_stats");
    const leaderStateResult = results.find(
      (r) => r.table === "event_leader_state",
    );
    const membershipResult = results.find(
      (r) => r.table === "event_memberships",
    );
    const eventsResult = results.find((r) => r.table === "events");

    expect(beerResult?.skipped).toBe(true);
    expect(beerResult?.ok).toBe(true);
    expect(columns.event_game_stats).toBe("event_id");
    expect(columns.event_leader_state).toBe("event_id");
    expect(columns.event_memberships).toBe("id");
    expect(columns.events).toBe("id");
    expect(gameStatsResult?.ok).toBe(true);
    expect(leaderStateResult?.ok).toBe(true);
    expect(membershipResult?.ok).toBe(true);
    expect(eventsResult?.ok).toBe(true);
  });
});
