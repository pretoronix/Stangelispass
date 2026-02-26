import { getBeerCountByEventMembers } from "@/services/beers/beerQueries";
import { getEventMembers } from "@/services/events/memberships";
import { supabase } from "@/services/client";

jest.mock("@/services/events/memberships", () => ({
  getEventMembers: jest.fn(),
}));

jest.mock("@/services/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("services/beers/beerQueries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getBeerCountByEventMembers counts only active members", async () => {
    (getEventMembers as jest.Mock).mockResolvedValueOnce([
      { user: { id: "u1", name: "Alice", is_admin: false } },
      { user: { id: "u2", name: "Bob", is_admin: true } },
    ]);

    const chain: any = {};
    chain.select = jest.fn(() => chain);
    chain.eq = jest.fn(() => chain);
    chain.in = jest.fn(async () => ({
      data: [{ user_id: "u1" }, { user_id: "u1" }],
      error: null,
    }));

    (supabase.from as jest.Mock).mockReturnValueOnce(chain);

    const result = await getBeerCountByEventMembers("e1");

    expect(result).toEqual([
      { userId: "u1", name: "Alice", count: 2, isAdmin: false },
      { userId: "u2", name: "Bob", count: 0, isAdmin: true },
    ]);
  });

  test("getBeerCountByEventMembers falls back to event beers when no members", async () => {
    (getEventMembers as jest.Mock).mockResolvedValueOnce([]);

    const chain: any = {};
    chain.select = jest.fn(() => chain);
    chain.eq = jest.fn(async () => ({
      data: [
        { user_id: "u1", user: { id: "u1", name: "Alice", is_admin: false } },
        { user_id: "u1", user: { id: "u1", name: "Alice", is_admin: false } },
        { user_id: "u2", user: { id: "u2", name: "Bob", is_admin: true } },
      ],
      error: null,
    }));

    (supabase.from as jest.Mock).mockReturnValueOnce(chain);

    const result = await getBeerCountByEventMembers("e1");

    expect(result).toEqual([
      { userId: "u1", name: "Alice", count: 2, isAdmin: false },
      { userId: "u2", name: "Bob", count: 1, isAdmin: true },
    ]);
  });
});
