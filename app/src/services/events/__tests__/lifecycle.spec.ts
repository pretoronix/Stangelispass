const mockReportError = jest.fn();
const mockGetPassExpiresAt = jest.fn((...args: any[]) => "2099-01-01T00:00:00.000Z");

const mockCreateLeaderEventSnapshot = jest.fn(async (...args: any[]) => null);
const mockIsMissingTableError = jest.fn((...args: any[]) => {
  const e = args[0];
  return e?.code === "42P01";
});

const mockEventsSelect = jest.fn();
const mockEventsInsert = jest.fn();
const mockEventsUpdate = jest.fn();

const mockWallInsert = jest.fn();

jest.mock("@/utils/logger", () => ({
  reportError: (...args: any[]) => mockReportError(...args),
}));

jest.mock("@/providers/appProviderUtils", () => ({
  getPassExpiresAt: (...args: any[]) => mockGetPassExpiresAt(...args),
}));

jest.mock("../../client", () => {
  const supabase = {
    from: jest.fn((table: string) => {
      if (table === "events") {
        return {
          select: (...args: any[]) => {
            mockEventsSelect(...args);
            return Promise.resolve({ count: 0, error: null });
          },
          insert: (...args: any[]) => {
            mockEventsInsert(...args);
            return {
              select: () => ({
                single: async () => ({
                  data: { id: "e1", name: "Round", pass_type: "free" },
                  error: null,
                }),
              }),
            };
          },
          update: (...args: any[]) => {
            mockEventsUpdate(...args);
            return { eq: async () => ({ error: null }) };
          },
        };
      }

      if (table === "users") {
        return {
          select: () => ({
            filter: async () => ({
              data: [
                { id: "u1", beers: [{ count: 1 }] },
                { id: "u2", beers: [{ count: 3 }] },
              ],
              error: null,
            }),
          }),
          filter: async () => ({
            data: [
              { id: "u1", beers: [{ count: 1 }] },
              { id: "u2", beers: [{ count: 3 }] },
            ],
            error: null,
          }),
        };
      }

      if (table === "wall_of_fame") {
        return {
          insert: (...args: any[]) => (
            mockWallInsert(...args),
            Promise.resolve({ error: null })
          ),
        };
      }

      return {};
    }),
  };
  return { supabase };
});

jest.mock("../../helpers", () => ({
  isMissingTableError: (...args: any[]) => mockIsMissingTableError(...args),
}));

jest.mock("../leaderSnapshots", () => ({
  createLeaderEventSnapshot: (...args: any[]) =>
    mockCreateLeaderEventSnapshot(...args),
}));

describe("services/events/lifecycle", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("startEventInSupabase resolves pass_type to free if events table is empty", async () => {
    const { startEventInSupabase } = require("../lifecycle");

    await startEventInSupabase({
      name: "Round",
      userId: "u1",
      passType: "day",
      beerPrice: 7,
    });

    expect(mockEventsSelect).toHaveBeenCalled();
    expect(mockEventsInsert).toHaveBeenCalled();
    expect(mockGetPassExpiresAt).toHaveBeenCalledWith("free");
    const insertArg = (mockEventsInsert as jest.Mock).mock.calls[0]?.[0];
    expect(insertArg.pass_type).toBe("free");
    expect(insertArg.beer_price).toBe(7);
  });

  it("startEventInSupabase tolerates missing events table during pass_type resolve", async () => {
    const { supabase } = require("../../client");
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: async () => ({ count: null, error: { code: "42P01" } }),
    }));

    const { startEventInSupabase } = require("../lifecycle");

    await startEventInSupabase({
      name: "Round",
      userId: "u1",
      passType: "weekend",
    });

    expect(mockIsMissingTableError).toHaveBeenCalled();
    expect(mockReportError).not.toHaveBeenCalled();
    expect(mockEventsInsert).toHaveBeenCalled();
  });

  it("closeEventInSupabase inserts wall_of_fame, tolerates snapshot errors, and updates event", async () => {
    mockCreateLeaderEventSnapshot.mockRejectedValueOnce(new Error("snap"));

    const { closeEventInSupabase } = require("../lifecycle");
    await closeEventInSupabase({ id: "e1" });

    expect(mockWallInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: "e1",
        winner_id: "u2",
        total_stängeli: 3,
      }),
    );
    expect(mockReportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ action: "leader_snapshot" }),
    );
    expect(mockEventsUpdate).toHaveBeenCalled();
  });
});
