import { getStreakBonus, isStreakMilestone } from "@/utils/gameStats";

describe("gameStats helpers", () => {
  test("getStreakBonus returns expected bonuses", () => {
    expect(getStreakBonus(1)).toBe(0);
    expect(getStreakBonus(2)).toBe(0);
    expect(getStreakBonus(3)).toBe(1);
    expect(getStreakBonus(4)).toBe(0);
    expect(getStreakBonus(5)).toBe(2);
    expect(getStreakBonus(6)).toBe(0);
    expect(getStreakBonus(7)).toBe(3);
    expect(getStreakBonus(8)).toBe(0);
  });

  test("isStreakMilestone matches bonus thresholds", () => {
    expect(isStreakMilestone(3)).toBe(true);
    expect(isStreakMilestone(5)).toBe(true);
    expect(isStreakMilestone(7)).toBe(true);
    expect(isStreakMilestone(2)).toBe(false);
    expect(isStreakMilestone(4)).toBe(false);
  });
});
