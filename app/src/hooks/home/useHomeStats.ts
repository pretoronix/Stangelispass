import { useMemo } from "react";
import { calculateVelocity, prepareTrendData } from "@/utils/statsCalculator";
import { estimateBAC } from "@/services/safety";
import {
  calculateBill,
  getEventDurationLabel,
  getStartRoundPriceLabel,
} from "@/utils/home/homeHelpers";
import { User, Event } from "@/services/supabase";

interface UseHomeStatsParams {
  activeEvent: Event | null;
  currentUser: User | null;
  rawBeers: any[];
  totalBeers: number;
  leaderInfo: any;
  beerCounts: any[];
}

export function useHomeStats({
  activeEvent,
  currentUser,
  rawBeers,
  totalBeers,
  leaderInfo,
  beerCounts,
}: UseHomeStatsParams) {
  const groupVelocity = useMemo(
    () =>
      calculateVelocity(
        rawBeers.map((b) => b.created_at),
        activeEvent?.created_at,
      ),
    [rawBeers, activeEvent?.created_at],
  );

  const trendData = useMemo(
    () => prepareTrendData(rawBeers.map((b) => b.created_at)),
    [rawBeers],
  );

  const beerPriceFromEvent = activeEvent?.beer_price ?? 5.0;
  const totalBill = useMemo(
    () => calculateBill(totalBeers, beerPriceFromEvent),
    [totalBeers, beerPriceFromEvent],
  );

  const winner = leaderInfo ?? beerCounts[0];
  const startRoundPriceLabel = useMemo(() => getStartRoundPriceLabel(), []);
  const activeEventDurationLabel = useMemo(
    () => getEventDurationLabel(activeEvent?.pass_type),
    [activeEvent?.pass_type],
  );

  const currentUserStats = useMemo(
    () => beerCounts.find((b) => b.userId === currentUser?.id),
    [beerCounts, currentUser?.id],
  );

  const bacStats = useMemo(
    () =>
      estimateBAC(
        currentUserStats?.count || 0,
        activeEvent?.created_at ? new Date(activeEvent.created_at) : new Date(),
        currentUser,
      ),
    [currentUserStats?.count, activeEvent?.created_at, currentUser],
  );

  return {
    groupVelocity,
    trendData,
    totalBill,
    winner,
    startRoundPriceLabel,
    activeEventDurationLabel,
    bacStats,
  };
}
