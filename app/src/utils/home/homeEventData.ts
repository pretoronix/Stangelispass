type UserBeerCount = {
  userId: string;
  name: string;
  count: number;
  isAdmin: boolean;
  points?: number;
  streakCount?: number;
  longestStreak?: number;
  leadChanges?: number;
};

type EventMemberUser = {
  id: string;
  name: string;
  is_admin: boolean;
};

type EventMember = {
  user?: EventMemberUser | null;
};

type GameStat = {
  user_id: string;
  beer_count: number;
  points: number;
  streak_count: number;
  longest_streak: number;
  lead_changes: number;
  user?: { id: string; name: string; is_admin: boolean } | null;
};

export const buildCountsFromStats = (
  members: EventMember[],
  stats: GameStat[],
): UserBeerCount[] => {
  const statsByUser = new Map(stats.map((stat) => [stat.user_id, stat]));
  const memberUsers = members
    .map((member) => member.user)
    .filter((user): user is EventMemberUser => !!user?.id);

  const base =
    memberUsers.length > 0
      ? memberUsers.map((user): UserBeerCount => {
          const stat = statsByUser.get(user.id);
          return {
            userId: user.id,
            name: user.name,
            count: stat?.beer_count ?? 0,
            isAdmin: !!user.is_admin,
            points: stat?.points ?? 0,
            streakCount: stat?.streak_count ?? 0,
            longestStreak: stat?.longest_streak ?? 0,
            leadChanges: stat?.lead_changes ?? 0,
          };
        })
      : stats.map(
          (stat): UserBeerCount => ({
            userId: stat.user_id,
            name: stat.user?.name || "Unknown",
            count: stat.beer_count ?? 0,
            isAdmin: !!stat.user?.is_admin,
            points: stat.points ?? 0,
            streakCount: stat.streak_count ?? 0,
            longestStreak: stat.longest_streak ?? 0,
            leadChanges: stat.lead_changes ?? 0,
          }),
        );

  return base.sort((a, b) => {
    const pointsDiff = (b.points || 0) - (a.points || 0);
    if (pointsDiff !== 0) return pointsDiff;
    return b.count - a.count;
  });
};

export const computeTotalBeers = (counts: UserBeerCount[]) =>
  counts.reduce((sum, u) => sum + u.count, 0);

export const resolveLeaderInfo = (
  counts: UserBeerCount[],
  leaderUserId?: string | null,
) => {
  const fallback = counts[0] || null;
  if (!leaderUserId) return fallback;
  return counts.find((u) => u.userId === leaderUserId) || fallback;
};

export const computeLeaderLead = (
  counts: UserBeerCount[],
  leaderInfo: UserBeerCount | null,
) => {
  if (!leaderInfo) return 0;
  if (counts.length <= 1) return leaderInfo.points || 0;
  const runnerUp = counts.find((u) => u.userId !== leaderInfo.userId);
  const lead = runnerUp
    ? (leaderInfo.points || 0) - (runnerUp.points || 0)
    : leaderInfo.points || 0;
  return Math.max(lead, 0);
};

export const computeHotStreak = (counts: UserBeerCount[]) => {
  const hot = counts.reduce((best: UserBeerCount | null, current) => {
    if (!best) return current;
    const bestStreak = best.streakCount || 0;
    const currentStreak = current.streakCount || 0;
    return currentStreak > bestStreak ? current : best;
  }, null);
  return hot && (hot.streakCount || 0) > 0 ? hot : null;
};

export type { UserBeerCount };
