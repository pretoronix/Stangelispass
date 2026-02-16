import { supabase } from "./client";
import { isMissingTableError } from "./helpers";
import type { User } from "./types";

export type PromoCodeType = "event_day" | "event_weekend" | "lifetime";

export type PromoCode = {
  id: string;
  code: string;
  type: PromoCodeType;
  credits?: number | null;
  active?: boolean | null;
  created_by?: string | null;
  redeemed_by?: string | null;
  redeemed_at?: string | null;
  expires_at?: string | null;
  created_at: string;
};

export const listPromoCodes = async (): Promise<PromoCode[]> => {
  try {
    const { data, error } = await (supabase.from("promo_codes") as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTableError(error)) return [];
      throw error;
    }
    return (data as PromoCode[]) || [];
  } catch (e: any) {
    if (isMissingTableError(e)) return [];
    throw e;
  }
};

const generateCode = () => {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
};

export const createPromoCode = async (
  type: PromoCodeType,
  createdBy?: string | null,
  credits = 1,
): Promise<PromoCode | null> => {
  const payload = {
    code: generateCode(),
    type,
    credits,
    created_by: createdBy || null,
  };

  const { data, error } = await (supabase.from("promo_codes") as any)
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }

  return (data as PromoCode) || null;
};

export const redeemPromoCode = async (
  code: string,
  userId: string,
): Promise<{
  ok: boolean;
  reason?: "invalid" | "already_redeemed" | "expired" | "codes_unavailable";
  type?: PromoCodeType;
  credits?: number;
  user?: User | null;
}> => {
  try {
    const { data, error } = await (supabase.from("promo_codes") as any)
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error))
        return { ok: false, reason: "codes_unavailable" };
      throw error;
    }

    const promo = data as PromoCode | null;
    if (!promo) return { ok: false, reason: "invalid" };
    if (promo.redeemed_by) return { ok: false, reason: "already_redeemed" };
    if (promo.expires_at && new Date(promo.expires_at) < new Date())
      return { ok: false, reason: "expired" };

    const { error: updateError } = await (supabase.from("promo_codes") as any)
      .update({
        redeemed_by: userId,
        redeemed_at: new Date().toISOString(),
        active: false,
      })
      .eq("id", promo.id);
    if (updateError) throw updateError;

    return { ok: true, type: promo.type, credits: promo.credits || 1 };
  } catch (e: any) {
    if (isMissingTableError(e))
      return { ok: false, reason: "codes_unavailable" };
    throw e;
  }
};
