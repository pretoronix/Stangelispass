import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { reportError } from "@/utils/logger";

import {
  isLowEndDevice,
  shouldShowAnimations,
  setAnimationPreference,
  isSimulator,
  hasNativeHaptics,
} from "@/utils/deviceInfo";

describe("deviceInfo (utils)", () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Default to a non-web platform for most tests.
    Object.defineProperty(Platform, "OS", { value: "ios" });

    Object.defineProperty(Device, "deviceYearClass", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(Device, "totalMemory", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(Device, "isDevice", {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { value: originalOS });
  });

  it("isLowEndDevice returns false on web", async () => {
    Object.defineProperty(Platform, "OS", { value: "web" });
    await expect(isLowEndDevice()).resolves.toBe(false);
  });

  it("isSimulator reflects Device.isDevice", () => {
    Object.defineProperty(Device, "isDevice", {
      value: false,
      configurable: true,
    });
    Object.defineProperty(Platform, "OS", { value: "ios" });
    expect(isSimulator()).toBe(true);
  });

  it("hasNativeHaptics returns false on web", async () => {
    Object.defineProperty(Platform, "OS", { value: "web" });
    await expect(hasNativeHaptics()).resolves.toBe(false);
  });

  it("isLowEndDevice returns true for old devices by year class", async () => {
    Object.defineProperty(Device, "deviceYearClass", {
      value: 2019,
      configurable: true,
    });
    await expect(isLowEndDevice()).resolves.toBe(true);
  });

  it("isLowEndDevice returns true for low-memory devices", async () => {
    Object.defineProperty(Device, "totalMemory", {
      value: 2 * 1024 * 1024 * 1024,
      configurable: true,
    });
    await expect(isLowEndDevice()).resolves.toBe(true);
  });

  it("isLowEndDevice returns false when device capability is unknown", async () => {
    await expect(isLowEndDevice()).resolves.toBe(false);
  });

  it("isLowEndDevice returns false and reports on unexpected errors", async () => {
    Object.defineProperty(Device, "deviceYearClass", {
      get() {
        throw new Error("boom");
      },
      configurable: true,
    });

    await expect(isLowEndDevice()).resolves.toBe(false);
    expect(reportError).toHaveBeenCalled();
  });

  it("shouldShowAnimations respects explicit user preference (false/true)", async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce("false")
      .mockResolvedValueOnce("true");

    await expect(shouldShowAnimations()).resolves.toBe(false);
    await expect(shouldShowAnimations()).resolves.toBe(true);
  });

  it("shouldShowAnimations falls back to device capability when unset", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    Object.defineProperty(Device, "deviceYearClass", {
      value: 2019,
      configurable: true,
    });

    await expect(shouldShowAnimations()).resolves.toBe(false);

    Object.defineProperty(Device, "deviceYearClass", {
      value: 2022,
      configurable: true,
    });
    await expect(shouldShowAnimations()).resolves.toBe(true);
  });

  it("shouldShowAnimations defaults to true on storage errors", async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue("fail");
    await expect(shouldShowAnimations()).resolves.toBe(true);
    expect(reportError).toHaveBeenCalled();
  });

  it("setAnimationPreference stores the preference and reports on failure", async () => {
    await setAnimationPreference(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "enable_pour_animation",
      "true",
    );

    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error("nope"),
    );
    await setAnimationPreference(false);
    expect(reportError).toHaveBeenCalled();
  });
});
