import { User } from './types';

/**
 * Widmark Formula based BAC estimation
 * BAC (‰) = [Alcohol consumed (g) / (Body weight (kg) * r)] - (β * time)
 * r (gender constant): male = 0.68, female = 0.55
 * β (metabolism constant): ~0.15 ‰ per hour
 */

const GENDER_CONSTANTS = {
    male: 0.68,
    female: 0.55,
    other: 0.61, // Average
};

const METABOLISM_RATE = 0.015; // 0.15 ‰ per hour -> 0.015 % per hour? No, usually 0.1-0.2 ‰.
// Let's use 0.15 ‰/hour which is 0.015 %/hour.

export interface BACStats {
    bac: number;
    canDrive: boolean;
    clearInHours: number;
}

export const estimateBAC = (
    beerCount: number,
    startTime: Date,
    user: User | null
): BACStats => {
    if (!user || beerCount === 0) return { bac: 0, canDrive: true, clearInHours: 0 };

    const weight = user.physiology?.weight_kg || 75;
    const r = GENDER_CONSTANTS[user.physiology?.gender as keyof typeof GENDER_CONSTANTS] || 0.61;

    // Standard beer (0.33l, 5%) = ~13g alcohol
    const alcoholGrams = beerCount * 13;

    const now = new Date();
    const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    // Simple Widmark
    let bac = (alcoholGrams / (weight * r)) - (0.15 * hoursSinceStart);
    bac = Math.max(0, bac);

    return {
        bac: Number(bac.toFixed(2)),
        canDrive: bac < 0.5, // 0.5 ‰ limit
        clearInHours: Number((bac / 0.15).toFixed(1)),
    };
};
