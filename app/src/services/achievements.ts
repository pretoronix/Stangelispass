import type { Beer, BadgeType } from './types';
export type { BadgeType } from './types';

export interface Badge {
    id: BadgeType;
    name: string;
    description: string;
    icon: string; // Icon name from Ionicons or custom
    color: string;
}

export const BADGES: Record<BadgeType, Badge> = {
    hat_trick: {
        id: 'hat_trick',
        name: 'Hat Trick',
        description: 'Drank 3 beers in under 1 hour.',
        icon: 'speedometer',
        color: '#FFD700', // Gold
    },
    early_bird: {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Logged a beer before 6:00 PM.',
        icon: 'sunny',
        color: '#FFA500', // Orange
    },
    night_owl: {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Logged a beer after 2:00 AM.',
        icon: 'moon',
        color: '#8A2BE2', // BlueViolet
    },
    century_club: {
        id: 'century_club',
        name: 'Century Club',
        description: 'Logged 100 lifetime beers.',
        icon: 'trophy',
        color: '#C0C0C0', // Silver
    },
    first_blood: {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Started the round with the first beer.',
        icon: 'water',
        color: '#FF4500', // RedOrange
    },
    weekend_warrior: {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Logged a beer on a Friday or Saturday.',
        icon: 'calendar',
        color: '#32CD32', // LimeGreen
    },
};

export const checkAchievements = (currentBeers: Beer[], newBeer: Beer, totalLifetimeBeers: number): BadgeType[] => {
    const unlocked: BadgeType[] = [];
    const now = new Date(newBeer.created_at);

    // 1. Early Bird (Before 18:00)
    if (now.getHours() < 18 && now.getHours() >= 6) {
        unlocked.push('early_bird');
    }

    // 2. Night Owl (After 02:00)
    if (now.getHours() >= 2 && now.getHours() < 6) {
        unlocked.push('night_owl');
    }

    // 3. Weekend Warrior (Fri/Sat)
    const day = now.getDay();
    if (day === 5 || day === 6) {
        unlocked.push('weekend_warrior');
    }

    // 4. Century Club
    // Assuming totalLifetimeBeers includes the new one
    if (totalLifetimeBeers === 100) {
        unlocked.push('century_club');
    }

    // 5. Hat Trick (3 beers in < 1 hr)
    // Filter beers by this user
    const userBeers = currentBeers.filter(b => b.user_id === newBeer.user_id);
    // Sort by time descending (newest first)
    // We need to parse dates safely
    const sortedBeers = [...userBeers, newBeer].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (sortedBeers.length >= 3) {
        const b1 = sortedBeers[0];
        const b3 = sortedBeers[2];

        if (b1 && b3) {
            const latest = new Date(b1.created_at).getTime();
            const thirdLatest = new Date(b3.created_at).getTime();
            const diffHours = (latest - thirdLatest) / (1000 * 60 * 60);

            if (diffHours <= 1) {
                unlocked.push('hat_trick');
            }
        }
    }

    // 6. First Blood (First in event)
    if (currentBeers.length === 0) {
        unlocked.push('first_blood');
    }

    return unlocked.filter((v, i, a) => a.indexOf(v) === i); // Dedup without Set/spread
};
