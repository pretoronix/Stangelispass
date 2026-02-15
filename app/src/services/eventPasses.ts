import { supabase } from "./client";
import { isMissingTableError } from "./helpers";
import type { User } from "./types";
import { getEventPricingType } from "@/utils/eventPricing";

export type EventCreditType = "day" | "weekend";

export const hasLifetimeAccess = (user: User | null) => {
  return !!user?.lifetime_pass || user?.subscription_tier === "lifetime";
};

export const getAvailableCredits = (user: User | null) => {
  return {
    free: user?.free_event_credits ?? 0,
    day: user?.paid_event_credits_day ?? 0,
    weekend: user?.paid_event_credits_weekend ?? 0,
  };
};

export const consumeEventCredit = async (
  userId: string,
  pricingType: EventCreditType,
) => {
  const { data, error } = await (supabase.from("users") as any)
    .select(
      "id, free_event_credits, paid_event_credits_day, paid_event_credits_weekend",
    )
    .eq("id", userId)
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return { ok: false, reason: "credits_unavailable" as const };
    }
    throw error;
  }

  const freeCredits = Number(data?.free_event_credits ?? 0);
  const dayCredits = Number(data?.paid_event_credits_day ?? 0);
  const weekendCredits = Number(data?.paid_event_credits_weekend ?? 0);

  if (freeCredits > 0) {
    const { error: updateError } = await (supabase.from("users") as any)
      .update({ free_event_credits: freeCredits - 1 })
      .eq("id", userId);
    if (updateError) throw updateError;
    return { ok: true, used: "free" as const };
  }

  if (pricingType === "day" && dayCredits > 0) {
    const { error: updateError } = await (supabase.from("users") as any)
      .update({ paid_event_credits_day: dayCredits - 1 })
      .eq("id", userId);
    if (updateError) throw updateError;
    return { ok: true, used: "day" as const };
  }

  if (pricingType === "weekend" && weekendCredits > 0) {
    const { error: updateError } = await (supabase.from("users") as any)
      .update({ paid_event_credits_weekend: weekendCredits - 1 })
      .eq("id", userId);
    if (updateError) throw updateError;
    return { ok: true, used: "weekend" as const };
  }

  return { ok: false, reason: "no_credits" as const };
};

export const grantEventCredits = async (
  userId: string,
  pricingType: EventCreditType,
  amount: number,
) => {
  const column =
    pricingType === "day"
      ? "paid_event_credits_day"
      : "paid_event_credits_weekend";
  const { data, error } = await (supabase.from("users") as any)
    .select(`id, ${column}`)
    .eq("id", userId)
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return { ok: false, reason: "credits_unavailable" as const };
    }
    throw error;
  }

  const current = Number(data?.[column] ?? 0);
  const { error: updateError } = await (supabase.from("users") as any)
    .update({ [column]: current + amount })
    .eq("id", userId);

  if (updateError) {
    if (isMissingTableError(updateError)) {
      return { ok: false, reason: "credits_unavailable" as const };
    }
    throw updateError;
  }

  return { ok: true };
};

export const getPricingTypeForStart = () => getEventPricingType(new Date());
