const mockReportError = jest.fn();
const mockGetPassExpiresAt = jest.fn(() => "2099-01-01T00:00:00.000Z");

const mockCreateLeaderEventSnapshot = jest.fn(async () => null);
const mockIsMissingTableError = jest.fn((e: any) => e?.code === "42P01");

const mockEventsSelect = jest.fn();
const mockEventsInsert = jest.fn();
const mockEventsUpdate = jest.fn();
const mockEventsEq = jest.fn();
let mockEventsUpdateError: Error | null = null;

const mockUsersSelect = jest.fn();
const mockUsersFilter = jest.fn();

const mockWallInsert = jest.fn();

jest.mock("@/utils/logger", () => ({
  reportError: (...args: any[]) => mockReportError(...args),
}));

jest.mock("@/providers/appProviderUtils", () => ({
  getPassExpiresAt: (...args: any[]) => mockGetPassExpiresAt(...args),
}));

jest.mock("@/services/supabase", () => {
  const supabase = {
    from: jest.fn((table: string) => {
      if (table === "events") {
        const builder: any = {
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
            return {
              eq: (...eqArgs: any[]) => {
                mockEventsEq(...eqArgs);
                return { error: mockEventsUpdateError };
              },
            };
          },
          eq: (...eqArgs: any[]) => (mockEventsEq(...eqArgs), { error: null }),
        };
        return builder;
      }

      if (table === "users") {
        const builder: any = {
          select: (...args: any[]) => (mockUsersSelect(...args), builder),
          filter: (...args: any[]) => (
            mockUsersFilter(...args),
            Promise.resolve({
              data: [
                { id: "u1", beers: [{ count: 1 }] },
                { id: "u2", beers: [{ count: 3 }] },
              ],
              error: null,
            })
          ),
        };
        return builder;
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

  return {
    supabase,
    isMissingTableError: (...args: any[]) => mockIsMissingTableError(...args),
    createLeaderEventSnapshot: (...args: any[]) =>
      mockCreateLeaderEventSnapshot(...args),
  };
});

describe("appProviderActions", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockEventsUpdateError = null;
  });

  it("startEventInSupabase resolves pass_type to free if events table is empty", async () => {
    const { startEventInSupabase } = require("@/providers/appProviderActions");

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
    const { supabase } = require("@/services/supabase");
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: async () => ({ count: null, error: { code: "42P01" } }),
    }));

    const { startEventInSupabase } = require("@/providers/appProviderActions");

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

    const { closeEventInSupabase } = require("@/providers/appProviderActions");
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

  it("closeEventInSupabase throws when event update fails", async () => {
    mockEventsUpdateError = new Error("update failed");
    const { closeEventInSupabase } = require("@/providers/appProviderActions");
    await expect(closeEventInSupabase({ id: "e1" })).rejects.toThrow(
      "update failed",
    );
  });
});
