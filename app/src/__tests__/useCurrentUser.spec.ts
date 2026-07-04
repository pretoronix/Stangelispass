import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { reportError } from "@/utils/logger";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { User } from "@/services/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

let queryClient: QueryClient;

const CURRENT_USER_KEY = "stangelispass_current_user";
const QUERY_KEY = ["currentUser"] as const;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children,
  );

function setPlatformOS(os: "web" | "ios") {
  try {
    Object.defineProperty(Platform, "OS", { value: os });
  } catch {
    // Fallback for environments where OS is writable but not configurable.
    (Platform as any).OS = os;
  }
}

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
    if (Platform.OS === "web") {
      window.localStorage.removeItem(CURRENT_USER_KEY);
    } else {
      try {
        await SecureStore.deleteItemAsync(CURRENT_USER_KEY);
      } catch {
        // Ignore cleanup errors in tests
      }
    }
  }
  return null;
}

const mockUser = { id: "u1", name: "Alice", is_admin: true };

describe("useCurrentUser", () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    setPlatformOS("ios");
  });

  afterEach(() => {
    if (queryClient) queryClient.clear();
    setPlatformOS(originalOS as any);
  });

  it("loads/saves on web using localStorage", async () => {
    setPlatformOS("web");

    const storage = {
      getItem: jest.fn(() =>
        JSON.stringify({ id: "u1", name: "Alice", is_admin: true }),
      ),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    (global as any).window = { localStorage: storage };

    const savedUser = JSON.parse(
      storage.getItem(),
    ) as User;
    queryClient.setQueryData(QUERY_KEY, savedUser);

    const { result } = await renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentUser?.id).toBe("u1");
    expect(result.current.isAdmin).toBe(true);

    await act(async () => {
      await result.current.setCurrentUser({
        id: "u2",
        name: "Bob",
        is_admin: false,
      } as any);
    });
    expect(storage.setItem).toHaveBeenCalled();

    await act(async () => {
      await result.current.setCurrentUser(null);
    });
    expect(storage.removeItem).toHaveBeenCalled();
  });

  it("clears invalid web payloads and reports", async () => {
    setPlatformOS("web");

    const storage = {
      getItem: jest.fn(() => "{not-json"),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    (global as any).window = { localStorage: storage };

    await loadSavedUser();
    queryClient.setQueryData(QUERY_KEY, null);

    const { result } = await renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentUser).toBeNull();
    expect(storage.removeItem).toHaveBeenCalled();
    expect(reportError).toHaveBeenCalled();
  });

  it("loads/saves on native using SecureStore", async () => {
    setPlatformOS("ios");
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ id: "u1", name: "Alice", is_admin: false }),
    );

    const savedUser = await loadSavedUser();
    queryClient.setQueryData(QUERY_KEY, savedUser);

    const { result } = await renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentUser?.id).toBe("u1");

    await act(async () => {
      await result.current.setCurrentUser({
        id: "u2",
        name: "Bob",
        is_admin: true,
      } as any);
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalled();

    await act(async () => {
      await result.current.setCurrentUser(null);
    });
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it("reports load errors and still finishes loading", async () => {
    setPlatformOS("ios");
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce("fail");

    await loadSavedUser();
    queryClient.setQueryData(QUERY_KEY, null);

    const { result } = await renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(reportError).toHaveBeenCalled();
  });

  it("rethrows save errors after reporting", async () => {
    setPlatformOS("ios");
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(
      new Error("nope"),
    );

    await loadSavedUser();
    queryClient.setQueryData(QUERY_KEY, null);

    const { result } = await renderHook(() => useCurrentUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let thrown: any = null;
    try {
      await act(async () => {
        await result.current.setCurrentUser(mockUser as any);
      });
    } catch (e) {
      thrown = e;
    }

    expect(thrown).not.toBeNull();
    expect(reportError).toHaveBeenCalled();
  });
});

describe("useCurrentUser (Basic)", () => {
  it("successfully fetches and returns user data", async () => {
    setPlatformOS("ios");
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(mockUser),
    );

    const savedUser = await loadSavedUser();
    queryClient.setQueryData(QUERY_KEY, savedUser);

    const { result } = await renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.isAdmin).toBe(true);
  });
});
