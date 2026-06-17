import { calculateBAC, formatBAC, getBACEffect } from "@/utils/bacCalculator";
import { bacPerMille } from "@/utils/bacCore";

const isoMinutesAgo = (mins: number) =>
  new Date(Date.now() - mins * 60 * 1000).toISOString();

describe("utils/bacCalculator", () => {
  describe("calculateBAC", () => {
    test("returns 0 with no beers or non-positive weight", () => {
      expect(calculateBAC(80, "male", [])).toBe(0);
      expect(calculateBAC(0, "male", [isoMinutesAgo(0)])).toBe(0);
    });

    test("returns the per-mille core estimate scaled to percent (1‰ = 0.1%)", () => {
      // Four beers logged "now" so elapsed time is ~0.
      const timestamps = [0, 0, 0, 0].map(() => isoMinutesAgo(0));
      const percent = calculateBAC(80, "male", timestamps);
      // 4 beers * 13g, 80kg, r=0.68 -> ~0.956‰ -> ~0.0956%
      expect(percent).toBeCloseTo(0.0956, 3);
    });

    test("matches the safety module's per-mille value divided by ten", () => {
      const start = isoMinutesAgo(60);
      const timestamps = [start, isoMinutesAgo(30), isoMinutesAgo(10)];
      const hours = 1; // first beer one hour ago
      const grams = timestamps.length * 13;
      const expectedPerMille = bacPerMille(grams, 75, "neutral", hours);
      const percent = calculateBAC(75, "neutral", timestamps);
      expect(percent).toBeCloseTo(expectedPerMille * 0.1, 4);
    });

    test("uses the first (earliest) timestamp as the start regardless of order", () => {
      const ordered = calculateBAC(80, "male", [
        isoMinutesAgo(120),
        isoMinutesAgo(10),
      ]);
      const shuffled = calculateBAC(80, "male", [
        isoMinutesAgo(10),
        isoMinutesAgo(120),
      ]);
      expect(ordered).toBeCloseTo(shuffled, 6);
    });
  });

  describe("formatBAC", () => {
    test("renders three decimal places with a percent sign", () => {
      expect(formatBAC(0.0956)).toBe("0.096%");
      expect(formatBAC(0)).toBe("0.000%");
    });
  });

  describe("getBACEffect", () => {
    test("maps BAC ranges to human-readable effects", () => {
      expect(getBACEffect(0)).toBe("Sober");
      expect(getBACEffect(-1)).toBe("Sober");
      expect(getBACEffect(0.02)).toBe("Slight mood lift");
      expect(getBACEffect(0.05)).toBe("Feeling buzzed");
      expect(getBACEffect(0.08)).toBe("Talkative & relaxed");
      expect(getBACEffect(0.1)).toBe("Significant impairment");
      expect(getBACEffect(0.13)).toBe("Very drunk");
      expect(getBACEffect(0.2)).toBe("Blackout territory");
    });
  });
});
