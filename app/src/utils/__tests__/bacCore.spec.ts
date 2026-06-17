import {
  ALCOHOL_GRAMS_PER_STANDARD_BEER,
  ELIMINATION_PER_MILLE_PER_HOUR,
  bacPerMille,
  distributionRatioFor,
} from "@/utils/bacCore";

describe("utils/bacCore", () => {
  describe("distributionRatioFor", () => {
    test("uses well-known ratios for male/female", () => {
      expect(distributionRatioFor("male")).toBe(0.68);
      expect(distributionRatioFor("female")).toBe(0.55);
    });

    test("falls back to the averaged default for neutral/other/unknown", () => {
      expect(distributionRatioFor("neutral")).toBe(0.6);
      expect(distributionRatioFor("other")).toBe(0.6);
      expect(distributionRatioFor("nonbinary")).toBe(0.6);
      expect(distributionRatioFor(undefined)).toBe(0.6);
      expect(distributionRatioFor(null)).toBe(0.6);
    });
  });

  describe("bacPerMille", () => {
    test("applies the Widmark formula at t=0", () => {
      // 4 beers * 13g = 52g; weight 80kg, r 0.68 -> 52 / 54.4 = ~0.956‰
      const grams = 4 * ALCOHOL_GRAMS_PER_STANDARD_BEER;
      expect(bacPerMille(grams, 80, "male", 0)).toBeCloseTo(0.956, 2);
    });

    test("subtracts elimination over time", () => {
      const grams = 4 * ALCOHOL_GRAMS_PER_STANDARD_BEER;
      const atZero = bacPerMille(grams, 80, "male", 0);
      const atTwoHours = bacPerMille(grams, 80, "male", 2);
      expect(atTwoHours).toBeCloseTo(
        atZero - ELIMINATION_PER_MILLE_PER_HOUR * 2,
        5,
      );
    });

    test("never returns a negative BAC", () => {
      // Tiny dose, long elapsed time -> fully eliminated.
      expect(bacPerMille(13, 80, "male", 100)).toBe(0);
    });

    test("treats negative elapsed time as zero (no inflation from clock skew)", () => {
      const grams = 2 * ALCOHOL_GRAMS_PER_STANDARD_BEER;
      expect(bacPerMille(grams, 80, "male", -5)).toBe(
        bacPerMille(grams, 80, "male", 0),
      );
    });

    test("returns 0 for non-positive weight or no alcohol", () => {
      expect(bacPerMille(52, 0, "male", 0)).toBe(0);
      expect(bacPerMille(52, -10, "male", 0)).toBe(0);
      expect(bacPerMille(0, 80, "male", 0)).toBe(0);
    });

    test("lighter people reach a higher BAC for the same dose", () => {
      const grams = 2 * ALCOHOL_GRAMS_PER_STANDARD_BEER;
      expect(bacPerMille(grams, 60, "male", 0)).toBeGreaterThan(
        bacPerMille(grams, 90, "male", 0),
      );
    });
  });
});
