import { getBeerCountByUser } from "@/services/supabase";
import { supabase } from "@/services/supabase";

describe("getBeerCountByUser", () => {
  const mockFrom = jest.spyOn(supabase, "from");

  afterEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReset();
  });

  test("maps counts correctly when beers are present", async () => {
    const users = [
      { id: "u1", name: "Alice", is_admin: false },
      { id: "u2", name: "Bob", is_admin: true },
    ];
    const beers = [{ user_id: "u1" }, { user_id: "u1" }, { user_id: "u2" }];

    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: users, error: null }),
      } as any)
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: beers, error: null }),
      } as any);

    const result = await getBeerCountByUser();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      userId: "u1",
      name: "Alice",
      count: 2,
      isAdmin: false,
    });
    expect(result[1]).toEqual({
      userId: "u2",
      name: "Bob",
      count: 1,
      isAdmin: true,
    });
  });

  test("returns empty array when users query is empty", async () => {
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ data: null, error: null }),
    } as any);
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    } as any);
    const result = await getBeerCountByUser();
    expect(result).toEqual([]);
  });

  test("applies event filter when event id is provided", async () => {
    const users = [{ id: "u1", name: "Alice", is_admin: false }];
    const eq = jest
      .fn()
      .mockResolvedValue({ data: [{ user_id: "u1" }], error: null });

    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: users, error: null }),
      } as any)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({ eq }),
      } as any);

    const result = await getBeerCountByUser("event-1");
    expect(eq).toHaveBeenCalledWith("event_id", "event-1");
    expect(result[0]?.count).toBe(1);
  });
});
