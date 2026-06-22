import React from "react";
import { render, waitFor, act, fireEvent } from "@testing-library/react-native";
import { Alert } from "react-native";
import { AppProvider, useApp } from "@/providers/AppProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { reportError } from "@/utils/logger";
import AddBeerScreen from "@/app/add";
import HomeScreen from "@/app/index";
import { addBeer } from "@/services/supabase";
import { startEventInSupabase } from "@/providers/appProviderActions";
import { labels } from "@/ui/labels";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let queryClient: QueryClient;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

// Mock dependencies
jest.mock("react-native", () => {
  const rn = jest.requireActual("react-native");
  rn.Alert.alert = jest.fn();
  return rn;
});

jest.mock("@/utils/logger", () => ({
  reportError: jest.fn(),
  logExpected: jest.fn(),
}));

const mockUser = { id: "u1", name: "Alice", is_admin: true };
const mockEvent = {
  id: "e1",
  name: "Round 1",
  is_active: true,
  pass_type: "day",
};
const mockEventsQuery: any = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data: mockEvent, error: null }),
};

const mockUseUsers = jest.fn();
const mockUseActiveEventQuery = jest.fn();
const mockUseEventMembers = jest.fn();
const mockUseEventMembership = jest.fn();

jest.mock("@/services/supabase", () => ({
  ...jest.requireActual("@/services/supabase"),
  __eventsQuery: mockEventsQuery,
  addBeer: jest.fn(),
  getUsers: jest.fn(async () => [mockUser]),
  getEventMembership: jest.fn(async () => ({
    missingTable: false,
    membership: { role: "owner" },
  })),
  getEventMembers: jest.fn(async () => []),
  consumeEventCredit: jest.fn(async () => ({ ok: true, used: "free" })),
  hasLifetimeAccess: jest.fn(() => false),
  getPermissionsForRole: jest.fn(() => ({
    canManageEvent: true,
    canManageMembers: true,
    canManageLogs: true,
    canIssueStamps: true,
    canCloseEvent: true,
    canInvite: true,
    canResetEventData: true,
  })),
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(() => ({})),
    })),
    removeChannel: jest.fn(),
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: mockEvent, error: null }),
    })),
  },
}));

jest.mock("@/utils/preflight", () => ({
  assertSupabaseConfigured: jest.fn(() => true),
}));

jest.mock("@/providers/appProviderLifecycle", () => ({
  bootstrapAppProvider: jest.fn(
    async ({
      setCurrentUserState,
      refreshUsers,
      fetchActiveEvent,
      setLoading,
    }: any) => {
      setCurrentUserState(mockUser);
      await refreshUsers();
      await fetchActiveEvent();
      setLoading(false);
    },
  ),
  subscribeUsersAndEvents: jest.fn(() => jest.fn()),
  subscribeEventMemberships: jest.fn(() => jest.fn()),
}));

jest.mock("@/hooks/useNotifications", () => ({
  useNotifications: jest.fn(),
}));

jest.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: jest.fn(() => ({
    currentUser: mockUser,
    setCurrentUser: jest.fn(async () => null),
    loading: false,
    isAdmin: true,
  })),
}));

jest.mock("@/hooks/useUsersQuery", () => ({
  useUsers: (...args: any[]) => mockUseUsers(...args),
}));

const mockMutateAsync = jest.fn();

jest.mock("@/hooks/useEventsQuery", () => ({
  useActiveEventQuery: (...args: any[]) => mockUseActiveEventQuery(...args),
  useEventMembers: (...args: any[]) => mockUseEventMembers(...args),
  useEventMembership: (...args: any[]) => mockUseEventMembership(...args),
  useStartEvent: () => ({ mutateAsync: mockMutateAsync }),
  useCloseEvent: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(() => ({ isOnline: true })),
}));

