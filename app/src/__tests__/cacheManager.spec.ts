import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryClient } from "@/providers/QueryProvider";
import {
  getCacheStats,
  clearCache,
  checkAndClearIfOversized,
} from "@/utils/cacheManager";
import { reportError } from "@/utils/logger";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock expo-constants
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: "1.0.0",
    },
  },
}));

describe("Cache Persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get cache stats", async () => {
    const mockCache = JSON.stringify({
      clientState: {
        queries: [
          { queryKey: ["users"], state: { status: "success" } },
          { queryKey: ["events"], state: { status: "success" } },
        ],
      },
    });

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockCache);

    const stats = await getCacheStats();

    expect(stats.queriesCount).toBe(2);
    expect(stats.sizeKB).toBeGreaterThan(0);
  });

  it("should return empty stats when no cache exists", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const stats = await getCacheStats();

    expect(stats.sizeKB).toBe(0);
    expect(stats.queriesCount).toBe(0);
    expect(stats.lastUpdated).toBeNull();
  });

  it("should clear cache", async () => {
    await clearCache();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      expect.stringContaining("STANGELISPASS_QUERY_CACHE_"),
    );
  });

  it("should check and clear oversized cache", async () => {
    // Mock large cache size by creating realistic JSON data
    const largeMockData = JSON.stringify({
      clientState: {
        queries: Array(1000)
          .fill(null)
          .map((_, i) => ({
            queryKey: [`query-${i}`],
            state: { status: "success", data: "x".repeat(10000) },
          })),
      },
    });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(largeMockData);

    // Use smaller limit to ensure we exceed it
    const wasCleared = await checkAndClearIfOversized(0.5); // 0.5MB limit

    expect(wasCleared).toBe(true);
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });

  it("should not clear cache if within size limit", async () => {
    // Mock small cache
    const smallMockData = JSON.stringify({ data: "small" });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(smallMockData);

    const wasCleared = await checkAndClearIfOversized(5);

    expect(wasCleared).toBe(false);
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it("getCacheStats returns empty stats and reports when storage throws", async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce("fail");

    const stats = await getCacheStats();

    expect(stats).toEqual({ sizeKB: 0, queriesCount: 0, lastUpdated: null });
    expect(reportError).toHaveBeenCalled();
  });

  it("clearCache rethrows and reports on failure", async () => {
    jest.spyOn(queryClient, "clear").mockImplementation(() => {
      throw "boom";
    });

    await expect(clearCache()).rejects.toBeTruthy();
    expect(reportError).toHaveBeenCalled();
  });
});
