import { checkAchievements } from "@/services/achievements";
import type { Beer } from "@/services/supabase";

describe("checkAchievements", () => {
  const makeBeer = (user_id: string, ts: string): Beer =>
    ({
      id: "b",
      user_id,
      added_by: user_id,
      created_at: ts,
    }) as unknown as Beer;

  test("hat_trick when 3 beers within 1 hour", () => {
    const user = "u1";
    const now = new Date();
    const t1 = new Date(now.getTime() - 20 * 60 * 1000).toISOString();
    const t2 = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const t3 = now.toISOString();

    const currentBeers = [makeBeer(user, t1), makeBeer(user, t2)];
    const newBeer = makeBeer(user, t3);
    const total = 3;

    const badges = checkAchievements(currentBeers, newBeer, total);
    expect(badges).toContain("hat_trick");
  });

  test("early_bird when before 18:00", () => {
    const user = "u2";
    const ts = new Date();
    ts.setHours(10);
    const newBeer = makeBeer(user, ts.toISOString());
    const badges = checkAchievements([], newBeer, 1);
    expect(badges).toContain("early_bird");
  });

  test("night_owl when between 02:00 and 05:59", () => {
    const user = "u3";
    const ts = new Date();
    ts.setHours(3);
    const newBeer = makeBeer(user, ts.toISOString());
    const badges = checkAchievements([], newBeer, 1);
    expect(badges).toContain("night_owl");
  });

  test("weekend_warrior on Friday or Saturday", () => {
    const user = "u4";
    // Find next Friday
    const ts = new Date();
    const day = ts.getDay();
    const daysUntilFriday = (5 - day + 7) % 7;
    ts.setDate(ts.getDate() + daysUntilFriday);
    ts.setHours(12);
    const newBeer = makeBeer(user, ts.toISOString());
    const badges = checkAchievements([], newBeer, 1);
    expect(badges).toContain("weekend_warrior");
  });

  test("century_club when lifetime reaches 100", () => {
    const user = "u5";
    const ts = new Date().toISOString();
    const newBeer = makeBeer(user, ts);
    const badges = checkAchievements([], newBeer, 100);
    expect(badges).toContain("century_club");
  });

  test("first_blood when currentBeers empty", () => {
    const user = "u6";
    const ts = new Date().toISOString();
    const newBeer = makeBeer(user, ts);
    const badges = checkAchievements([], newBeer, 1);
    expect(badges).toContain("first_blood");
  });
});
