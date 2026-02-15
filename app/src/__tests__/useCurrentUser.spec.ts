import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { reportError } from "@/utils/logger";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function setPlatformOS(os: "web" | "ios") {
  try {
    Object.defineProperty(Platform, "OS", { value: os });
  } catch {
    // Fallback for environments where OS is writable but not configurable.
    (Platform as any).OS = os;
  }
}

describe("useCurrentUser", () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    setPlatformOS("ios");
  });

  afterEach(() => {
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

    const { result } = renderHook(() => useCurrentUser());

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

    const { result } = renderHook(() => useCurrentUser());

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

    const { result } = renderHook(() => useCurrentUser());

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

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(reportError).toHaveBeenCalled();
  });

  it("rethrows save errors after reporting", async () => {
    setPlatformOS("ios");
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(
      new Error("nope"),
    );

    const { result } = renderHook(() => useCurrentUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let thrown: unknown = null;
    try {
      await act(async () => {
        await result.current.setCurrentUser({
          id: "u1",
          name: "Alice",
          is_admin: false,
        } as any);
      });
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeTruthy();
    expect(reportError).toHaveBeenCalled();
  });
});
