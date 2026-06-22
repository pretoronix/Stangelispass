import { renderHook, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useActiveEventQuery,
  useStartEvent,
  useCloseEvent,
} from "@/hooks/useEventsQuery";
import { supabase } from "@/services/supabase";
import React from "react";

// Mock services
jest.mock("@/services/events", () => ({
  startEventInSupabase: jest.fn(),
  closeEventInSupabase: jest.fn(),
  getEventMembership: jest.fn(),
  getEventGameStats: jest.fn(),
  getEventLeaderState: jest.fn(),
  getEventMembers: jest.fn(),
  getWallOfFame: jest.fn(),
}));

jest.mock("@/services/notifications", () => ({
  enqueueNewRoundNotifications: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("@/services/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
    })),
  },
}));

let queryClient: QueryClient;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe("useEventsQuery Hooks", () => {
  afterEach(() => {
    if (queryClient) queryClient.clear();
  });

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  describe("useActiveEventQuery", () => {
    it("fetches the active event successfully", async () => {
      const mockEvent = { id: "e1", name: "Test Event", is_active: true };
      const fromMock = supabase.from as jest.Mock;
      const maybeSingle = jest.fn().mockResolvedValueOnce({
        data: mockEvent,
        error: null,
      });
      fromMock.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle,
      });

      const { result } = renderHook(() => useActiveEventQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.event).toEqual(mockEvent);
    });

    it("handles missing schema scenario", async () => {
      // Mock supabase.from("events") to return null (simulating missing property in proxy)
      (supabase.from as jest.Mock).mockReturnValueOnce({});

      const { result } = renderHook(() => useActiveEventQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.missingSchema).toBe(true);
    });
  });

  describe("useStartEvent", () => {
    it("starts an event and enqueues notifications", async () => {
      const { startEventInSupabase } = require("@/services/events");
      const {
        enqueueNewRoundNotifications,
      } = require("@/services/notifications");

      const mockEvent = { id: "e1", name: "New Event", created_by: "u1" };
      startEventInSupabase.mockResolvedValueOnce(mockEvent);

      const { result } = renderHook(() => useStartEvent(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          name: "New Event",
          userId: "u1",
          passType: "free",
        });
      });

      expect(startEventInSupabase).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Event",
          userId: "u1",
          passType: "free",
        }),
        expect.anything(),
      );
      expect(enqueueNewRoundNotifications).toHaveBeenCalledWith(
        "e1",
        "New Event",
        "u1",
      );
    });
  });

  describe("useCloseEvent", () => {
    it("closes an event successfully", async () => {
      const { closeEventInSupabase } = require("@/services/events");
      const mockEvent = { id: "e1", name: "Active Event" };
      closeEventInSupabase.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCloseEvent(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(mockEvent as any);
      });

      expect(closeEventInSupabase).toHaveBeenCalledWith(
        expect.objectContaining(mockEvent),
        expect.anything(),
      );
    });
  });
});