jest.mock("@/hooks/query", () => ({
  useBeersQuery: () => ({
    data: [],
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
  useBeerCounts: () => ({
    data: [],
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
  useEventMembers: () => ({
    data: [],
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
  useEventGameStats: () => ({
    data: { stats: [], missingTable: true },
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
  useEventLeaderState: () => ({
    data: { leader: null, missingTable: true },
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
}));

jest.mock("@/hooks/home/useLeaderboardAnnouncements", () => ({
  useLeaderboardAnnouncements: jest.fn(() => ({
    leaderAnnouncement: null,
    streakAnnouncement: null,
    showConfetti: false,
    setShowConfetti: jest.fn(),
  })),
}));

jest.mock("@/hooks/home/useScanHandler", () => ({
  useScanHandler: jest.fn(() => ({
    handleScan: jest.fn(),
  })),
}));

jest.mock("@/hooks/home/useEventActions", () => ({
  useEventActions: jest.fn(() => ({
    openNamePrompt: jest.fn(),
    showStartRoundPrompt: false,
    pendingAction: null,
    startRoundName: "",
    setStartRoundName: jest.fn(),
    beerPrice: "5.00",
    setBeerPrice: jest.fn(),
    pendingJoinEventName: "",
    promptSubmitting: false,
    submitNamePrompt: jest.fn(),
    setShowStartRoundPrompt: jest.fn(),
  })),
}));

jest.mock("@/hooks/home/useExportData", () => ({
  useExportData: jest.fn(() => ({
    handleExportData: jest.fn(),
  })),
}));

jest.mock("@/hooks/usePacePreset", () => ({
  usePacePreset: jest.fn(() => ({
    savedPace: null,
    savePace: jest.fn(),
    clearSavedPace: jest.fn(),
  })),
}));

jest.mock("@/components/home/StartRoundPrompt", () => ({
  StartRoundPrompt: () => null,
}));

jest.mock("@/components/features/MVPModal", () => ({
  MVPModal: () => null,
}));

jest.mock("@/components/features/QRScanner", () => ({
  QRScanner: () => null,
}));

jest.mock("@/components/features/InviteModal", () => ({
  InviteModal: () => null,
}));

jest.mock("@/components/notifications/BroadcastModal", () => ({
  BroadcastModal: () => null,
}));

jest.mock("@/components/animations/Confetti", () => ({
  Confetti: () => null,
}));

jest.mock("@/components/features/VelocityMetricCard", () => ({
  VelocityMetricCard: () => null,
}));

jest.mock("@/components/features/SafeRideCard", () => ({
  SafeRideCard: () => null,
}));

jest.mock("@/providers/appProviderActions", () => ({
  startEventInSupabase: jest.fn(async () => ({
    id: "e2",
    name: "Round 2",
    is_active: true,
    pass_type: "day",
  })),
  closeEventInSupabase: jest.fn(async () => null),
}));

// Mock child components to avoid deep rendering issues and focus on screen logic
jest.mock("@/components/add/AddUserGrid", () => {
  const { Pressable, Text } = require("react-native");
  return {
    AddUserGrid: ({ onSelectUser, users }: any) => (
      <>
        {users.map((u: any) => (
          <Pressable
            key={u.id}
            testID={`user-item-${u.id}`}
            onPress={() => onSelectUser(u)}
          >
            <Text>{u.name}</Text>
          </Pressable>
        ))}
      </>
    ),
  };
});

jest.mock("@/components/add/SelectedUserCard", () => {
  const { Button } = require("react-native");
  return {
    SelectedUserCard: ({ onAddBeer }: any) => (
      <Button title="Add Beer" onPress={onAddBeer} testID="add-beer-button" />
    ),
  };
});

describe("UI Error Handling", () => {
  afterEach(() => {
    if (queryClient) queryClient.clear();
  });

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    mockUseUsers.mockReturnValue({
      data: [mockUser],
      isLoading: false,
      refetch: jest.fn(async () => null),
    });
    mockUseActiveEventQuery.mockReturnValue({
      data: { event: mockEvent, missingSchema: false },
      isLoading: false,
      isError: false,
      refetch: jest.fn(async () => null),
    });
    mockUseEventMembers.mockReturnValue({
      data: [],
      refetch: jest.fn(async () => null),
    });
    mockUseEventMembership.mockReturnValue({
      data: { missingTable: false, membership: { role: "owner" } },
      refetch: jest.fn(async () => null),
    });
    mockEventsQuery.maybeSingle.mockResolvedValue({
      data: mockEvent,
      error: null,
    });
  });

  describe("Context Errors", () => {
    it("throws error when useApp is used outside AppProvider", () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      const BuggyComponent = () => {
        useApp();
        return null;
      };

      expect(() => render(<BuggyComponent />, { wrapper })).toThrow(
        "useApp must be used within AppProvider",
      );
      spy.mockRestore();
    });
  });

  describe("AppErrorBoundary", () => {
    it("renders fallback UI and reports error when a child crashes", () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const CrashComponent = () => {
        throw new Error("Test crash");
      };

      const { getByText } = render(
        <AppErrorBoundary>
          <CrashComponent />
        </AppErrorBoundary>,
      );

      expect(getByText("Something went wrong")).toBeTruthy();
      expect(getByText("Test crash")).toBeTruthy();
      expect(reportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ scope: "ui", action: "error_boundary" }),
      );
      errorSpy.mockRestore();
    });
  });

  describe("Screen Errors", () => {
    it("AddBeerScreen: alerts on addBeer failure", async () => {
      const mockAddBeer = addBeer as jest.Mock;
      mockAddBeer.mockRejectedValue(new Error("Network error"));

      const { getByTestId, getByText } = render(
        <AppProvider>
          <AddBeerScreen />
        </AppProvider>,
        { wrapper },
      );

      // Wait for data load
      await waitFor(() => expect(getByText("Who's drinking?")).toBeTruthy());

      // Select user
      fireEvent.press(getByTestId("user-item-u1"));

      // Press add beer
      await act(async () => {
        fireEvent.press(getByTestId("add-beer-button"));
      });

      // Verify Alert
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to add beer. Please try again.",
      );
      expect(reportError).toHaveBeenCalled();
    });

    it("HomeScreen: alerts on startEvent failure", async () => {
      mockUseActiveEventQuery.mockReturnValue({
        data: { event: null, missingSchema: false },
        isLoading: false,
        isError: false,
        refetch: jest.fn(async () => null),
      });
      mockEventsQuery.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });
      mockMutateAsync.mockRejectedValueOnce(new Error("Start failed"));

      const { getByTestId } = render(
        <AppProvider>
          <HomeScreen />
        </AppProvider>,
        { wrapper },
      );

      await act(async () => {
        fireEvent.press(getByTestId(labels.home.startRound.testID));
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to start round. Please try again.",
      );
      expect(reportError).toHaveBeenCalled();
    });
  });
});
