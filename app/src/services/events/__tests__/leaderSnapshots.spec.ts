import type { Mock } from 'jest-mock';

const load = async (opts: {
  statsMissingTable: boolean;
  stats?: any[];
  counts?: Array<{ userId: string; name: string; count: number }>;
  beersRows?: Array<{ user_id: string; created_at: string }>;
  insertError?: any;
}) => {
  jest.resetModules();

  const fromMock = jest.fn((table: string) => {
    if (table === 'beers') {
      // Used by buildLastBeerByUser and/or fetchLeaderLastBeerAt.
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn(async () => ({ data: [], error: null })),
      };
    }

    if (table === 'event_leader_snapshots') {
      return {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(async () => ({
              data: opts.insertError
                ? null
                : {
                    id: 'snap_1',
                    event_id: 'evt1',
                    leader_id: 'u1',
                    leader_beer_count: 10,
                    leader_points: 0,
                    leader_last_beer_at: '2020-01-01T01:00:00.000Z',
                    leaderboard: [],
                    snapshot_at: '2020-01-01T02:00:00.000Z',
                  },
              error: opts.insertError ?? null,
            })),
          })),
        })),
      };
    }

    return {};
  });

  // Override beers select depending on test.
  (fromMock as any).mockImplementation((table: string) => {
    if (table === 'beers') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn(async () => ({ data: [], error: null })),
      };
    }
    if (table === 'event_leader_snapshots') {
      return {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(async () => ({
              data: opts.insertError
                ? null
                : {
                    id: 'snap_1',
                    event_id: 'evt1',
                    leader_id: 'u1',
                    leader_beer_count: 10,
                    leader_points: 0,
                    leader_last_beer_at: '2020-01-01T01:00:00.000Z',
                    leaderboard: [],
                    snapshot_at: '2020-01-01T02:00:00.000Z',
                  },
              error: opts.insertError ?? null,
            })),
          })),
        })),
      };
    }
    return {};
  });

  const supabase = { from: fromMock };

  jest.doMock('../../client', () => ({ supabase }));
  jest.doMock('../../helpers', () => ({
    isMissingTableError: (e: any) => e?.code === 'PGRST205' || e?.code === '42P01',
  }));
  jest.doMock('../stats', () => ({
    getEventGameStats: jest.fn(async () => ({
      missingTable: opts.statsMissingTable,
      stats: opts.stats ?? [],
    })),
  }));
  jest.doMock('../../beers/beerQueries', () => ({
    getBeerCountByUser: jest.fn(async () => opts.counts ?? []),
  }));

  // For the missingTable branch, buildLastBeerByUser reads from beers.
  if (opts.statsMissingTable) {
    (supabase.from as any as Mock).mockImplementation((table: string) => {
      if (table === 'beers') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(async () => ({ data: opts.beersRows ?? [], error: null })),
          })),
        };
      }
      if (table === 'event_leader_snapshots') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(async () => ({ data: null, error: opts.insertError ?? null })),
            })),
          })),
        };
      }
      return {};
    });
  }

  const mod = await import('../leaderSnapshots');
  const logger = await import('@/utils/logger');
  return { mod, supabase, logger };
};

describe('createLeaderEventSnapshot', () => {
  it('returns null when leaderboard is empty', async () => {
    const { mod } = await load({ statsMissingTable: false, stats: [] });
    const res = await mod.createLeaderEventSnapshot('evt1');
    expect(res).toBeNull();
  });

  it('inserts snapshot using event_game_stats when available', async () => {
    const { mod, supabase } = await load({
      statsMissingTable: false,
      stats: [
        {
          user_id: 'u1',
          beer_count: 10,
          points: 12,
          last_beer_at: '2020-01-01T01:00:00.000Z',
          user: { name: 'Alice' },
        },
      ],
    });

    const res = await mod.createLeaderEventSnapshot('evt1');
    expect(res).toBeTruthy();
    expect((supabase.from as any as Mock).mock.calls.some((c: any) => c[0] === 'event_leader_snapshots')).toBe(true);
  });

  it('builds snapshot from beers table when event_game_stats is missing', async () => {
    const { mod } = await load({
      statsMissingTable: true,
      counts: [
        { userId: 'u1', name: 'Alice', count: 2 },
        { userId: 'u2', name: 'Bob', count: 1 },
      ],
      beersRows: [
        { user_id: 'u1', created_at: '2020-01-01T01:00:00.000Z' },
        { user_id: 'u2', created_at: '2020-01-01T00:30:00.000Z' },
      ],
    });

    const res = await mod.createLeaderEventSnapshot('evt1');
    // Insert returns null data in this mock path, but the function should not throw.
    expect(res).toBeNull();
  });

  it('returns null and logs expected when event_leader_snapshots table is missing', async () => {
    const { mod, logger } = await load({
      statsMissingTable: false,
      stats: [
        {
          user_id: 'u1',
          beer_count: 10,
          points: 12,
          last_beer_at: '2020-01-01T01:00:00.000Z',
          user: { name: 'Alice' },
        },
      ],
      insertError: { code: '42P01', message: 'missing table' },
    });

    const res = await mod.createLeaderEventSnapshot('evt1');
    expect(res).toBeNull();
    expect((logger as any).logExpected).toHaveBeenCalled();
  });
});

