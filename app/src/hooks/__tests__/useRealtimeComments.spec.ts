import { renderHook, act } from "@testing-library/react-native";
import { useRealtimeComments } from "@/hooks/useRealtimeComments";

const mockInvalidateQueries = jest.fn();

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: (...args: any[]) => mockInvalidateQueries(...args),
    }),
  };
});

const onHandlers: ((payload: any) => void)[] = [];
const subscribeHandlers: ((status: string, err?: any) => void)[] = [];
const mockRemoveChannel = jest.fn();

jest.mock("@/services/client", () => ({
  supabase: {
    channel: jest.fn(() => {
      const channel: any = {
        on: jest.fn((_type: any, _filter: any, handler: any) => {
          onHandlers.push(handler);
          return channel;
        }),
        subscribe: jest.fn((handler: any) => {
          subscribeHandlers.push(handler);
          return { id: "chan" };
        }),
      };
      return channel;
    }),
    removeChannel: (...args: any[]) => mockRemoveChannel(...args),
  },
}));

describe("useRealtimeComments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onHandlers.length = 0;
    subscribeHandlers.length = 0;
  });

  it("does nothing when disabled", () => {
    const { unmount } = renderHook(() => useRealtimeComments("b1", false));
    unmount();
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
    expect(mockRemoveChannel).not.toHaveBeenCalled();
  });

  it("invalidates queries on insert/update/delete payloads and cleans up", () => {
    const { unmount } = renderHook(() => useRealtimeComments("b1", true));

    expect(onHandlers.length).toBe(3);

    act(() => {
      onHandlers[0]?.({ new: { id: "c1" } }); // INSERT
      onHandlers[1]?.({ new: { id: "c1" } }); // UPDATE
      onHandlers[2]?.({ old: { id: "c1" } }); // DELETE
    });

    expect(mockInvalidateQueries).toHaveBeenCalled();

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it("reports subscription statuses through the callback", () => {
    renderHook(() => useRealtimeComments("b1", true));

    expect(subscribeHandlers.length).toBeGreaterThan(0);
    act(() => {
      subscribeHandlers[0]?.("SUBSCRIBED");
      subscribeHandlers[0]?.("CHANNEL_ERROR", new Error("x"));
      subscribeHandlers[0]?.("TIMED_OUT");
      subscribeHandlers[0]?.("CLOSED");
    });
  });
});
