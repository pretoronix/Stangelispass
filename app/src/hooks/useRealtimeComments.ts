import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/client";
import { COMMENT_QUERY_KEYS } from "./useCommentsQuery";
import { logInfo, reportError } from "@/utils/logger";

/**
 * Real-time subscription hook for comments
 * Subscribes to INSERT, UPDATE, DELETE events for a specific beer
 * Auto-updates React Query cache when changes occur
 */
export function useRealtimeComments(beerId: string, enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!beerId || !enabled) return;

    const channelName = `comments:${beerId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `beer_id=eq.${beerId}`,
        },
        (payload) => {
          logInfo("New comment received", {
            scope: "useRealtimeComments",
            action: "insert",
            metadata: { beerId, commentId: payload?.new?.id },
          });
          queryClient.invalidateQueries({
            queryKey: COMMENT_QUERY_KEYS.byBeer(beerId),
          });
          queryClient.invalidateQueries({
            queryKey: COMMENT_QUERY_KEYS.count(beerId),
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comments",
          filter: `beer_id=eq.${beerId}`,
        },
        (payload) => {
          logInfo("Comment updated", {
            scope: "useRealtimeComments",
            action: "update",
            metadata: { beerId, commentId: payload?.new?.id },
          });
          queryClient.invalidateQueries({
            queryKey: COMMENT_QUERY_KEYS.byBeer(beerId),
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
          filter: `beer_id=eq.${beerId}`,
        },
        (payload) => {
          logInfo("Comment deleted", {
            scope: "useRealtimeComments",
            action: "delete",
            metadata: { beerId, commentId: payload?.old?.id },
          });
          queryClient.invalidateQueries({
            queryKey: COMMENT_QUERY_KEYS.byBeer(beerId),
          });
          queryClient.invalidateQueries({
            queryKey: COMMENT_QUERY_KEYS.count(beerId),
          });
        },
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          logInfo("Subscribed to comments channel", {
            scope: "useRealtimeComments",
            action: "subscribe",
            metadata: { beerId, channelName },
          });
        } else if (status === "CHANNEL_ERROR") {
          reportError(err || new Error("Channel subscription error"), {
            scope: "useRealtimeComments",
            action: "subscribe",
            metadata: { beerId, channelName, status },
          });
        } else if (status === "TIMED_OUT") {
          reportError(
            new Error("Subscription timed out for comments channel"),
            {
              scope: "useRealtimeComments",
              action: "subscribe_timeout",
              metadata: { beerId, channelName, status },
            },
          );
        } else if (status === "CLOSED") {
          logInfo("Comments channel closed", {
            scope: "useRealtimeComments",
            action: "closed",
            metadata: { beerId, channelName },
          });
        }
      });

    return () => {
      logInfo("Unsubscribing from comments channel", {
        scope: "useRealtimeComments",
        action: "unsubscribe",
        metadata: { beerId, channelName },
      });
      supabase.removeChannel(channel);
    };
  }, [beerId, enabled, queryClient]);
}
