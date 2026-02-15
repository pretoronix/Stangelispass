export const MILESTONES = [5, 10, 20] as const;

// Pass types available when starting a new event
export const PASS_TYPES = ["day", "week"] as const;
export type PassType = (typeof PASS_TYPES)[number];

// All known event pass types (including legacy types that may exist in the database)
export const EVENT_PASS_TYPES = ["day", "week", "year"] as const;
export type EventPassType = (typeof EVENT_PASS_TYPES)[number];

export const PASS_TYPE_LABELS: Record<PassType, string> = {
  day: "Single Event",
  week: "Weekend",
};

export const PASS_TYPE_PRICES_CHF: Record<PassType, number> = {
  day: 10,
  week: 15,
};

export const PASS_TYPE_DURATIONS_DAYS: Record<PassType, number> = {
  day: 1,
  week: 3,
};

export const EVENT_PASS_TYPE_DURATIONS_DAYS: Record<EventPassType, number> = {
  day: 1,
  week: 3,
  year: 365,
};

export const GENDERS = ["male", "female", "neutral"] as const;
export type Gender = (typeof GENDERS)[number];
