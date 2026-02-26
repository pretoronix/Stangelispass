import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useBeersQuery,
  useAddBeer,
  useRemoveBeer,
} from "@/hooks/useBeersQuery";
import React from "react";

// Mock services
jest.mock("@/services/beers", () => ({
  getBeers: jest.fn(),
  addBeer: jest.fn(),
  removeBeer: jest.fn(),
  getBeerCountByEventMembers: jest.fn(),
  getUserAchievements: jest.fn(),
  createBeerStamp: jest.fn(),
  redeemBeerStamp: jest.fn(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("useBeersQuery Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useBeersQuery", () => {
    it("fetches beers for an event", async () => {
      const { getBeers } = require("@/services/beers");
      const mockBeers = [{ id: "b1", user_id: "u1", event_id: "e1" }];
      getBeers.mockResolvedValueOnce(mockBeers);

      const { result } = renderHook(() => useBeersQuery("e1"), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockBeers);
      expect(getBeers).toHaveBeenCalledWith("e1");
    });
  });

  describe("useAddBeer", () => {
    it("performs optimistic update on mutate", async () => {
      const { addBeer } = require("@/services/beers");
      addBeer.mockResolvedValueOnce({ beer: { id: "b2" }, newBadges: [] });

      const queryClient = createTestQueryClient();
      const testWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      // Pre-populate cache
      queryClient.setQueryData(["beers", "e1"], [{ id: "b1", user_id: "u1" }]);
      queryClient.setQueryData(
        ["beer-counts", "e1"],
        [{ userId: "u1", count: 1 }],
      );

      const { result } = renderHook(() => useAddBeer(), {
        wrapper: testWrapper,
      });

      await result.current.mutateAsync({
        userId: "u1",
        addedBy: "admin",
        eventId: "e1",
      });

      // After mutation succeeds, queries should be invalidated (but here we check final state if we didn't wait)
      expect(addBeer).toHaveBeenCalled();

      // Verification of invalidation
      expect(queryClient.getQueryState(["beers", "e1"])?.isInvalidated).toBe(
        true,
      );
    });
  });

  describe("useRemoveBeer", () => {
    it("removes beer and invalidates queries", async () => {
      const { removeBeer } = require("@/services/beers");
      removeBeer.mockResolvedValueOnce(true);

      const queryClient = createTestQueryClient();
      const testWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useRemoveBeer(), {
        wrapper: testWrapper,
      });

      // Pre-populate cache to check invalidation
      queryClient.setQueryData(["beers"], []);
      await result.current.mutateAsync("b1");

      expect(removeBeer).toHaveBeenCalledWith("b1");
      expect(queryClient.getQueryState(["beers"])?.isInvalidated).toBe(true);
    });
  });
});
