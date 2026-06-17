import { supabase } from "./client";
import { isMissingColumnError, isMissingTableError } from "./helpers";
import type { User } from "./types";
import { getEventPricingType } from "@/utils/eventPricing";
import { isPaymentsUiOnly } from "@/config/payments";

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

const isCreditsSchemaError = (error: unknown) =>
  isMissingTableError(error) || isMissingColumnError(error);

// Credit balances are mutated with a read-then-write, so concurrent event
// starts (consume) or purchases (grant) would race on a stale value and either
// double-spend a credit or lose a granted one. We guard each UPDATE with a
// compare-and-swap on the value we read; if no row comes back another writer
// won, so we re-read and retry. This keeps the fix purely client-side (no DB
// migration) while making the mutation safe under contention.
const MAX_CAS_ATTEMPTS = 5;

type CreditColumn =
  | "free_event_credits"
  | "paid_event_credits_day"
  | "paid_event_credits_weekend";

/**
 * Conditionally writes `nextValue` to `column` only if it still holds
 * `expectedValue` (CAS). Returns whether the row was claimed, or a schema flag
 * so callers can surface `credits_unavailable`.
 */
const compareAndSwapCredit = async (
  userId: string,
  column: CreditColumn,
  expectedValue: number | null,
  nextValue: number,
): Promise<{ swapped: boolean; schemaMissing?: boolean }> => {
  let query = (supabase.from("users") as any)
    .update({ [column]: nextValue })
    .eq("id", userId);
  // A NULL column does not match `.eq(column, 0)` in SQL, so guard the
  // not-yet-initialised case with IS NULL instead.
  query =
    expectedValue === null
      ? query.is(column, null)
      : query.eq(column, expectedValue);

  const { data, error } = await query.select("id");

  if (error) {
    if (isCreditsSchemaError(error))
      return { swapped: false, schemaMissing: true };
    throw error;
  }

  return { swapped: Array.isArray(data) && data.length > 0 };
};

export const consumeEventCredit = async (
  userId: string,
  pricingType: EventCreditType,
) => {
  if (isPaymentsUiOnly()) {
    // UI-only mode: allow event start without touching the database.
    return { ok: true, used: "free" as const };
  }

  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
    const { data, error } = await (supabase.from("users") as any)
      .select(
        "id, free_event_credits, paid_event_credits_day, paid_event_credits_weekend",
      )
      .eq("id", userId)
      .single();

    if (error) {
      if (isCreditsSchemaError(error)) {
        return { ok: false, reason: "credits_unavailable" as const };
      }
      throw error;
    }

    const freeCredits = Number(data?.free_event_credits ?? 0);
    const dayCredits = Number(data?.paid_event_credits_day ?? 0);
    const weekendCredits = Number(data?.paid_event_credits_weekend ?? 0);

    // Prefer free credits, then the paid credit matching the event's pricing.
    let target: {
      column: CreditColumn;
      current: number;
      used: "free" | "day" | "weekend";
    } | null = null;
    if (freeCredits > 0) {
      target = {
        column: "free_event_credits",
        current: freeCredits,
        used: "free",
      };
    } else if (pricingType === "day" && dayCredits > 0) {
      target = {
        column: "paid_event_credits_day",
        current: dayCredits,
        used: "day",
      };
    } else if (pricingType === "weekend" && weekendCredits > 0) {
      target = {
        column: "paid_event_credits_weekend",
        current: weekendCredits,
        used: "weekend",
      };
    }

    if (!target) {
      return { ok: false, reason: "no_credits" as const };
    }

    const { swapped, schemaMissing } = await compareAndSwapCredit(
      userId,
      target.column,
      // A consumable balance is always a non-null positive number here.
      target.current,
      target.current - 1,
    );
    if (schemaMissing) {
      return { ok: false, reason: "credits_unavailable" as const };
    }
    if (swapped) {
      return { ok: true, used: target.used };
    }
    // Lost the race: another start consumed a credit first; re-read and retry.
  }

  return { ok: false, reason: "contention" as const };
};

export const grantEventCredits = async (
  userId: string,
  pricingType: EventCreditType,
  amount: number,
) => {
  if (isPaymentsUiOnly()) {
    // UI-only mode: don't touch the database yet.
    return { ok: true };
  }

  const column: CreditColumn =
    pricingType === "day"
      ? "paid_event_credits_day"
      : "paid_event_credits_weekend";

  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
    const { data, error } = await (supabase.from("users") as any)
      .select(`id, ${column}`)
      .eq("id", userId)
      .single();

    if (error) {
      if (isCreditsSchemaError(error)) {
        return { ok: false, reason: "credits_unavailable" as const };
      }
      throw error;
    }

    const rawValue = data?.[column];
    const expectedValue =
      rawValue === null || rawValue === undefined ? null : Number(rawValue);
    const current = expectedValue ?? 0;

    const { swapped, schemaMissing } = await compareAndSwapCredit(
      userId,
      column,
      expectedValue,
      current + amount,
    );
    if (schemaMissing) {
      return { ok: false, reason: "credits_unavailable" as const };
    }
    if (swapped) {
      return { ok: true };
    }
    // Lost the race: another grant landed first; re-read and retry so no
    // increment is lost.
  }

  return { ok: false, reason: "contention" as const };
};

export const getPricingTypeForStart = () => getEventPricingType(new Date());
