import { colors, spacing, borderRadius } from "../lib/theme";

describe("Theme Configuration", () => {
  test("colors object contains essential semantic keys", () => {
    expect(colors).toHaveProperty("primary");
    expect(colors).toHaveProperty("background");
    expect(colors).toHaveProperty("surface");
  });

  test("spacing values are consistent", () => {
    expect(spacing.md).toBe(16);
    expect(spacing.lg).toBe(24);
  });

  test("borderRadius follows the design system", () => {
    expect(borderRadius.md).toBe(12);
    expect(borderRadius.lg).toBe(16);
  });
});
