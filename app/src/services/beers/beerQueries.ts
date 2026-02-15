import { supabase } from "../client";
import { Beer, Achievement } from "../types";
import { isMissingTableError } from "../helpers";
import { logMissingTable } from "./beerUtils";

export const getBeers = async (eventId?: string): Promise<Beer[]> => {
  let query = supabase
    .from("beers")
    .select(
      `
            *,
            user:users!user_id(*),
            added_by_user:users!added_by(*)
        `,
    )
    .order("created_at", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error)) {
      logMissingTable("beers", "Returning empty beers list (expected)");
      return [];
    }
    throw error;
  }
  return (data as unknown as Beer[]) || [];
};

export const getBeersByUser = async (userId: string): Promise<Beer[]> => {
  const { data, error } = await supabase
    .from("beers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      logMissingTable("beers", "Returning empty beers list (expected)");
      return [];
    }
    throw error;
  }
  return (data as Beer[]) || [];
};

export const removeBeer = async (beerId: string): Promise<void> => {
  const { error } = await supabase.from("beers").delete().eq("id", beerId);

  if (error) {
    if (isMissingTableError(error)) {
      logMissingTable("beers", "removeBeer skipped (expected)");
      return;
    }
    throw error;
  }
};

export const getBeerCountByUser = async (
  eventId?: string,
): Promise<
  { userId: string; name: string; count: number; isAdmin: boolean }[]
> => {
  const { data: users, error: usersError } = await (
    supabase.from("users") as any
  ).select("id,name,is_admin");

  if (usersError) {
    if (isMissingTableError(usersError)) {
      logMissingTable("users", "Returning empty beer counts (expected)");
      return [];
    }
    throw usersError;
  }

  let beersQuery = (supabase.from("beers") as any).select("user_id");

  if (eventId) {
    beersQuery = beersQuery.eq("event_id", eventId);
  }

  const { data: beers, error: beersError } = await beersQuery;
  const safeUsers =
    (users as { id: string; name: string; is_admin: boolean }[] | null) || [];
  if (beersError) {
    if (isMissingTableError(beersError)) {
      logMissingTable("beers", "Returning zero beer counts (expected)");
      return safeUsers.map((u) => ({
        userId: u.id,
        name: u.name,
        count: 0,
        isAdmin: !!u.is_admin,
      }));
    }
    throw beersError;
  }

  const counts = new Map<string, number>();
  for (const row of beers || []) {
    const key = (row as any).user_id as string;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return safeUsers.map((u) => ({
    userId: u.id,
    name: u.name,
    count: counts.get(u.id) || 0,
    isAdmin: !!u.is_admin,
  }));
};

export const getUserAchievements = async (
  userId: string,
): Promise<Achievement[]> => {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    if (isMissingTableError(error)) {
      logMissingTable(
        "achievements",
        "Returning empty achievements (expected)",
      );
      return [];
    }
    throw error;
  }
  return (data as Achievement[]) || [];
};
