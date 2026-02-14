import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PASS_TYPE_DURATIONS_DAYS, PASS_TYPE_PRICES_CHF } from '@/utils/settings/settingsConstants';
import type { Event } from '@/services/supabase';

interface BeerCount {
    userId: string;
    name: string;
    count: number;
}

/**
 * Randomly selects who pays for the round
 */
export function selectRandomPayer(beerCounts: BeerCount[]): void {
    if (beerCounts.length === 0) {
        Alert.alert('Who Pays?', 'Nobody has logged any beers yet!');
        return;
    }
    const randomIndex = Math.floor(Math.random() * beerCounts.length);
    const selected = beerCounts[randomIndex];

    if (!selected) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    Alert.alert(
        '🍻 The Round is On...',
        `${selected.name}! \n\nGet ready to open that wallet.`,
        [{ text: 'Prost!' }]
    );
}

/**
 * Calculates the total bill for an event
 */
export function calculateBill(totalBeers: number, beerPrice: number): number {
    return totalBeers * beerPrice;
}

export function getStartRoundPriceLabel(): string {
    return `CHF ${PASS_TYPE_PRICES_CHF.day.toFixed(2)}`;
}

export function getEventDurationLabel(passType?: Event['pass_type']): string {
    if (!passType) return 'Active';
    const normalized = passType === 'free' ? 'day' : passType;
    const days = PASS_TYPE_DURATIONS_DAYS[normalized];
    const dayLabel = days === 1 ? '1 day' : `${days} days`;
    return `Active for ${dayLabel}`;
}
