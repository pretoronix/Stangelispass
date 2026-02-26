import { supabase } from "../client";
import { Beer, Achievement } from "../types";
import { isMissingTableError } from "../helpers";
import { logMissingTable } from "./beerUtils";
import { getEventMembers } from "@/services/events/memberships";

type BeerQueryOptions = {
  limit?: number;
  cursor?: string;
};

export const getBeers = async (
  eventId?: string,
  options?: BeerQueryOptions,
): Promise<Beer[]> => {
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

  if (options?.cursor) {
    query = query.lt("created_at", options.cursor);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
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

export const getBeerCountByEventMembers = async (
  eventId: string,
): Promise<
  { userId: string; name: string; count: number; isAdmin: boolean }[]
> => {
  const members = await getEventMembers(eventId);
  const memberUsers = members
    .map((member) => member.user)
    .filter(
      (user): user is { id: string; name: string; is_admin: boolean } =>
        !!user?.id,
    );

  if (memberUsers.length > 0) {
    const memberIds = memberUsers.map((user) => user.id);
    let beersQuery = (supabase.from("beers") as any)
      .select("user_id")
      .eq("event_id", eventId);

    if (memberIds.length > 0) {
      beersQuery = beersQuery.in("user_id", memberIds);
    }

    const { data: beers, error: beersError } = await beersQuery;

    if (beersError) {
      if (isMissingTableError(beersError)) {
        logMissingTable("beers", "Returning zero beer counts (expected)");
        return memberUsers.map((user) => ({
          userId: user.id,
          name: user.name,
          count: 0,
          isAdmin: !!user.is_admin,
        }));
      }
      throw beersError;
    }

    const counts = new Map<string, number>();
    for (const row of beers || []) {
      const key = (row as any).user_id as string;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return memberUsers
      .map((user) => ({
        userId: user.id,
        name: user.name,
        count: counts.get(user.id) || 0,
        isAdmin: !!user.is_admin,
      }))
      .sort((a, b) => b.count - a.count);
  }

  const { data: beers, error: beersError } = await (
    supabase.from("beers") as any
  )
    .select("user_id, user:users!user_id(id,name,is_admin)")
    .eq("event_id", eventId);

  if (beersError) {
    if (isMissingTableError(beersError)) {
      logMissingTable("beers", "Returning zero beer counts (expected)");
      return [];
    }
    throw beersError;
  }

  const counts = new Map<string, number>();
  const users = new Map<string, { name: string; is_admin: boolean }>();
  for (const row of beers || []) {
    const userId = (row as any).user_id as string | undefined;
    if (!userId) continue;
    counts.set(userId, (counts.get(userId) || 0) + 1);
    const user = (row as any).user;
    if (user && !users.has(userId)) {
      users.set(userId, {
        name: user.name || "Unknown",
        is_admin: !!user.is_admin,
      });
    }
  }

  return Array.from(counts.entries())
    .map(([userId, count]) => {
      const user = users.get(userId);
      return {
        userId,
        name: user?.name || "Unknown",
        count,
        isAdmin: !!user?.is_admin,
      };
    })
    .sort((a, b) => b.count - a.count);
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
