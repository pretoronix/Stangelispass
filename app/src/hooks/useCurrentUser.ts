import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { User } from "@/services/types";
import { reportError } from "@/utils/logger";

const CURRENT_USER_KEY = "stangelispass_current_user";
const QUERY_KEY = ["currentUser"] as const;

async function loadSavedUser(): Promise<User | null> {
  try {
    let saved = null;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        saved = window.localStorage.getItem(CURRENT_USER_KEY);
      }
    } else {
      saved = await SecureStore.getItemAsync(CURRENT_USER_KEY);
    }

    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    reportError(e, { scope: "useCurrentUser", action: "load_user" });
    // Clean up potentially corrupt data
    if (Platform.OS === "web") {
      window.localStorage.removeItem(CURRENT_USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(CURRENT_USER_KEY).catch(() => {});
    }
  }
  return null;
}

async function saveUserToStorage(user: User | null): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        if (user) {
          window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        } else {
          window.localStorage.removeItem(CURRENT_USER_KEY);
        }
      }
      return;
    }
    if (user) {
      await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync(CURRENT_USER_KEY);
    }
  } catch (e) {
    reportError(e, { scope: "useCurrentUser", action: "save_user" });
    throw e;
  }
}

/**
 * Hook to manage current user persistence via React Query
 */
export function useCurrentUser() {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: loadSavedUser,
    staleTime: Infinity, // The current user selection is manual/stable
  });

  const setUserMutation = useMutation({
    mutationFn: saveUserToStorage,
    onSuccess: (_, newUser) => {
      queryClient.setQueryData(QUERY_KEY, newUser);
    },
  });

  return {
    currentUser: userQuery.data ?? null,
    setCurrentUser: setUserMutation.mutateAsync,
    loading: userQuery.isLoading,
    isAdmin: userQuery.data?.is_admin || false,
  };
}
