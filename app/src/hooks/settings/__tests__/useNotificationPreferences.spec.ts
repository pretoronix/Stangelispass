import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useNotificationPreferences } from "@/hooks/settings/useNotificationPreferences";
import { updateUser } from "@/services/supabase";
import { reportError } from "@/utils/logger";

jest.mock("@/services/supabase", () => ({
  updateUser: jest.fn(),
}));

describe("useNotificationPreferences", () => {
  const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does nothing when currentUser is null", async () => {
    const setCurrentUser = jest.fn();
    const { result } = renderHook(() =>
      useNotificationPreferences({
        currentUser: null,
        setCurrentUser,
        notificationPrefs: {
          leader_change: true,
          milestones: [5],
          admin_broadcasts: true,
        } as any,
      }),
    );

    await act(async () => {
      await result.current.updateNotificationPrefs({
        leader_change: false,
        milestones: [],
        admin_broadcasts: false,
      } as any);
    });

    expect(updateUser).not.toHaveBeenCalled();
    expect(setCurrentUser).not.toHaveBeenCalled();
  });

  it("updates prefs optimistically and persists", async () => {
    (updateUser as jest.Mock).mockResolvedValueOnce(true);
    const setCurrentUser = jest.fn();
    const currentUser = { id: "u1", name: "A", notification_prefs: {} } as any;

    const { result } = renderHook(() =>
      useNotificationPreferences({
        currentUser,
        setCurrentUser,
        notificationPrefs: {
          leader_change: true,
          milestones: [5],
          admin_broadcasts: false,
        } as any,
      }),
    );

    await act(async () => {
      result.current.toggleLeaderChange(false);
    });

    expect(setCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u1" }),
    );
    expect(updateUser).toHaveBeenCalledWith("u1", expect.any(Object));
  });

  it("reverts on update error and alerts", async () => {
    (updateUser as jest.Mock).mockRejectedValueOnce(new Error("nope"));
    const setCurrentUser = jest.fn();
    const currentUser = {
      id: "u1",
      name: "A",
      notification_prefs: {
        leader_change: true,
        milestones: [],
        admin_broadcasts: false,
      },
    } as any;

    const { result } = renderHook(() =>
      useNotificationPreferences({
        currentUser,
        setCurrentUser,
        notificationPrefs: {
          leader_change: true,
          milestones: [],
          admin_broadcasts: false,
        } as any,
      }),
    );

    await act(async () => {
      result.current.toggleAdminBroadcasts(true);
    });

    expect(reportError).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
    // previous user restore
    expect(setCurrentUser).toHaveBeenCalledWith(currentUser);
  });

  it("toggleMilestone adds/removes and de-dupes/sorts", async () => {
    (updateUser as jest.Mock).mockResolvedValue(true);
    const setCurrentUser = jest.fn();
    const currentUser = { id: "u1", name: "A", notification_prefs: {} } as any;

    const { result, rerender } = renderHook(
      (prefs) =>
        useNotificationPreferences({
          currentUser,
          setCurrentUser,
          notificationPrefs: prefs as any,
        }),
      {
        initialProps: {
          leader_change: true,
          milestones: [10, 5],
          admin_broadcasts: false,
        },
      },
    );

    await act(async () => {
      result.current.toggleMilestone(5, false);
    });

    // Simulate the screen re-rendering with the updated prefs after the first change.
    rerender({
      leader_change: true,
      milestones: [10],
      admin_broadcasts: false,
    });

    await act(async () => {
      result.current.toggleMilestone(20, true);
    });

    // The hook builds the outgoing prefs; we validate it via the optimistic setCurrentUser calls.
    const calls = setCurrentUser.mock.calls.map((c) => c[0]);
    const last = calls[calls.length - 1];
    expect(last.notification_prefs.milestones).toEqual([10, 20]);
  });
});
