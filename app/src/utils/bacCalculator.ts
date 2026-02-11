/**
 * BAC Calculation using the Widmark Formula
 * 
 * Formula: BAC = ([Alcohol in grams] / ([Body weight in grams] * r)) * 100 - (beta * T)
 */

export type Gender = 'male' | 'female' | 'neutral';

export interface BACConstants {
    r: number; // alcohol distribution ratio
    beta: number; // elimination rate (per hour)
}

const CONSTANTS: Record<Gender, BACConstants> = {
    male: { r: 0.68, beta: 0.015 },
    female: { r: 0.55, beta: 0.015 },
    neutral: { r: 0.6, beta: 0.015 },
};

/**
 * Calculates current BAC
 * @param weightKg Body weight in kg
 * @param gender Gender for distribution ratio
 * @param beers List of beer timestamps (assumes 0.33l / 5% per beer)
 * @returns Estimated BAC percentage
 */
export const calculateBAC = (
    weightKg: number,
    gender: Gender,
    beerTimestamps: string[]
): number => {
    if (!beerTimestamps.length || weightKg <= 0) return 0;

    const weightGrams = weightKg * 1000;
    const { r, beta } = CONSTANTS[gender] || CONSTANTS.neutral;

    // Standard Beer: 330ml * 5% ABV * 0.789 density = ~13g of alcohol
    const ALCOHOL_PER_BEER_G = 13.0;

    const now = new Date();
    const sortedBeers = [...beerTimestamps].sort();
    const firstBeerTime = new Date(sortedBeers[0] || now.toISOString());
    const hoursSinceStart = (now.getTime() - firstBeerTime.getTime()) / (1000 * 60 * 60);

    // Total theoretical alcohol if none was eliminated
    const totalAlcoholG = beerTimestamps.length * ALCOHOL_PER_BEER_G;

    // Theoretical BAC without elimination
    const theoreticalBAC = (totalAlcoholG / (weightGrams * r)) * 100;

    // Current BAC after elimination
    const currentBAC = theoreticalBAC - (beta * hoursSinceStart);

    return Math.max(0, currentBAC);
};

/**
 * Formats BAC as a percentage string (e.g. "0.05%")
 */
export const formatBAC = (bac: number): string => {
    return bac.toFixed(3) + '%';
};

/**
 * Provides a text-based "Effect" description for a given BAC level
 */
export const getBACEffect = (bac: number): string => {
    if (bac <= 0) return 'Sober';
    if (bac < 0.03) return 'Slight mood lift';
    if (bac < 0.06) return 'Feeling buzzed';
    if (bac < 0.09) return 'Talkative & relaxed';
    if (bac < 0.12) return 'Significant impairment';
    if (bac < 0.15) return 'Very drunk';
    return 'Blackout territory';
};
