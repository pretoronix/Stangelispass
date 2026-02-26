import React from "react";
import {
  useBeersQuery,
  useBeerCounts,
  useEventGameStats,
  useEventLeaderState,
  useEventMembers,
} from "@/hooks/query";
import {
  buildCountsFromStats,
  computeHotStreak,
  computeLeaderLead,
  computeTotalBeers,
  resolveLeaderInfo,
  UserBeerCount,
} from "@/utils/home/homeEventData";

const EMPTY_COUNTS: UserBeerCount[] = [];

export const useHomeEventData = (activeEventId?: string | null) => {
  const beersQuery = useBeersQuery(activeEventId || undefined);
  const countsQuery = useBeerCounts(activeEventId || undefined);
  const eventMembersQuery = useEventMembers(
    activeEventId || "",
    !!activeEventId,
  );
  const gameStatsQuery = useEventGameStats(
    activeEventId || "",
    !!activeEventId,
  );
  const leaderStateQuery = useEventLeaderState(
    activeEventId || "",
    !!activeEventId,
  );

  const beerCounts = React.useMemo(() => {
    if (!activeEventId) return EMPTY_COUNTS;
    if (gameStatsQuery.data && !gameStatsQuery.data.missingTable) {
      return buildCountsFromStats(
        eventMembersQuery.data || [],
        gameStatsQuery.data.stats || [],
      );
    }
    return (countsQuery.data as UserBeerCount[]) || EMPTY_COUNTS;
  }, [
    activeEventId,
    countsQuery.data,
    eventMembersQuery.data,
    gameStatsQuery.data,
  ]);

  const rawBeers = React.useMemo(
    () =>
      (beersQuery.data || []).map((beer) => ({
        created_at: beer.created_at,
      })),
    [beersQuery.data],
  );

  const totalBeers = React.useMemo(
    () => computeTotalBeers(beerCounts),
    [beerCounts],
  );

  const leaderInfo = React.useMemo(() => {
    if (gameStatsQuery.data && !gameStatsQuery.data.missingTable) {
      return resolveLeaderInfo(
        beerCounts,
        leaderStateQuery.data?.leader?.user_id,
      );
    }
    return beerCounts[0] || null;
  }, [beerCounts, gameStatsQuery.data, leaderStateQuery.data?.leader?.user_id]);

  const leaderLead = React.useMemo(() => {
    if (gameStatsQuery.data && !gameStatsQuery.data.missingTable) {
      return computeLeaderLead(beerCounts, leaderInfo);
    }
    return beerCounts[0]?.count || 0;
  }, [beerCounts, gameStatsQuery.data, leaderInfo]);

  const hotStreak = React.useMemo(() => {
    if (gameStatsQuery.data && !gameStatsQuery.data.missingTable) {
      return computeHotStreak(beerCounts);
    }
    return null;
  }, [beerCounts, gameStatsQuery.data]);

  const gameStatsAvailable = !!gameStatsQuery.data?.missingTable
    ? false
    : !!gameStatsQuery.data;

  const loading =
    beersQuery.isLoading ||
    countsQuery.isLoading ||
    gameStatsQuery.isLoading ||
    leaderStateQuery.isLoading;

  const refreshing =
    beersQuery.isRefetching ||
    countsQuery.isRefetching ||
    gameStatsQuery.isRefetching ||
    leaderStateQuery.isRefetching;

  const refresh = React.useCallback(() => {
    beersQuery.refetch().catch(() => null);
    countsQuery.refetch().catch(() => null);
    eventMembersQuery.refetch().catch(() => null);
    gameStatsQuery.refetch().catch(() => null);
    leaderStateQuery.refetch().catch(() => null);
  }, [
    beersQuery,
    countsQuery,
    eventMembersQuery,
    gameStatsQuery,
    leaderStateQuery,
  ]);

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
