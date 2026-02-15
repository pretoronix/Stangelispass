/**
 * Cost Calculator Tests
 */

import {
  calculateUserCost,
  calculateRoundCosts,
  calculateTotalBill,
  formatCost,
  DEFAULT_BEER_PRICE,
} from "../utils/costCalculator";

describe("Cost Calculator", () => {
  describe("calculateUserCost", () => {
    test("calculates cost with default price", () => {
      expect(calculateUserCost(10)).toBe(50.0);
      expect(calculateUserCost(0)).toBe(0);
      expect(calculateUserCost(1)).toBe(5.0);
    });

    test("calculates cost with custom price", () => {
      expect(calculateUserCost(10, 6.5)).toBe(65.0);
      expect(calculateUserCost(5, 4.0)).toBe(20.0);
    });

    test("handles edge cases", () => {
      expect(calculateUserCost(-5, 5.0)).toBe(0); // Negative beers
      expect(calculateUserCost(10, 0)).toBe(0); // Zero price
      expect(calculateUserCost(10, -5)).toBe(0); // Negative price
      expect(calculateUserCost(0, 10.0)).toBe(0); // Zero beers
    });

    test("uses default price when eventPrice is undefined", () => {
      expect(calculateUserCost(10, undefined)).toBe(50.0);
    });
  });

  describe("calculateRoundCosts", () => {
    test("calculates costs for multiple users with default price", () => {
      const beerCounts = [
        { id: "user1", count: 10 },
        { id: "user2", count: 5 },
        { id: "user3", count: 0 },
      ];

      const costs = calculateRoundCosts(beerCounts);

      expect(costs.get("user1")).toBe(50.0);
      expect(costs.get("user2")).toBe(25.0);
      expect(costs.get("user3")).toBe(0);
    });

    test("calculates costs for multiple users with custom price", () => {
      const beerCounts = [
        { id: "user1", count: 10 },
        { id: "user2", count: 5 },
      ];

      const costs = calculateRoundCosts(beerCounts, 7.0);

      expect(costs.get("user1")).toBe(70.0);
      expect(costs.get("user2")).toBe(35.0);
    });

    test("handles empty beer counts", () => {
      const costs = calculateRoundCosts([]);
      expect(costs.size).toBe(0);
    });
  });

  describe("calculateTotalBill", () => {
    test("calculates total bill with default price", () => {
      expect(calculateTotalBill(15)).toBe(75.0);
      expect(calculateTotalBill(0)).toBe(0);
    });

    test("calculates total bill with custom price", () => {
      expect(calculateTotalBill(20, 6.0)).toBe(120.0);
      expect(calculateTotalBill(10, 4.5)).toBe(45.0);
    });
  });

  describe("formatCost", () => {
    test("formats cost with CHF symbol by default", () => {
      expect(formatCost(50.0)).toBe("50.00 CHF");
      expect(formatCost(123.456)).toBe("123.46 CHF");
      expect(formatCost(0)).toBe("0.00 CHF");
    });

    test("formats cost without CHF symbol when specified", () => {
      expect(formatCost(50.0, false)).toBe("50.00");
      expect(formatCost(123.456, false)).toBe("123.46");
    });

    test("rounds to 2 decimal places", () => {
      expect(formatCost(10.123)).toBe("10.12 CHF");
      expect(formatCost(10.126)).toBe("10.13 CHF");
    });
  });

  describe("DEFAULT_BEER_PRICE", () => {
    test("is set to 5.00", () => {
      expect(DEFAULT_BEER_PRICE).toBe(5.0);
    });
  });
});
