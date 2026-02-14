export const MILESTONES = [5, 10, 20] as const;

export const PASS_TYPES = ['day', 'week', 'year'] as const;
export type PassType = typeof PASS_TYPES[number];

export const PASS_TYPE_LABELS: Record<PassType, string> = {
    day: 'Day Pass',
    week: 'Week Pass',
    year: 'Year Pass',
};

export const PASS_TYPE_PRICES_CHF: Record<PassType, number> = {
    day: 0.99,
    week: 2.99,
    year: 19.99,
};

export const PASS_TYPE_DURATIONS_DAYS: Record<PassType, number> = {
    day: 1,
    week: 7,
    year: 365,
};

export const GENDERS = ['male', 'female', 'neutral'] as const;
export type Gender = typeof GENDERS[number];
