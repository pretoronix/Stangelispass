import {
  buildCountsFromStats,
  computeHotStreak,
  computeLeaderLead,
  computeTotalBeers,
  resolveLeaderInfo,
} from "@/utils/home/homeEventData";

describe("homeEventData", () => {
  it("buildCountsFromStats prefers members list and fills missing stats", () => {
    const members = [
      { user: { id: "u1", name: "Alice", is_admin: false } },
      { user: { id: "u2", name: "Bob", is_admin: true } },
    ];
    const stats = [
      {
        user_id: "u1",
        beer_count: 2,
        points: 10,
        streak_count: 1,
        longest_streak: 2,
        lead_changes: 0,
        user: { id: "u1", name: "Alice", is_admin: false },
      },
    ];

    const counts = buildCountsFromStats(members as any, stats as any);
    const alice = counts.find((c) => c.userId === "u1");
    const bob = counts.find((c) => c.userId === "u2");

    expect(alice).toMatchObject({ name: "Alice", count: 2, points: 10 });
    expect(bob).toMatchObject({ name: "Bob", count: 0, points: 0 });
  });

  it("buildCountsFromStats falls back to stats list when members is empty", () => {
    const stats = [
      {
        user_id: "u1",
        beer_count: 1,
        points: 5,
        streak_count: 0,
        longest_streak: 0,
        lead_changes: 0,
        user: { id: "u1", name: "Alice", is_admin: false },
      },
      {
        user_id: "u2",
        beer_count: 3,
        points: 12,
        streak_count: 2,
        longest_streak: 2,
        lead_changes: 1,
        user: null,
      },
    ];

    const counts = buildCountsFromStats([], stats as any);
    expect(counts.map((c) => c.userId)).toEqual(["u2", "u1"]);
    expect(counts.find((c) => c.userId === "u2")?.name).toBe("Unknown");
  });

  it("buildCountsFromStats sorts by points desc, then count desc", () => {
    const stats = [
      {
        user_id: "u1",
        beer_count: 5,
        points: 10,
        streak_count: 0,
        longest_streak: 0,
        lead_changes: 0,
        user: { id: "u1", name: "A", is_admin: false },
      },
      {
        user_id: "u2",
        beer_count: 7,
        points: 10,
        streak_count: 0,
        longest_streak: 0,
        lead_changes: 0,
        user: { id: "u2", name: "B", is_admin: false },
      },
      {
        user_id: "u3",
        beer_count: 1,
        points: 20,
        streak_count: 0,
        longest_streak: 0,
        lead_changes: 0,
        user: { id: "u3", name: "C", is_admin: false },
      },
    ];

    const counts = buildCountsFromStats([], stats as any);
    expect(counts.map((c) => c.userId)).toEqual(["u3", "u2", "u1"]);
  });

  it("computeTotalBeers sums counts", () => {
    expect(
      computeTotalBeers([
        { userId: "u1", name: "A", count: 2, isAdmin: false },
        { userId: "u2", name: "B", count: 3, isAdmin: false },
      ]),
    ).toBe(5);
  });

  it("resolveLeaderInfo returns requested leader or falls back", () => {
    const counts = [
      { userId: "u1", name: "A", count: 2, isAdmin: false, points: 5 },
      { userId: "u2", name: "B", count: 3, isAdmin: false, points: 10 },
    ];

    expect(resolveLeaderInfo(counts, "u2")?.userId).toBe("u2");
    expect(resolveLeaderInfo(counts, "missing")?.userId).toBe("u1");
    expect(resolveLeaderInfo([], "u2")).toBeNull();
  });

  it("computeLeaderLead computes lead over runner-up and clamps at 0", () => {
    const leader = {
      userId: "u1",
      name: "A",
      count: 1,
      isAdmin: false,
      points: 10,
    };
    expect(computeLeaderLead([leader], leader)).toBe(10);

    const runnerUp = {
      userId: "u2",
      name: "B",
      count: 1,
      isAdmin: false,
      points: 7,
    };
    expect(computeLeaderLead([leader, runnerUp], leader)).toBe(3);
    expect(computeLeaderLead([runnerUp, leader], runnerUp)).toBe(0);
  });

  it("computeHotStreak returns best streak or null", () => {
    expect(
      computeHotStreak([
        { userId: "u1", name: "A", count: 1, isAdmin: false, streakCount: 0 },
      ] as any),
    ).toBeNull();

    const hot = computeHotStreak([
      { userId: "u1", name: "A", count: 1, isAdmin: false, streakCount: 2 },
      { userId: "u2", name: "B", count: 1, isAdmin: false, streakCount: 3 },
    ] as any);
    expect(hot?.userId).toBe("u2");
  });
});
