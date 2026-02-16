import { useState, useCallback, useEffect } from "react";
import {
  supabase,
  getBeerCountByUser,
  getEventGameStats,
  getEventLeaderState,
  getUsers,
  User,
} from "@/services/supabase";
import { useApp } from "@/providers/AppProvider";
import { reportError } from "@/utils/logger";

export interface UserBeerCount {
  userId: string;
  name: string;
  count: number;
  isAdmin: boolean;
  points?: number;
  streakCount?: number;
  longestStreak?: number;
  leadChanges?: number;
}

type BeerStatRow = {
  user_id: string;
  beer_count: number;
  points: number;
  streak_count: number;
  longest_streak: number;
  lead_changes: number;
};

const buildMergedStats = (
  users: User[],
  stats: BeerStatRow[],
): UserBeerCount[] => {
  const statsByUser = new Map(stats.map((stat) => [stat.user_id, stat]));

  const merged = users.map((user): UserBeerCount => {
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
  });

  return merged.sort((a, b) => {
    const pointsDiff = (b.points || 0) - (a.points || 0);
    if (pointsDiff !== 0) return pointsDiff;
    return b.count - a.count;
  });
};

const computeTotalBeers = (counts: UserBeerCount[]) =>
  counts.reduce((sum, u) => sum + u.count, 0);

const resolveLeaderInfo = (
  counts: UserBeerCount[],
  leaderUserId?: string | null,
) => {
  const fallback = counts[0] || null;
  if (!leaderUserId) return fallback;
  return counts.find((u) => u.userId === leaderUserId) || fallback;
};

const computeLeaderLead = (
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

const computeHotStreak = (counts: UserBeerCount[]) => {
  const hot = counts.reduce((best: UserBeerCount | null, current) => {
    if (!best) return current;
    const bestStreak = best.streakCount || 0;
    const currentStreak = current.streakCount || 0;
    return currentStreak > bestStreak ? current : best;
  }, null);
  return hot && (hot.streakCount || 0) > 0 ? hot : null;
};

export const useBeers = () => {
  const { activeEvent } = useApp();
  const [beerCounts, setBeerCounts] = useState<UserBeerCount[]>([]);
  const [rawBeers, setRawBeers] = useState<{ created_at: string }[]>([]);
  const [totalBeers, setTotalBeers] = useState(0);
  const [leaderInfo, setLeaderInfo] = useState<UserBeerCount | null>(null);
  const [leaderLead, setLeaderLead] = useState(0);
  const [hotStreak, setHotStreak] = useState<UserBeerCount | null>(null);
  const [gameStatsAvailable, setGameStatsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      if (!activeEvent?.id) {
        setGameStatsAvailable(false);
        setBeerCounts([]);
        setTotalBeers(0);
        setLeaderInfo(null);
        setLeaderLead(0);
        setHotStreak(null);
        setRawBeers([]);
        return;
      }

      const [statsResult, leaderResult, users] = await Promise.all([
        getEventGameStats(activeEvent.id),
        getEventLeaderState(activeEvent.id),
        getUsers(),
      ]);

      if (!statsResult.missingTable) {
        setGameStatsAvailable(true);
        const sorted = buildMergedStats(
          users || [],
          statsResult.stats as BeerStatRow[],
        );
        const leaderFromState = resolveLeaderInfo(
          sorted,
          leaderResult.leader?.user_id,
        );
        setBeerCounts(sorted);
        setTotalBeers(computeTotalBeers(sorted));
        setLeaderInfo(leaderFromState);
        setLeaderLead(computeLeaderLead(sorted, leaderFromState));
        setHotStreak(computeHotStreak(sorted));
      } else {
        setGameStatsAvailable(false);
        const counts = (await getBeerCountByUser(
          activeEvent.id,
        )) as UserBeerCount[];
        const sorted = counts.sort((a, b) => b.count - a.count);
        setBeerCounts(sorted);
        setTotalBeers(computeTotalBeers(sorted));
        setLeaderInfo(sorted[0] || null);
        setLeaderLead(sorted[0]?.count || 0);
        setHotStreak(null);
      }

      const { data } = await supabase
        .from("beers")
        .select("created_at")
        .eq("event_id", activeEvent.id);
      setRawBeers(data || []);
    } catch (e) {
      reportError(new Error("Failed to fetch beer data"), {
        scope: "useBeers",
        action: "fetch_beer_data",
        metadata: { cause: e instanceof Error ? e.message : String(e) },
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeEvent]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();

    if (!activeEvent?.id) return;

    const channel = supabase
      .channel("beers_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "beers" },
        () => {
          fetchData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_game_stats" },
        () => {
          fetchData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_leader_state" },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeEvent?.id, fetchData]);

  return {
    beerCounts,
    rawBeers,
    totalBeers,
    leaderInfo,
    leaderLead,
    hotStreak,
    gameStatsAvailable,
    loading,
    refreshing,
    refresh,
  };
};
