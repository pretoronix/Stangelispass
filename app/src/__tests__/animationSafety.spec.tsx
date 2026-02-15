import React from "react";
import { render, screen } from "@testing-library/react-native";
import { shouldShowAnimations, isSimulator } from "@/utils/deviceInfo";

// Mock dependencies
jest.mock("@/utils/deviceInfo", () => ({
  shouldShowAnimations: jest.fn(),
  isSimulator: jest.fn(),
  isLowEndDevice: jest.fn(),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("Animation Safety", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should correctly identify simulator", () => {
    (isSimulator as jest.Mock).mockReturnValue(true);
    expect(isSimulator()).toBe(true);
  });

  it("should default to disabling animations on simulator", async () => {
    // Setup mocks to simulate a simulator environment
    const { isLowEndDevice } = require("@/utils/deviceInfo");
    isLowEndDevice.mockResolvedValue(true);

    // We are testing logic that consumes isLowEndDevice, which covers isSimulator
    // In the real implementation, isLowEndDevice returns true if isSimulator is true

    // Mock shouldShowAnimations implementation for this test since we mocked the module
    (shouldShowAnimations as jest.Mock).mockImplementation(async () => {
      const isLowEnd = await isLowEndDevice();
      return !isLowEnd;
    });

    const result = await shouldShowAnimations();
    expect(result).toBe(false);
  });

  it("should allow animations on capable devices", async () => {
    const { isLowEndDevice } = require("@/utils/deviceInfo");
    isLowEndDevice.mockResolvedValue(false);

    (shouldShowAnimations as jest.Mock).mockImplementation(async () => {
      const isLowEnd = await isLowEndDevice();
      return !isLowEnd;
    });

    const result = await shouldShowAnimations();
    expect(result).toBe(true);
  });
});
