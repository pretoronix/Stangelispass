/**
 * Cost Calculator Utility
 * 
 * Handles all cost-related calculations for beer tracking.
 * All calculations use the event's configured beer_price.
 */

export const DEFAULT_BEER_PRICE = 5.00;

/**
 * Calculate the total cost for a specific user
 * @param beerCount - Number of beers logged by the user
 * @param eventPrice - Price per beer from the event (optional, defaults to 5.00)
 * @returns Total cost in CHF
 */
export function calculateUserCost(beerCount: number, eventPrice?: number): number {
    const price = eventPrice ?? DEFAULT_BEER_PRICE;
    if (beerCount < 0) return 0;
    if (price <= 0) return 0;
    return beerCount * price;
}

/**
 * Calculate costs for all users in a round
 * @param beerCounts - Array of objects with userId and count
 * @param eventPrice - Price per beer from the event (optional, defaults to 5.00)
 * @returns Map of userId to cost in CHF
 */
export function calculateRoundCosts(
    beerCounts: { id: string; count: number }[],
    eventPrice?: number
): Map<string, number> {
    const price = eventPrice ?? DEFAULT_BEER_PRICE;
    const costMap = new Map<string, number>();
    
    for (const { id, count } of beerCounts) {
        costMap.set(id, calculateUserCost(count, price));
    }
    
    return costMap;
}

/**
 * Calculate total bill for an event
 * @param totalBeers - Total number of beers logged in the event
 * @param eventPrice - Price per beer from the event (optional, defaults to 5.00)
 * @returns Total bill in CHF
 */
export function calculateTotalBill(totalBeers: number, eventPrice?: number): number {
    return calculateUserCost(totalBeers, eventPrice);
}

/**
 * Format a cost value for display
 * @param cost - Cost in CHF
 * @param includeSymbol - Whether to include "CHF" suffix (default: true)
 * @returns Formatted cost string
 */
export function formatCost(cost: number, includeSymbol: boolean = true): string {
    const formatted = cost.toFixed(2);
    return includeSymbol ? `${formatted} CHF` : formatted;
}
