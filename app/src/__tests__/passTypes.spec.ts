import {
  PASS_TYPES,
  PASS_TYPE_DURATIONS_DAYS,
  PASS_TYPE_LABELS,
  PASS_TYPE_PRICES_CHF,
} from "@/utils/settings/settingsConstants";

describe("pass type constants", () => {
  test("exposes the expected pass types", () => {
    expect(PASS_TYPES).toEqual(["day", "week"]);
  });

  test("provides labels for each pass type", () => {
    PASS_TYPES.forEach((type) => {
      expect(PASS_TYPE_LABELS[type]).toBeTruthy();
    });
  });

  test("provides pricing and duration for each pass type", () => {
    PASS_TYPES.forEach((type) => {
      expect(PASS_TYPE_PRICES_CHF[type]).toBeGreaterThan(0);
      expect(PASS_TYPE_DURATIONS_DAYS[type]).toBeGreaterThan(0);
    });
  });
});
