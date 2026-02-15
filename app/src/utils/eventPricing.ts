export type EventPricingType = "day" | "weekend";

export const EVENT_PRICES_CHF: Record<EventPricingType, number> = {
  day: 10,
  weekend: 15,
};

export const getEventPricingType = (
  date: Date = new Date(),
): EventPricingType => {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 5 || day === 6;
  return isWeekend ? "weekend" : "day";
};

export const getEventPriceCHF = (date: Date = new Date()): number => {
  return EVENT_PRICES_CHF[getEventPricingType(date)];
};
