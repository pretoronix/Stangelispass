import { User } from "./types";
import {
  ALCOHOL_GRAMS_PER_STANDARD_BEER,
  ELIMINATION_PER_MILLE_PER_HOUR,
  bacPerMille,
} from "@/utils/bacCore";

/**
 * Widmark-based BAC estimation, expressed in per mille (‰).
 *
 * The underlying formula and physiological constants live in `utils/bacCore`,
 * shared with the profile BAC card (which renders the same estimate in %).
 */

export interface BACStats {
  bac: number;
  canDrive: boolean;
  clearInHours: number;
}

// Swiss legal driving limit (‰).
const LEGAL_LIMIT_PER_MILLE = 0.5;

export const estimateBAC = (
  beerCount: number,
  startTime: Date,
  user: User | null,
): BACStats => {
  if (!user || beerCount === 0)
    return { bac: 0, canDrive: true, clearInHours: 0 };

  const weight = user.physiology?.weight_kg || 75;
  const alcoholGrams = beerCount * ALCOHOL_GRAMS_PER_STANDARD_BEER;

  const now = new Date();
  const hoursSinceStart =
    (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  const bac = bacPerMille(
    alcoholGrams,
    weight,
    user.physiology?.gender,
    hoursSinceStart,
  );

  return {
    bac: Number(bac.toFixed(2)),
    canDrive: bac < LEGAL_LIMIT_PER_MILLE,
    clearInHours: Number((bac / ELIMINATION_PER_MILLE_PER_HOUR).toFixed(1)),
  };
};
