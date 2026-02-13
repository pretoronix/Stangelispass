export const MILESTONES = [5, 10, 20] as const;

export const PASS_TYPES = ['free', 'standard', 'weekend'] as const;

export const GENDERS = ['male', 'female', 'neutral'] as const;

export type PassType = typeof PASS_TYPES[number];
export type Gender = typeof GENDERS[number];
