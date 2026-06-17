/**
 * BAC Calculation using the Widmark Formula, expressed as a percentage (%).
 *
 * The formula and physiological constants live in `./bacCore` (which works in
 * per mille); this module is a thin percent-facing wrapper. 1‰ = 0.1%.
 */

import { ALCOHOL_GRAMS_PER_STANDARD_BEER, bacPerMille } from "./bacCore";

export type Gender = "male" | "female" | "neutral";

/**
 * Calculates current BAC
 * @param weightKg Body weight in kg
 * @param gender Gender for distribution ratio
 * @param beerTimestamps List of beer timestamps (assumes 0.33l / 5% per beer)
 * @returns Estimated BAC percentage
 */
export const calculateBAC = (
  weightKg: number,
  gender: Gender,
  beerTimestamps: string[],
): number => {
  if (!beerTimestamps.length || weightKg <= 0) return 0;

  const now = new Date();
  const sortedBeers = [...beerTimestamps].sort();
  const firstBeerTime = new Date(sortedBeers[0] || now.toISOString());
  const hoursSinceStart =
    (now.getTime() - firstBeerTime.getTime()) / (1000 * 60 * 60);

  const totalAlcoholG = beerTimestamps.length * ALCOHOL_GRAMS_PER_STANDARD_BEER;

  // Core returns per mille (‰); convert to percent (1‰ = 0.1%).
  return bacPerMille(totalAlcoholG, weightKg, gender, hoursSinceStart) * 0.1;
};

/**
 * Formats BAC as a percentage string (e.g. "0.05%")
 */
export const formatBAC = (bac: number): string => {
  return bac.toFixed(3) + "%";
};

/**
 * Provides a text-based "Effect" description for a given BAC level
 */
export const getBACEffect = (bac: number): string => {
  if (bac <= 0) return "Sober";
  if (bac < 0.03) return "Slight mood lift";
  if (bac < 0.06) return "Feeling buzzed";
  if (bac < 0.09) return "Talkative & relaxed";
  if (bac < 0.12) return "Significant impairment";
  if (bac < 0.15) return "Very drunk";
  return "Blackout territory";
};
