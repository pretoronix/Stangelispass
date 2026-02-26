import React from "react";
import { supabase } from "@/services/supabase";

export const useHomeSubscriptions = (
  activeEventId: string | undefined,
  refresh: () => void,
) => {
  React.useEffect(() => {
    if (!activeEventId) return;
    const channel = supabase
      .channel("home_beers_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "beers" },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_game_stats" },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_leader_state" },
        () => refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeEventId, refresh]);
};
