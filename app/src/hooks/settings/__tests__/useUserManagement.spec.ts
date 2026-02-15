import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useUserManagement } from "@/hooks/settings/useUserManagement";
import { addUser, updateUser } from "@/services/supabase";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import { reportError } from "@/utils/logger";

jest.mock("@/services/supabase", () => ({
  addUser: jest.fn(),
  updateUser: jest.fn(),
}));

jest.mock("@/services/notifications", () => ({
  registerForPushNotificationsAsync: jest.fn(),
}));

jest.mock("@/utils/settings/settingsHelpers", () => ({
  playHapticSelection: jest.fn(),
  playHapticSuccess: jest.fn(),
  playHapticError: jest.fn(),
  playHapticImpact: jest.fn(),
}));

describe("useUserManagement", () => {
  const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    (registerForPushNotificationsAsync as jest.Mock).mockResolvedValue(true);
  });

  it("selects a user and triggers push registration", async () => {
    const setCurrentUser = jest.fn();
    const refreshUsers = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useUserManagement({ currentUser: null, setCurrentUser, refreshUsers }),
    );

    await act(async () => {
      await result.current.handleSelectUser({
        id: "u1",
        name: "Alice",
        is_admin: false,
      } as any);
    });

    expect(setCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u1" }),
    );
    expect(alertSpy).toHaveBeenCalled();
    expect(registerForPushNotificationsAsync).toHaveBeenCalledWith("u1");
  });

  it("reports when push registration promise rejects", async () => {
    (registerForPushNotificationsAsync as jest.Mock).mockRejectedValueOnce(
      "fail",
    );

    const setCurrentUser = jest.fn();
    const refreshUsers = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useUserManagement({ currentUser: null, setCurrentUser, refreshUsers }),
    );

    await act(async () => {
      await result.current.handleSelectUser({
        id: "u1",
        name: "Alice",
        is_admin: false,
      } as any);
    });

    // rejection is handled via `.catch(...)` in the hook
    await waitFor(() => expect(reportError).toHaveBeenCalled());
  });

  it("reports when push registration throws synchronously", async () => {
    (registerForPushNotificationsAsync as jest.Mock).mockImplementationOnce(
      () => {
        throw new Error("sync fail");
      },
    );

    const setCurrentUser = jest.fn();
    const refreshUsers = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useUserManagement({ currentUser: null, setCurrentUser, refreshUsers }),
    );

    await act(async () => {
      await result.current.handleSelectUser({
        id: "u1",
        name: "Alice",
        is_admin: false,
      } as any);
    });

    expect(reportError).toHaveBeenCalled();
  });

  it("handleAddUser validates empty input", async () => {
    const setCurrentUser = jest.fn();
    const refreshUsers = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useUserManagement({ currentUser: null, setCurrentUser, refreshUsers }),
    );

    await act(async () => {
      await result.current.handleAddUser();
    });

    expect(addUser).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith("Error", "Please enter a name");
  });

  it("adds a user and refreshes list", async () => {
    (addUser as jest.Mock).mockResolvedValueOnce({
      id: "u2",
      name: "Bob",
      is_admin: false,
    });

    const setCurrentUser = jest.fn().mockResolvedValue(undefined);
    const refreshUsers = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useUserManagement({ currentUser: null, setCurrentUser, refreshUsers }),
    );

    await act(async () => {
      result.current.setNewUserName("Bob");
    });

    await act(async () => {
      await result.current.handleAddUser();
    });

    await waitFor(() => expect(addUser).toHaveBeenCalledWith("Bob", false));
    expect(setCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u2" }),
    );
    expect(registerForPushNotificationsAsync).toHaveBeenCalledWith("u2");
    expect(refreshUsers).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith("Success", "Added Bob!");
  });

  it("reports when push registration for new user rejects", async () => {
    (addUser as jest.Mock).mockResolvedValueOnce({
      id: "u2",
      name: "Bob",
      is_admin: false,
    });
    (registerForPushNotificationsAsync as jest.Mock).mockRejectedValueOnce(
      "fail",
    );

    const setCurrentUser = jest.fn().mockResolvedValue(undefined);
    const refreshUsers = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useUserManagement({ currentUser: null, setCurrentUser, refreshUsers }),
    );

    await act(async () => {
      result.current.setNewUserName("Bob");
    });

    await act(async () => {
      await result.current.handleAddUser();
    });

    await waitFor(() => expect(reportError).toHaveBeenCalled());
  });

  it("alerts when addUser returns null", async () => {
    (addUser as jest.Mock).mockResolvedValueOnce(null);

    const setCurrentUser = jest.fn();
    const refreshUsers = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useUserManagement({ currentUser: null, setCurrentUser, refreshUsers }),
    );

    await act(async () => {
      result.current.setNewUserName("Bob");
    });

    await act(async () => {
      await result.current.handleAddUser();
    });

    expect(alertSpy).toHaveBeenCalledWith("Error", expect.any(String));
    expect(setCurrentUser).not.toHaveBeenCalled();
  });

  it("handleLogout clears current user", async () => {
    const setCurrentUser = jest.fn();
    const refreshUsers = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useUserManagement({
        currentUser: { id: "u1" } as any,
        setCurrentUser,
        refreshUsers,
      }),
    );

    act(() => {
      result.current.handleLogout();
    });

    expect(setCurrentUser).toHaveBeenCalledWith(null);
  });

  it("reports error when addUser throws", async () => {
    (addUser as jest.Mock).mockRejectedValueOnce(new Error("nope"));

    const setCurrentUser = jest.fn();
    const refreshUsers = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useUserManagement({ currentUser: null, setCurrentUser, refreshUsers }),
    );

    await act(async () => {
      result.current.setNewUserName("Alice");
    });

    await act(async () => {
      await result.current.handleAddUser();
    });

    expect(reportError).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith("Error", "Failed to add user");
  });

  it("updates a user field and rethrows on failure", async () => {
    (updateUser as jest.Mock).mockResolvedValueOnce(true);

    const currentUser = { id: "u1", name: "Alice", is_admin: false } as any;
    const setCurrentUser = jest.fn();
    const refreshUsers = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useUserManagement({ currentUser, setCurrentUser, refreshUsers }),
    );

    await act(async () => {
      await result.current.handleUpdateUserField({ name: "Alice2" } as any);
    });

    expect(updateUser).toHaveBeenCalledWith("u1", { name: "Alice2" });
    expect(setCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Alice2" }),
    );

    (updateUser as jest.Mock).mockRejectedValueOnce("fail");
    let thrown: unknown = null;
    try {
      await act(async () => {
        await result.current.handleUpdateUserField({ name: "Alice3" } as any);
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeTruthy();
    expect(reportError).toHaveBeenCalled();
  });

  it("handleUpdateUserField is a no-op without currentUser", async () => {
    const setCurrentUser = jest.fn();
    const refreshUsers = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useUserManagement({ currentUser: null, setCurrentUser, refreshUsers }),
    );

    await act(async () => {
      await result.current.handleUpdateUserField({ name: "X" } as any);
    });

    expect(updateUser).not.toHaveBeenCalled();
  });
});
