import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAddBeer, useRemoveBeer, QUERY_KEYS } from "@/hooks/useBeersQuery";
import * as beersService from "@/services/beers";
import React from "react";

// Mock the beers service
jest.mock("@/services/beers");
const mockAddBeer = beersService.addBeer as jest.MockedFunction<
  typeof beersService.addBeer
>;
const mockRemoveBeer = beersService.removeBeer as jest.MockedFunction<
  typeof beersService.removeBeer
>;

describe("Optimistic Updates", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("useAddBeer", () => {
    it("should update cache optimistically", async () => {
      mockAddBeer.mockResolvedValue({ beer: null, newBadges: [] });

      const eventId = "event-123";
      const userId = "user-456";
      const addedBy = "user-789";

      // Set initial cache
      queryClient.setQueryData(QUERY_KEYS.beers(eventId), []);

      const { result } = renderHook(() => useAddBeer(), { wrapper });

      // Trigger mutation
      result.current.mutate({ userId, addedBy, eventId });

      // Check cache updated immediately (before API call completes)
      await waitFor(() => {
        const cached = queryClient.getQueryData(
          QUERY_KEYS.beers(eventId),
        ) as any[];
        expect(cached).toBeDefined();
        expect(cached.length).toBe(1);
        expect(cached[0].id).toContain("temp-");
        expect(cached[0].user_id).toBe(userId);
      });
    });

    it("should rollback on error", async () => {
      mockAddBeer.mockRejectedValue(new Error("Network error"));

      const eventId = "event-123";
      const userId = "user-456";
      const addedBy = "user-789";

      // Set initial cache with one beer
      const initialBeers = [{ id: "beer-1", user_id: "other-user" }];
      queryClient.setQueryData(QUERY_KEYS.beers(eventId), initialBeers);

      const { result } = renderHook(() => useAddBeer(), { wrapper });

      // Trigger mutation
      result.current.mutate({ userId, addedBy, eventId });

      // Wait for mutation to fail
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify rollback - should have original data
      const cached = queryClient.getQueryData(
        QUERY_KEYS.beers(eventId),
      ) as any[];
      expect(cached).toEqual(initialBeers);
      expect(cached.length).toBe(1);
      expect(cached[0].id).toBe("beer-1");
    });

    it("should update beer counts optimistically", async () => {
      mockAddBeer.mockResolvedValue({ beer: null, newBadges: [] });

      const eventId = "event-123";
      const userId = "user-456";
      const addedBy = "user-789";

      // Set initial counts
      queryClient.setQueryData(QUERY_KEYS.beerCounts(eventId), [
        { userId: "user-456", count: 5 },
        { userId: "user-999", count: 3 },
      ]);

      const { result } = renderHook(() => useAddBeer(), { wrapper });

      result.current.mutate({ userId, addedBy, eventId });

      await waitFor(() => {
        const counts = queryClient.getQueryData(
          QUERY_KEYS.beerCounts(eventId),
        ) as any[];
        const userCount = counts.find((c: any) => c.userId === userId);
        expect(userCount?.count).toBe(6); // 5 + 1
      });
    });
  });

  describe("useRemoveBeer", () => {
    it("should remove beer optimistically", async () => {
      mockRemoveBeer.mockResolvedValue(undefined);

      const beerId = "beer-123";
      const eventId = "event-456";

      // Set initial cache
      const initialBeers = [
        { id: "beer-123", user_id: "user-1" },
        { id: "beer-456", user_id: "user-2" },
      ];
      queryClient.setQueryData(QUERY_KEYS.beers(eventId), initialBeers);

      const { result } = renderHook(() => useRemoveBeer(), { wrapper });

      result.current.mutate(beerId);

      // Check beer removed immediately
      await waitFor(() => {
        const cached = queryClient.getQueryData(
          QUERY_KEYS.beers(eventId),
        ) as any[];
        expect(cached.length).toBe(1);
        expect(cached.find((b: any) => b.id === beerId)).toBeUndefined();
      });
    });

    it("should rollback remove on error", async () => {
      mockRemoveBeer.mockRejectedValue(new Error("Failed to delete"));

      const beerId = "beer-123";
      const eventId = "event-456";

      const initialBeers = [
        { id: "beer-123", user_id: "user-1" },
        { id: "beer-456", user_id: "user-2" },
      ];
      queryClient.setQueryData(QUERY_KEYS.beers(eventId), initialBeers);

      const { result } = renderHook(() => useRemoveBeer(), { wrapper });

      result.current.mutate(beerId);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify rollback
      const cached = queryClient.getQueryData(
        QUERY_KEYS.beers(eventId),
      ) as any[];
      expect(cached.length).toBe(2);
      expect(cached.find((b: any) => b.id === beerId)).toBeDefined();
    });
  });
});
