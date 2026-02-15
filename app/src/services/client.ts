import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import Constants from "expo-constants";
import { assertSupabaseConfigured } from "@/utils/preflight";
import { logWarn } from "@/utils/logger";
import { ExpoSecureStoreAdapter } from "./storage";

/**
 * Supabase client initialization
 * Centralizes client creation and configuration
 */

let SUPABASE_URL = "";
let SUPABASE_ANON_KEY = "";

try {
  if (typeof process !== "undefined" && process.env) {
    SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
    SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
  }
} catch (e) {
  SUPABASE_URL = "";
  SUPABASE_ANON_KEY = "";
}

// Fallback to Expo Constants (app config) when available
try {
  const extras =
    (Constants &&
      (Constants as any).expoConfig &&
      (Constants as any).expoConfig.extra) ||
    {};
  SUPABASE_URL =
    SUPABASE_URL || extras.supabaseUrl || extras.EXPO_PUBLIC_SUPABASE_URL || "";
  SUPABASE_ANON_KEY =
    SUPABASE_ANON_KEY ||
    extras.supabaseAnonKey ||
    extras.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    "";
} catch (e) {
  // ignore
}

// Create a noop client for offline/unconfigured scenarios
function createNoopClient() {
  const noopResult = { data: null, error: null, count: 0 };

  const makeBuilder = () => {
    const builder: any = {
      select: (..._args: any[]) => builder,
      insert: (..._args: any[]) => builder,
      upsert: (..._args: any[]) => builder,
      update: (..._args: any[]) => builder,
      delete: (..._args: any[]) => builder,
      eq: (..._args: any[]) => builder,
      neq: (..._args: any[]) => builder,
      is: (..._args: any[]) => builder,
      match: (..._args: any[]) => builder,
      filter: (..._args: any[]) => builder,
      order: (..._args: any[]) => builder,
      limit: (..._args: any[]) => builder,
      maybeSingle: () => builder,
      single: () => builder,
      then: (resolve: any) => Promise.resolve(noopResult).then(resolve),
      catch: (reject: any) => Promise.resolve(noopResult).catch(reject),
    };
    return builder;
  };

  return {
    auth: {
      getSession: async () => ({ data: null, error: null }),
      onAuthStateChange: () => ({ data: null }),
    },
    from: (_: string) => makeBuilder(),
    channel: (_: string) => ({
      on: () => ({
        subscribe: () => ({
          unsubscribe: () => {},
        }),
      }),
    }),
    removeChannel: () => {},
  } as any;
}

let supabaseClient: any;
let supabaseOk = false;

try {
  supabaseOk = assertSupabaseConfigured({
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  });
  if (!supabaseOk) throw new Error("No SUPABASE_URL");
  supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} catch (e) {
  const errorMessage = (e && (e as any).message) || e;
  if (process.env.NODE_ENV === "production") {
    logWarn("Supabase not configured; aborting init", {
      scope: "supabase",
      action: "init",
      metadata: { error: errorMessage },
    });
    throw e;
  }
  logWarn("Supabase not configured; using noop client", {
    scope: "supabase",
    action: "init",
    metadata: { error: errorMessage },
  });
  supabaseClient = createNoopClient();
}

export const supabase = supabaseClient as unknown as SupabaseClient<Database>;
export const isSupabaseConfigured = supabaseOk;
