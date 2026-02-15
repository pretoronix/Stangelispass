import { supabase } from "./client";
import { User, NotificationPrefs, DEFAULT_NOTIFICATION_PREFS } from "./types";
import { logExpected } from "@/utils/logger";

// Re-export types for convenience
export type { User, NotificationPrefs } from "./types";
export { DEFAULT_NOTIFICATION_PREFS } from "./types";

/**
 * User operations module
 * Handles all user-related database operations
 */

export const getUsers = async (): Promise<User[]> => {
  try {
    const from = (supabase as any).from && (supabase as any).from("users");
    if (!from || typeof from.select !== "function") {
      // Supabase noop client or incompatible client — return safe default
      return [];
    }
    const { data, error } = await from.select("*").order("name");

    if (error) {
      if ((error as any).code === "PGRST205") {
        logExpected(
          "table `users` not found. Returning empty users list.",
          "users",
        );
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (e) {
    // If any unexpected shape is encountered, return empty list to keep app running
    logExpected("getUsers fallback due to error", "users");
    return [];
  }
};

export const addUser = async (
  name: string,
  isAdmin: boolean = false,
): Promise<User | null> => {
  let shouldBeAdmin = isAdmin;
  try {
    // Ensure first user in an empty project becomes admin by default.
    const { count, error } = await (supabase.from("users") as any).select("*", {
      count: "exact",
      head: true,
    });
    if (!error && Number(count || 0) === 0) {
      shouldBeAdmin = true;
    }
  } catch (_e) {
    // Ignore pre-check failures and continue with requested role.
  }

  const { data, error } = await (supabase.from("users") as any)
    .insert({ name, is_admin: shouldBeAdmin })
    .select()
    .single();

  if (error) {
    if ((error as any).code === "PGRST205") {
      logExpected("table `users` not found. addUser skipped.", "users");
      return null;
    }
    throw error;
  }
  return data;
};

export const updateUser = async (
  userId: string,
  updates: Partial<User>,
): Promise<User | null> => {
  const { data, error } = await (supabase.from("users") as any)
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    if ((error as any).code === "PGRST205") {
      logExpected("table `users` not found. updateUser skipped.", "users");
      return null;
    }
    throw error;
  }
  return data || null;
};

export const normalizeNotificationPrefs = (input: any): NotificationPrefs => {
  const prefs = input && typeof input === "object" ? input : {};
  const leader_change =
    typeof prefs.leader_change === "boolean"
      ? prefs.leader_change
      : DEFAULT_NOTIFICATION_PREFS.leader_change;

  const milestones: number[] = Array.isArray(prefs.milestones)
    ? prefs.milestones
        .map((n: any) => Number(n))
        .filter((n: number) => Number.isFinite(n) && n > 0)
    : [...DEFAULT_NOTIFICATION_PREFS.milestones];

  const adminBroadcasts =
    typeof prefs.admin_broadcasts === "boolean"
      ? prefs.admin_broadcasts
      : DEFAULT_NOTIFICATION_PREFS.admin_broadcasts;

  const newRound =
    typeof prefs.new_round === "boolean"
      ? prefs.new_round
      : DEFAULT_NOTIFICATION_PREFS.new_round;

  return {
    leader_change,
    milestones: [...new Set<number>(milestones)].sort((a, b) => a - b),
    admin_broadcasts: adminBroadcasts,
    new_round: newRound,
  };
};
