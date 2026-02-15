import {
  assertSupabaseConfigured,
  warnIfWebUnsupported,
} from "@/utils/preflight";

jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

describe("preflight", () => {
  test("assertSupabaseConfigured returns false when missing", () => {
    const ok = assertSupabaseConfigured({ url: "", anonKey: "" });
    expect(ok).toBe(false);
  });

  test("assertSupabaseConfigured returns true when present", () => {
    const ok = assertSupabaseConfigured({
      url: "https://example.supabase.co",
      anonKey: "anon",
    });
    expect(ok).toBe(true);
  });

  test("assertSupabaseConfigured reads from process.env", () => {
    const originalProcess = (global as any).process;
    if (!(global as any).process) {
      (global as any).process = { env: {} };
    }
    if (!(global as any).process.env) {
      (global as any).process.env = {};
    }
    const originalEnv = { ...(global as any).process.env };
    const original = (global as any).process.env.EXPO_PUBLIC_SUPABASE_URL;
    const originalKey = (global as any).process.env
      .EXPO_PUBLIC_SUPABASE_ANON_KEY;
    (global as any).process.env.EXPO_PUBLIC_SUPABASE_URL =
      "https://env.supabase.co";
    (global as any).process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "env-key";
    const ok = assertSupabaseConfigured();
    expect(ok).toBe(true);
    (global as any).process.env.EXPO_PUBLIC_SUPABASE_URL = original;
    (global as any).process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    (global as any).process.env = originalEnv;
    (global as any).process = originalProcess;
  });

  test("warnIfWebUnsupported returns true on native", () => {
    const ok = warnIfWebUnsupported("share");
    expect(ok).toBe(true);
  });

  test("warnIfWebUnsupported returns false on web", () => {
    const { Platform } = require("react-native");
    const original = Platform.OS;
    Platform.OS = "web";
    const ok = warnIfWebUnsupported("share");
    expect(ok).toBe(false);
    Platform.OS = original;
  });

  test("assertSupabaseConfigured throws with scope/action in production", () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = "production";
    try {
      expect(() => assertSupabaseConfigured({ url: "", anonKey: "" })).toThrow(
        "preflight:supabase_config",
      );
      try {
        assertSupabaseConfigured({ url: "", anonKey: "" });
      } catch (error: any) {
        expect(error.scope).toBe("preflight");
        expect(error.action).toBe("supabase_config");
      }
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });

  test("warnIfWebUnsupported logs once per feature", () => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.doMock("react-native", () => ({
      Platform: { OS: "web" },
    }));
    const { warnIfWebUnsupported: warnOnce } = require("@/utils/preflight");
    const { logWarn } = require("@/utils/logger");
    warnOnce("share");
    warnOnce("share");
    expect(logWarn).toHaveBeenCalledTimes(1);
  });
});
