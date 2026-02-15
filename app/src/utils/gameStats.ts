export const getStreakBonus = (streakCount: number) => {
  if (streakCount === 3) return 1;
  if (streakCount === 5) return 2;
  if (streakCount === 7) return 3;
  return 0;
};

export const isStreakMilestone = (streakCount: number) => {
  return getStreakBonus(streakCount) > 0;
};
