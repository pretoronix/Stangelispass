import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useNotificationHandler } from "@/hooks/useNotificationHandler";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: (...args: any[]) => mockPush(...args) }),
}));

const mockSetNotificationHandler = jest.fn();
const mockAddReceivedListener = jest.fn();
const mockAddResponseListener = jest.fn();

jest.mock("expo-notifications", () => ({
  setNotificationHandler: (...args: any[]) =>
    mockSetNotificationHandler(...args),
  addNotificationReceivedListener: (...args: any[]) =>
    mockAddReceivedListener(...args),
  addNotificationResponseReceivedListener: (...args: any[]) =>
    mockAddResponseListener(...args),
}));

const mockHaptic = jest.fn(async (...args: any[]) => null);
jest.mock("expo-haptics", () => ({
  notificationAsync: (...args: any[]) => mockHaptic(...args),
  NotificationFeedbackType: { Success: "success" },
}));

describe("useNotificationHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore?.();
  });

  it("registers listeners and cleans up on unmount", () => {
    const receivedRemove = jest.fn();
    const responseRemove = jest.fn();

    mockAddReceivedListener.mockReturnValueOnce({ remove: receivedRemove });
    mockAddResponseListener.mockReturnValueOnce({ remove: responseRemove });

    const { unmount } = renderHook(() => useNotificationHandler());

    expect(mockSetNotificationHandler).toHaveBeenCalled();
    expect(mockAddReceivedListener).toHaveBeenCalled();
    expect(mockAddResponseListener).toHaveBeenCalled();

    unmount();
    expect(receivedRemove).toHaveBeenCalled();
    expect(responseRemove).toHaveBeenCalled();
  });

  it("alerts and triggers haptics for foreground notifications", async () => {
    let receivedCb: any = null;
    mockAddReceivedListener.mockImplementationOnce((cb: any) => {
      receivedCb = cb;
      return { remove: jest.fn() };
    });
    mockAddResponseListener.mockReturnValueOnce({ remove: jest.fn() });

    renderHook(() => useNotificationHandler());

    await act(async () => {
      receivedCb?.({
        request: { content: { title: "Hi", body: "There" } },
      });
    });

    expect(mockHaptic).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith("Hi", "There", expect.any(Array), {
      cancelable: true,
    });
  });

  it("navigates based on notification response type", () => {
    let responseCb: any = null;
    mockAddReceivedListener.mockReturnValueOnce({ remove: jest.fn() });
    mockAddResponseListener.mockImplementationOnce((cb: any) => {
      responseCb = cb;
      return { remove: jest.fn() };
    });

    renderHook(() => useNotificationHandler());

    act(() => {
      responseCb?.({
        notification: { request: { content: { data: { type: "milestone" } } } },
      });
      responseCb?.({
        notification: {
          request: { content: { data: { type: "admin_broadcast" } } },
        },
      });
      responseCb?.({
        notification: { request: { content: { data: { type: "unknown" } } } },
      });
    });

    expect(mockPush).toHaveBeenCalledWith("/history");
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
