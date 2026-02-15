type BeerRow = { user_id?: string; created_at: string };

const setup = async (opts: {
  statsMissingTable: boolean;
  stats?: any[];
  counts?: { userId: string; name: string; count: number }[];
  beersByUser?: { data: BeerRow[]; error: any };
  leaderLastBeer?: { data: { created_at: string }[]; error: any };
  insertError?: any;
  insertData?: any;
}) => {
  jest.resetModules();

  const insertPayloads: any[] = [];

  const supabase = {
    from: jest.fn((table: string) => {
      if (table === "beers") {
        return {
          select: jest.fn((cols: string) => {
            if (cols === "created_at") {
              return {
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn(
                  async () => opts.leaderLastBeer ?? { data: [], error: null },
                ),
              };
            }
            // buildLastBeerByUser
            return {
              eq: jest.fn(
                async () => opts.beersByUser ?? { data: [], error: null },
              ),
            };
          }),
        };
      }

      if (table === "event_leader_snapshots") {
        return {
          insert: jest.fn((payload: any) => {
            insertPayloads.push(payload);
            return {
              select: jest.fn(() => ({
                single: jest.fn(async () => ({
                  data: opts.insertData ?? null,
                  error: opts.insertError ?? null,
                })),
              })),
            };
          }),
        };
      }

      return {};
    }),
  };

  jest.doMock("../../client", () => ({ supabase }));
  jest.doMock("../../helpers", () => ({
    isMissingTableError: (e: any) =>
      e?.code === "PGRST205" || e?.code === "42P01",
  }));
  jest.doMock("../stats", () => ({
    getEventGameStats: jest.fn(async () => ({
      missingTable: opts.statsMissingTable,
      stats: opts.stats ?? [],
    })),
  }));
  jest.doMock("../../beers/beerQueries", () => ({
    getBeerCountByUser: jest.fn(async () => opts.counts ?? []),
  }));

  const mod = require("../leaderSnapshots");
  const logger = require("@/utils/logger");
  return { mod, supabase, logger, insertPayloads };
};

describe("createLeaderEventSnapshot", () => {
  it("returns null when leaderboard is empty", async () => {
    const { mod } = await setup({ statsMissingTable: false, stats: [] });
    await expect(mod.createLeaderEventSnapshot("evt1")).resolves.toBeNull();
  });

  it("uses event_game_stats leaderboard when available", async () => {
    const { mod, insertPayloads } = await setup({
      statsMissingTable: false,
      stats: [
        {
          user_id: "u1",
          beer_count: 10,
          points: 12,
          last_beer_at: "2020-01-01T01:00:00.000Z",
          user: { name: "Alice" },
        },
      ],
      insertData: { id: "snap_1" },
    });

    await expect(mod.createLeaderEventSnapshot("evt1")).resolves.toEqual({
      id: "snap_1",
    });
    expect(insertPayloads).toHaveLength(1);
    expect(insertPayloads[0]).toMatchObject({
      event_id: "evt1",
      leader_id: "u1",
      leader_beer_count: 10,
      leader_points: 12,
      leader_last_beer_at: "2020-01-01T01:00:00.000Z",
    });
  });

  it("fetches leader last beer time when missing from stats", async () => {
    const { mod, insertPayloads } = await setup({
      statsMissingTable: false,
      stats: [
        {
          user_id: "u1",
          beer_count: 10,
          points: 12,
          last_beer_at: null,
          user: { name: "Alice" },
        },
      ],
      leaderLastBeer: {
        data: [{ created_at: "2020-01-01T01:23:00.000Z" }],
        error: null,
      },
      insertData: { id: "snap_2" },
    });

    await expect(mod.createLeaderEventSnapshot("evt1")).resolves.toEqual({
      id: "snap_2",
    });
    expect(insertPayloads[0].leader_last_beer_at).toBe(
      "2020-01-01T01:23:00.000Z",
    );
  });

  it("tolerates missing beers table when fetching leader last beer time", async () => {
    const { mod, insertPayloads } = await setup({
      statsMissingTable: false,
      stats: [
        {
          user_id: "u1",
          beer_count: 10,
          points: 12,
          last_beer_at: null,
          user: { name: "Alice" },
        },
      ],
      leaderLastBeer: {
        data: [],
        error: { code: "42P01", message: "missing table" },
      },
      insertData: { id: "snap_3" },
    });

    await expect(mod.createLeaderEventSnapshot("evt1")).resolves.toEqual({
      id: "snap_3",
    });
    expect(insertPayloads[0].leader_last_beer_at).toBeNull();
  });

  it("builds leaderboard from beers when event_game_stats is missing", async () => {
    const { mod, insertPayloads } = await setup({
      statsMissingTable: true,
      counts: [
        { userId: "u1", name: "Alice", count: 2 },
        { userId: "u2", name: "Bob", count: 1 },
      ],
      beersByUser: {
        data: [
          { user_id: "u1", created_at: "2020-01-01T01:00:00.000Z" },
          { user_id: "u2", created_at: "2020-01-01T00:30:00.000Z" },
        ],
        error: null,
      },
      insertData: { id: "snap_4" },
    });

    await expect(mod.createLeaderEventSnapshot("evt1")).resolves.toEqual({
      id: "snap_4",
    });
    expect(insertPayloads[0]).toMatchObject({
      leader_id: "u1",
      leader_beer_count: 2,
    });
  });

  it("returns null and logs expected when event_leader_snapshots table is missing", async () => {
    const { mod, logger } = await setup({
      statsMissingTable: false,
      stats: [
        {
          user_id: "u1",
          beer_count: 10,
          points: 12,
          last_beer_at: "2020-01-01T01:00:00.000Z",
          user: { name: "Alice" },
        },
      ],
      insertError: { code: "42P01", message: "missing table" },
    });

    await expect(mod.createLeaderEventSnapshot("evt1")).resolves.toBeNull();
    expect(logger.logExpected).toHaveBeenCalled();
  });

  it("throws on unexpected beers query error", async () => {
    const { mod } = await setup({
      statsMissingTable: true,
      counts: [{ userId: "u1", name: "Alice", count: 1 }],
      beersByUser: { data: [], error: { code: "500", message: "boom" } },
    });

    await expect(mod.createLeaderEventSnapshot("evt1")).rejects.toBeTruthy();
  });
});
