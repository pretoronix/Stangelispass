/**
 * Shared Widmark BAC core.
 *
 * Single source of truth for the physiological constants and elimination math
 * used by both the home-screen safety estimate (`services/safety.ts`, which
 * works in per mille / ‰) and the profile BAC card (`utils/bacCalculator.ts`,
 * which works in percent / %). 1‰ = 0.1%, so the two only differ by unit.
 */

export const ALCOHOL_GRAMS_PER_STANDARD_BEER = 13; // ~330ml @ 5% ABV
export const ELIMINATION_PER_MILLE_PER_HOUR = 0.15;

// Widmark distribution ratio (r) by gender. Male/female are well established;
// anything else (neutral / other / unknown) shares an averaged default.
const DISTRIBUTION_RATIO: Record<string, number> = {
  male: 0.68,
  female: 0.55,
};
const DEFAULT_DISTRIBUTION_RATIO = 0.6;

export const distributionRatioFor = (gender?: string | null): number =>
  (gender ? DISTRIBUTION_RATIO[gender] : undefined) ??
  DEFAULT_DISTRIBUTION_RATIO;

/**
 * Core Widmark estimate in per mille (‰):
 *   BAC(‰) = alcoholGrams / (weightKg * r) - elimination * hoursSinceStart
 * Clamped at 0, and returns 0 for non-positive weight or no alcohol. Negative
 * elapsed time (e.g. clock skew) is treated as 0 so it can never inflate the
 * estimate.
 */
export const bacPerMille = (
  alcoholGrams: number,
  weightKg: number,
  gender: string | null | undefined,
  hoursSinceStart: number,
): number => {
  if (weightKg <= 0 || alcoholGrams <= 0) return 0;
  const r = distributionRatioFor(gender);
  const eliminated =
    ELIMINATION_PER_MILLE_PER_HOUR * Math.max(0, hoursSinceStart);
  const raw = alcoholGrams / (weightKg * r) - eliminated;
  return Math.max(0, raw);
};
