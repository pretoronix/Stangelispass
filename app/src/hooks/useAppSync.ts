import { useEffect, useRef, useState, useCallback } from "react";
import { Alert } from "react-native";
import { supabase } from "@/services/supabase";
import { reportError } from "@/utils/logger";
import { assertSupabaseConfigured } from "@/utils/preflight";
import {
  subscribeUsersAndEvents,
  subscribeEventMemberships,
} from "@/providers/appProviderLifecycle";
import { buildLocalEvent } from "@/providers/appProviderUtils";
import { Event } from "@/services/supabase";

interface UseAppSyncParams {
  refreshUsers: () => Promise<void>;
  refreshActiveEvent: () => Promise<void>;
  refreshEventMembers: () => Promise<void>;
  refreshEventAccess: () => Promise<void>;
  activeEventId?: string;
}

export function useAppSync({
  refreshUsers,
  refreshActiveEvent,
  refreshEventMembers,
  refreshEventAccess,
  activeEventId,
}: UseAppSyncParams) {
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [remoteAvailable, setRemoteAvailable] = useState(true);
  const [localActiveEventOverride, setLocalActiveEventOverride] =
    useState<Event | null>(null);
  const configAlertShown = useRef(false);

  useEffect(() => {
    let configured = false;
    try {
      configured = assertSupabaseConfigured();
    } catch (e) {
      reportError(e, { scope: "useAppSync", action: "supabase_config" });
    }
    setSupabaseConfigured(configured);

    if (!configured) {
      setRemoteAvailable(false);
      setLocalActiveEventOverride((prev) => prev || buildLocalEvent());
      if (!configAlertShown.current) {
        configAlertShown.current = true;
        Alert.alert(
          "Configuration Required",
          "Supabase is not configured. The app will run in offline mode.",
        );
      }
    } else {
      // Lightweight health check
      void (async () => {
        try {
          const { error } = await (supabase as any)
            .from("users")
            .select("id", { head: true, count: "exact" });
          if (error) throw error;
          setRemoteAvailable(true);
        } catch (e) {
          reportError(e, { scope: "useAppSync", action: "db_health_check" });
          setRemoteAvailable(false);
          setLocalActiveEventOverride((prev) => prev || buildLocalEvent());
        }
      })();
    }

    // Prime queries on mount to match previous provider bootstrap behavior.
    // Errors are handled inside the callbacks.
    void refreshUsers();
    void refreshActiveEvent();

    const unsubscribe = subscribeUsersAndEvents(
      refreshUsers,
      refreshActiveEvent,
    );
    return () => {
      try {
        unsubscribe();
      } catch (e) {
        reportError(e, {
          scope: "useAppSync",
          action: "unsubscribe_cleanup_failure",
        });
      }
    };
  }, [refreshUsers, refreshActiveEvent]);

  // Handle membership subscriptions when event changes
  useEffect(() => {
    if (!activeEventId) return;
    return subscribeEventMemberships(
      activeEventId,
      refreshEventMembers,
      refreshEventAccess,
    );
  }, [activeEventId, refreshEventMembers, refreshEventAccess]);

  return {
    supabaseConfigured,
    remoteAvailable,
    localActiveEventOverride,
    setLocalActiveEventOverride,
    setRemoteAvailable,
  };
}
