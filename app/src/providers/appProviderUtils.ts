import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { Event, User } from "@/services/supabase";

export const CURRENT_USER_KEY = "stangelispass_current_user";
const DAY_MS = 24 * 60 * 60 * 1000;
const PASS_DURATION_MS: Record<Event["pass_type"], number> = {
  free: DAY_MS,
  day: DAY_MS,
  week: DAY_MS * 3,
  year: DAY_MS * 365,
};

export const getPassExpiresAt = (passType: Event["pass_type"]) =>
  new Date(Date.now() + PASS_DURATION_MS[passType]).toISOString();

export const buildLocalEvent = (): Event => ({
  id: "local",
  name: "Local Round",
  created_by: "local",
  is_active: true,
  pass_type: "free",
  expires_at: getPassExpiresAt("free"),
  created_at: new Date().toISOString(),
});

export const readStoredUser = async (): Promise<string | null> => {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(CURRENT_USER_KEY);
  }
  return SecureStore.getItemAsync(CURRENT_USER_KEY);
};

export const clearStoredUser = async () => {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CURRENT_USER_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(CURRENT_USER_KEY);
};

export const persistStoredUser = async (user: User | null) => {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return;
    if (user)
      window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(CURRENT_USER_KEY);
    return;
  }
  if (user) {
    await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    await SecureStore.deleteItemAsync(CURRENT_USER_KEY);
  }
};
