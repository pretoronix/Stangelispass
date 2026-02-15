import { supabase } from "../client";
import { EventMembership, EventRole } from "../types";
import { isMissingTableError } from "../helpers";

export const getEventMembership = async (
  eventId: string,
  userId: string,
): Promise<{ membership: EventMembership | null; missingTable: boolean }> => {
  try {
    const { data, error } = await (supabase.from("event_memberships") as any)
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        return {
          membership: null as EventMembership | null,
          missingTable: true,
        };
      }
      throw error;
    }

    return {
      membership: (data as EventMembership) || null,
      missingTable: false,
    };
  } catch (e: any) {
    if (isMissingTableError(e)) {
      return { membership: null as EventMembership | null, missingTable: true };
    }
    throw e;
  }
};

export const getEventMembers = async (
  eventId: string,
): Promise<EventMembership[]> => {
  try {
    const { data, error } = await (supabase.from("event_memberships") as any)
      .select("*, user:users!user_id(id,name,is_admin)")
      .eq("event_id", eventId)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (error) {
      if (isMissingTableError(error)) return [] as EventMembership[];
      throw error;
    }

    return (data as EventMembership[]) || [];
  } catch (e: any) {
    if (isMissingTableError(e)) return [] as EventMembership[];
    throw e;
  }
};

export const upsertEventMemberRole = async (
  eventId: string,
  userId: string,
  role: EventRole,
  invitedBy?: string | null,
): Promise<EventMembership | null> => {
  const payload = {
    event_id: eventId,
    user_id: userId,
    role,
    status: "active",
    invited_by: invitedBy || null,
    joined_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase.from("event_memberships") as any)
    .upsert(payload, { onConflict: "event_id,user_id" })
    .select()
    .single();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }

  return (data as EventMembership) || null;
};

export const removeEventMember = async (
  eventId: string,
  userId: string,
): Promise<boolean> => {
  const { error } = await (supabase.from("event_memberships") as any)
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }

  return true;
};

export const joinEvent = async (
  eventId: string,
  userId: string,
  invitedBy?: string | null,
): Promise<{ ok: boolean; fallbackLegacy: boolean }> => {
  const membership = await upsertEventMemberRole(
    eventId,
    userId,
    "member",
    invitedBy || null,
  );
  if (!membership) {
    // Legacy fallback when table doesn't exist yet.
    return { ok: true, fallbackLegacy: true };
  }
  return { ok: true, fallbackLegacy: false };
};
