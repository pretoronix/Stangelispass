import { useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import { reportError } from "@/utils/logger";

const AUTO_HIDE_MS = 2500;

export function useBeerLogToast(
  currentUserId: string | null,
  activeEventId: string | null,
) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("Beer logged!");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNotifiedId = useRef<string | null>(null);

  useEffect(() => {
    setVisible(false);
  }, [currentUserId, activeEventId]);

  useEffect(() => {
    if (!currentUserId || !activeEventId) return;
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`beer_log_toast_${activeEventId}_${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "beers",
          filter: `event_id=eq.${activeEventId}`,
        },
        (payload: any) => {
          try {
            const record = payload?.new;
            if (!record) return;
            if (record.user_id !== currentUserId) return;
            if (record.id && record.id === lastNotifiedId.current) return;

            lastNotifiedId.current = record.id || null;
            setMessage("Beer logged!");
            setVisible(true);

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(
              () => setVisible(false),
              AUTO_HIDE_MS,
            );
          } catch (e) {
            reportError(e as Error, {
              scope: "useBeerLogToast",
              action: "handle_insert",
            });
          }
        },
      )
      .subscribe();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [currentUserId, activeEventId]);

  return { visible, message };
}
