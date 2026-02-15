import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useOfflineMutations } from "@/hooks/useOfflineMutations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reportError } from "@/utils/logger";

jest.mock("@react-native-async-storage/async-storage");
let mockIsOnline = true;
jest.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isOnline: mockIsOnline, isReconnecting: false }),
}));

describe("useOfflineMutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline = true;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it("should initialize with empty queue", async () => {
    const { result } = renderHook(() => useOfflineMutations());

    await waitFor(() => {
      expect(result.current.queue).toEqual([]);
    });
  });

  it("should load queue from storage on mount", async () => {
    const storedQueue = [
      {
        id: "1",
        type: "addBeer" as const,
        data: { userId: "user1" },
        timestamp: Date.now(),
      },
    ];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(storedQueue),
    );

    const { result } = renderHook(() => useOfflineMutations());

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0]?.type).toBe("addBeer");
    });
  });

  it("should add mutation to queue", async () => {
    const { result } = renderHook(() => useOfflineMutations());

    await act(async () => {
      await result.current.addToQueue({
        type: "addBeer",
        data: { userId: "user1", addedBy: "user2", eventId: "event1" },
      });
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0]?.type).toBe("addBeer");
      expect(result.current.queue[0]?.data.userId).toBe("user1");
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it("should remove mutation from queue", async () => {
    const storedQueue = [
      {
        id: "mutation-1",
        type: "addBeer" as const,
        data: { userId: "user1" },
        timestamp: Date.now(),
      },
      {
        id: "mutation-2",
        type: "addBeer" as const,
        data: { userId: "user2" },
        timestamp: Date.now(),
      },
    ];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(storedQueue),
    );

    const { result } = renderHook(() => useOfflineMutations());

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(2);
    });

    await act(async () => {
      await result.current.removeFromQueue("mutation-1");
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0]?.id).toBe("mutation-2");
    });
  });

  it("should clear entire queue", async () => {
    const storedQueue = [
      {
        id: "1",
        type: "addBeer" as const,
        data: { userId: "user1" },
        timestamp: Date.now(),
      },
    ];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(storedQueue),
    );

    const { result } = renderHook(() => useOfflineMutations());

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
    });

    await act(async () => {
      await result.current.clearQueue();
    });

    await waitFor(() => {
      expect(result.current.queue).toEqual([]);
    });
  });

  it("should process queue with executor", async () => {
    const storedQueue = [
      {
        id: "mutation-1",
        type: "addBeer" as const,
        data: { userId: "user1" },
        timestamp: Date.now(),
      },
    ];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(storedQueue),
    );

    const { result } = renderHook(() => useOfflineMutations());

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
    });

    const mockExecutor = jest.fn().mockResolvedValue(undefined);
    await act(async () => {
      await result.current.processQueue(mockExecutor);
    });

    await waitFor(() => {
      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "mutation-1",
          type: "addBeer",
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.queue).toEqual([]);
    });
  });

  it("should keep mutation in queue if executor fails", async () => {
    const storedQueue = [
      {
        id: "mutation-1",
        type: "addBeer" as const,
        data: { userId: "user1" },
        timestamp: Date.now(),
      },
    ];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(storedQueue),
    );

    const { result } = renderHook(() => useOfflineMutations());

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
    });

    const mockExecutor = jest
      .fn()
      .mockRejectedValue(new Error("Network error"));
    await act(async () => {
      await result.current.processQueue(mockExecutor);
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
    });
  });

  it("does not call executor when queue is empty", async () => {
    const { result } = renderHook(() => useOfflineMutations());
    const executor = jest.fn();

    await act(async () => {
      await result.current.processQueue(executor);
    });

    expect(executor).not.toHaveBeenCalled();
  });

  it("reports loadQueue errors", async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce("fail");

    renderHook(() => useOfflineMutations());

    await waitFor(() => {
      expect(reportError).toHaveBeenCalled();
    });
  });

  it("reports persist errors when AsyncStorage.setItem fails", async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce("fail");

    const { result } = renderHook(() => useOfflineMutations());

    await act(async () => {
      await result.current.addToQueue({
        type: "addBeer",
        data: { userId: "u1" },
      });
    });

    await waitFor(() => {
      expect(reportError).toHaveBeenCalled();
    });
  });

  it("exposes isProcessing as false when offline", async () => {
    mockIsOnline = false;

    const storedQueue = [
      {
        id: "m1",
        type: "addBeer" as const,
        data: { userId: "u1" },
        timestamp: Date.now(),
      },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(storedQueue),
    );

    const { result } = renderHook(() => useOfflineMutations());

    await waitFor(() => expect(result.current.queue).toHaveLength(1));
    expect(result.current.isProcessing).toBe(false);
  });
});
