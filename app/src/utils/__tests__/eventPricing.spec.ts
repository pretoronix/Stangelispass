import { getEventPricingType, getEventPriceCHF } from "@/utils/eventPricing";

describe("eventPricing", () => {
  it("returns weekend pricing on Saturday", () => {
    const date = new Date("2026-02-14T12:00:00Z"); // Saturday
    expect(getEventPricingType(date)).toBe("weekend");
    expect(getEventPriceCHF(date)).toBe(15);
  });

  it("returns day pricing on Tuesday", () => {
    const date = new Date("2026-02-10T12:00:00Z"); // Tuesday
    expect(getEventPricingType(date)).toBe("day");
    expect(getEventPriceCHF(date)).toBe(10);
  });
});
