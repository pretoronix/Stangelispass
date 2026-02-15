import { addBeer } from "@/services/beers/addBeer";
import { supabase } from "@/services/client";
import { checkAchievements } from "@/services/achievements";

jest.mock("@/services/client");
jest.mock("@/services/achievements");

describe("addBeer - Crash Prevention Tests", () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;
  const mockCheckAchievements = checkAchievements as jest.MockedFunction<
    typeof checkAchievements
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckAchievements.mockReturnValue([]);
  });

  describe("Critical Crash Scenarios", () => {
    it("should not crash when insert returns null data", async () => {
      // CRASH POINT: newBeer is null after insert
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null, // ❌ This causes crash
              error: null,
            }),
          }),
        }),
      }) as any;

      // Should not crash, should handle gracefully
      await expect(
        addBeer("user-123", "admin-456", "event-789"),
      ).rejects.toThrow(); // Should throw controlled error, not crash
    });

    it("should not crash when newBeer.created_at is undefined", async () => {
      // CRASH POINT: Accessing newBeer.created_at when it's undefined
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: "beer-123",
                user_id: "user-123",
                // created_at is missing ❌
              },
              error: null,
            }),
          }),
        }),
      }) as any;

      mockSupabase.from = jest.fn((table: string) => {
        if (table === "beers") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "beer-123", user_id: "user-123" },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "achievements") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {} as any;
      }) as any;

      // Should not crash
      const result = await addBeer("user-123", "admin-456", "event-789");
      expect(result).toBeDefined();
    });

    it("should throw clear error when eventId is missing", async () => {
      await expect(addBeer("user-123", "admin-456", "")).rejects.toThrow(
        "eventId is required to log a beer",
      );
    });

    it("should not crash when fetchRecentBeers returns null", async () => {
      mockSupabase.from = jest.fn((table: string) => {
        if (table === "beers") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: "beer-123",
                    user_id: "user-123",
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: null, // ❌ Null data
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "achievements") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {} as any;
      }) as any;

      // Should not crash, should handle null gracefully
      const result = await addBeer("user-123", "admin-456", "event-789");
      expect(result.beer).toBeDefined();
      expect(result.newBadges).toEqual([]);
    });

    it("should not crash when lifetime count query returns null", async () => {
      mockSupabase.from = jest.fn((table: string) => {
        if (table === "beers") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: "beer-123",
                    user_id: "user-123",
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            select: jest
              .fn()
              .mockImplementation((_cols: string, opts?: any) => {
                // Count query (head: true) used by fetchLifetimeCount
                if (opts && opts.head) {
                  return {
                    eq: jest.fn().mockResolvedValue({
                      data: [],
                      count: null, // ❌ Null count
                      error: null,
                    }),
                  };
                }

                // Recent beers query used by fetchRecentBeers
                return {
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      limit: jest.fn().mockResolvedValue({
                        data: [],
                        error: null,
                      }),
                    }),
                  }),
                };
              }),
          };
        }
        if (table === "achievements") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {} as any;
      }) as any;

      // Should not crash
      const result = await addBeer("user-123", "admin-456", "event-789");
      expect(result).toBeDefined();
    });

    it("should not crash when achievements table is missing", async () => {
      mockSupabase.from = jest.fn((table: string) => {
        if (table === "beers") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: "beer-123",
                    user_id: "user-123",
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "achievements") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST204", message: "table not found" },
              }),
            }),
            insert: jest.fn().mockRejectedValue({
              code: "PGRST205",
              message: "table not found",
            }),
          };
        }
        return {} as any;
      }) as any;

      mockCheckAchievements.mockReturnValue(["first_blood"]);

      // Should not crash, should handle missing table gracefully
      const result = await addBeer("user-123", "admin-456", "event-789");
      expect(result.beer).toBeDefined();
      // Should still return newBadges even if can't save them
      expect(result.newBadges).toEqual(["first_blood"]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty userId", async () => {
      await expect(addBeer("", "admin-456", "event-789")).rejects.toThrow(
        "userId is required to log a beer",
      );
    });

    it("should handle empty addedBy", async () => {
      mockSupabase.from = jest.fn((table: string) => {
        if (table === "beers") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: "beer-123",
                    user_id: "user-123",
                    added_by: "",
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "achievements") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {} as any;
      }) as any;

      await expect(addBeer("user-123", "", "event-789")).rejects.toThrow(
        "addedBy is required to log a beer",
      );
    });
  });
});
