import { renderHook, act } from "@testing-library/react-native";
import { useBeerLogToast } from "@/hooks/useBeerLogToast";

const mockRemoveChannel = jest.fn();
const mockSubscribe = jest.fn(() => ({}));
let mockOnCallback: ((payload: any) => void) | null = null;
const mockOn = jest.fn((_event, _filter, callback) => {
  mockOnCallback = callback;
  return { on: mockOn, subscribe: mockSubscribe };
});
const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));

jest.mock("@/services/supabase", () => ({
  supabase: {
    channel: (...args: any[]) => mockChannel(...args),
    removeChannel: (...args: any[]) => mockRemoveChannel(...args),
  },
  isSupabaseConfigured: () => true,
}));

jest.mock("@/utils/logger", () => ({
  reportError: jest.fn(),
}));

describe("useBeerLogToast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockOnCallback = null;
    mockRemoveChannel.mockClear();
    mockChannel.mockClear();
    mockOn.mockClear();
    mockSubscribe.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("shows toast when current user gets a beer log", () => {
    const { result } = renderHook(() => useBeerLogToast("u1", "e1"));

    act(() => {
      mockOnCallback?.({ new: { id: "b1", user_id: "u1", event_id: "e1" } });
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.message).toBe("Beer logged!");

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(result.current.visible).toBe(false);
  });

  it("ignores beer logs for other users", () => {
    const { result } = renderHook(() => useBeerLogToast("u1", "e1"));

    act(() => {
      mockOnCallback?.({ new: { id: "b2", user_id: "u2", event_id: "e1" } });
    });

    expect(result.current.visible).toBe(false);
  });

  it("does nothing without required ids", () => {
    renderHook(() => useBeerLogToast(null, "e1"));
    renderHook(() => useBeerLogToast("u1", null));
    expect(mockChannel).not.toHaveBeenCalled();
  });
});
