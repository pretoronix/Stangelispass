import { supabase } from "./client";
import { isMissingTableError } from "./helpers";
import { updateUser } from "./users";
import type { User } from "./types";
import { logExpected, reportError } from "@/utils/logger";

export type LifetimePassCode = {
  id: string;
  code: string;
  created_by: string | null;
  redeemed_by: string | null;
  redeemed_at: string | null;
  expires_at: string | null;
  created_at: string;
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateCode = () => {
  const parts = [];
  for (let i = 0; i < 3; i += 1) {
    let segment = "";
    for (let j = 0; j < 4; j += 1) {
      segment +=
        CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    parts.push(segment);
  }
  return `LIFE-${parts.join("-")}`;
};

export const listLifetimePassCodes = async (): Promise<LifetimePassCode[]> => {
  const { data, error } = await (supabase.from("lifetime_pass_codes") as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      logExpected(
        "table `lifetime_pass_codes` not found. Returning empty codes list.",
        "lifetime_pass",
      );
      return [];
    }
    throw error;
  }
  return (data as LifetimePassCode[]) || [];
};

export const createLifetimePassCode = async (
  createdBy: string,
): Promise<LifetimePassCode | null> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = generateCode();
    const { data, error } = await (supabase.from("lifetime_pass_codes") as any)
      .insert({
        code,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        logExpected(
          "table `lifetime_pass_codes` not found. Cannot create code.",
          "lifetime_pass",
        );
        return null;
      }
      if ((error as any).code === "23505") {
        continue;
      }
      throw error;
    }

    return (data as LifetimePassCode) || null;
  }

  return null;
};

export const redeemLifetimePassCode = async (
  code: string,
  userId: string,
): Promise<{ ok: boolean; reason?: string; user?: User | null }> => {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    return { ok: false, reason: "empty_code" };
  }

  const { data, error } = await (supabase.from("lifetime_pass_codes") as any)
    .select("*")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      logExpected(
        "table `lifetime_pass_codes` not found. Cannot redeem code.",
        "lifetime_pass",
      );
      return { ok: false, reason: "codes_unavailable" };
    }
    throw error;
  }

  if (!data) {
    return { ok: false, reason: "invalid_code" };
  }

  const record = data as LifetimePassCode;
  if (record.redeemed_at) {
    return { ok: false, reason: "already_redeemed" };
  }
  if (record.expires_at && new Date(record.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const now = new Date().toISOString();
  const { data: redeemed, error: redeemError } = await (
    supabase.from("lifetime_pass_codes") as any
  )
    .update({
      redeemed_by: userId,
      redeemed_at: now,
    })
    .eq("id", record.id)
    .is("redeemed_at", null)
    .select()
    .single();

  if (redeemError || !redeemed) {
    return { ok: false, reason: "already_redeemed" };
  }

  try {
    const updatedUser = await updateUser(userId, {
      subscription_tier: "lifetime",
      lifetime_pass: true,
      lifetime_pass_granted_at: now,
      lifetime_pass_code: normalizedCode,
    });
    return { ok: true, user: updatedUser };
  } catch (e) {
    reportError(e as Error, { scope: "lifetime_pass", action: "update_user" });
    return { ok: false, reason: "user_update_failed" };
  }
};
