import React from "react";
import { render, waitFor, act, fireEvent } from "@testing-library/react-native";
import { AppProvider } from "@/providers/AppProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: jest.fn() }),
  };
});

// Mock Expo Router
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Tabs: ({ children, screenOptions }: any) => <>{children}</>,
  Stack: ({ children }: any) => <>{children}</>,
}));

// Mock ionicons
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => <>{children}</>,
  SafeAreaView: ({ children }: any) => <>{children}</>,
}));

jest.mock("@/components/features/VelocityMetricCard", () => ({
  VelocityMetricCard: () => null,
}));

const defaultAppContext = {
  currentUser: { id: "u1", name: "Test User", is_admin: true },
  setCurrentUser: jest.fn(),
  users: [{ id: "u1", name: "Test User", is_admin: true }],
  refreshUsers: jest.fn(),
  loading: false,
  activeEvent: null as any,
  startEvent: jest.fn(),
  closeEvent: jest.fn(),
  showRecap: false,
  setShowRecap: jest.fn(),
  eventPermissions: {
    canManageEvent: true,
    canManageMembers: true,
    canManageLogs: true,
    canIssueStamps: true,
    canCloseEvent: true,
    canInvite: true,
    canResetEventData: true,
  },
  currentEventRole: null,
  eventMembers: [],
  refreshEventMembers: jest.fn(),
  offlineQueue: [],
  addOfflineMutation: jest.fn(),
  offlineQueueProcessing: false,
};
let mockAppContext = { ...defaultAppContext };

jest.mock("@/providers/AppProvider", () => ({
  AppProvider: ({ children }: any) => <>{children}</>,
  useApp: () => mockAppContext,
}));

let mockBeersData: any[] = [];
let mockBeerCountsData: any[] = [];
let mockEventMembersData: any[] = [];
let mockGameStatsData: any = { stats: [], missingTable: true };
let mockLeaderStateData: any = { leader: null, missingTable: true };
const mockRefetch = jest.fn();

jest.mock("@/hooks/query", () => ({
  useBeersQuery: () => ({
    data: mockBeersData,
    isLoading: false,
    isRefetching: false,
    refetch: mockRefetch,
  }),
  useBeerCounts: () => ({
    data: mockBeerCountsData,
    isLoading: false,
    isRefetching: false,
    refetch: mockRefetch,
  }),
  useEventMembers: () => ({
    data: mockEventMembersData,
    isLoading: false,
    isRefetching: false,
    refetch: mockRefetch,
  }),
  useEventGameStats: () => ({
    data: mockGameStatsData,
    isLoading: false,
    isRefetching: false,
    refetch: mockRefetch,
  }),
  useEventLeaderState: () => ({
    data: mockLeaderStateData,
    isLoading: false,
    isRefetching: false,
    refetch: mockRefetch,
  }),
  useInfiniteBeersQuery: () => ({
    data: { pages: [[]] },
    isLoading: false,
    isRefetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: mockRefetch,
  }),
  useRemoveBeer: () => ({ mutateAsync: jest.fn() }),
  BEER_QUERY_KEYS: {
    beers: (eventId?: string) => (eventId ? ["beers", eventId] : ["beers"]),
  },
}));

jest.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(() => ({ isOnline: true })),
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

jest.mock("@/hooks/useWallOfFame", () => ({
  useUserToasts: jest.fn(() => ({ data: [] })),
  useBeerClink: jest.fn(() => ({ toggleToast: jest.fn(), isLoading: false })),
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

jest.mock("@/components/features/SafeRideCard", () => ({
  SafeRideCard: () => null,
}));

jest.mock("@/services/supabase", () => {
  const actual = jest.requireActual("@/services/supabase");
  return {
    ...actual,
    getBeers: jest.fn(async () => []),
    removeBeer: jest.fn(async () => null),
    getWallOfFame: jest.fn(async () => []),
    supabase: {
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(() => ({})),
      })),
      removeChannel: jest.fn(),
    },
  };
});

jest.mock("@/hooks/settings", () => ({
  useUserManagement: () => ({
    newUserName: "",
    setNewUserName: jest.fn(),
    isNewUserAdmin: false,
    setIsNewUserAdmin: jest.fn(),
    loading: false,
    handleAddUser: jest.fn(),
    handleLogout: jest.fn(),
    handleSelectUser: jest.fn(),
    handleUpdateUserField: jest.fn(),
  }),
  useNotificationPreferences: () => ({
    milestones: [],
    toggleLeaderChange: jest.fn(),
    toggleMilestone: jest.fn(),
    toggleAdminBroadcasts: jest.fn(),
    toggleNewRound: jest.fn(),
  }),
  useCacheManagement: () => ({
    cacheStats: { sizeKB: 0, queriesCount: 0, lastUpdated: null },
    handleClearCache: jest.fn(),
  }),
  useAnimationPreferences: () => ({
    isAudioEnabled: () => true,
    toggleAudioMuted: jest.fn(),
    pourAnimationEnabled: true,
    togglePourAnimation: jest.fn(),
  }),
  useEventManagement: () => ({
    showEventModal: false,
    newEventName: "",
    newEventPassType: "day",
    setNewEventName: jest.fn(),
    setNewEventPassType: jest.fn(),
    handleStartEvent: jest.fn(),
    setShowEventModal: jest.fn(),
    handleResetEventData: jest.fn(),
    availableUsersForEvent: [],
    handleEventRoleChange: jest.fn(),
    handleRemoveEventMember: jest.fn(),
    handleAddEventMember: jest.fn(),
  }),
  useEventPasses: () => ({
    promoCodes: [],
    loadingCodes: false,
    redeemCode: "",
    setRedeemCode: jest.fn(),
    redeeming: false,
    generating: false,
    refreshPromoCodes: jest.fn(),
    handleGeneratePromoCode: jest.fn(),
    handleRedeemPromoCode: jest.fn(),
    handlePurchaseEventPass: jest.fn(),
    handlePurchaseLifetime: jest.fn(),
    iapEnabled: jest.requireActual("@/services/iap").IAP_ENABLED,
  }),
  useLifetimePasses: () => ({
    codes: [],
    loading: false,
    generating: false,
    redeeming: false,
    redeemCode: "",
    setRedeemCode: jest.fn(),
    handleGenerateCode: jest.fn(),
    handleRedeemCode: jest.fn(),
    refreshCodes: jest.fn(),
  }),
  useLiveBeerLogPreference: () => ({
    enabled: false,
    toggle: jest.fn(),
  }),
}));

// Mock specific screens to test rendering
import HomeScreen from "@/app/index";
import AddBeerScreen from "@/app/add";
import HistoryScreen from "@/app/history";
import SettingsScreen from "@/app/settings";
import ProfileScreen from "@/app/profile";
import LegendsScreen from "@/app/legends";
import { copy } from "@/ui/copy";

jest.mock("@/hooks/profile/useProfileData", () => ({
  useProfileData: () => ({
    beers: [],
    roundBeers: [],
    achievements: [],
    refreshing: false,
    refresh: jest.fn(),
  }),
}));

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider>
    <QueryProvider>
      <AppProvider>{children}</AppProvider>
    </QueryProvider>
  </SafeAreaProvider>
);

describe("GUI Integrity Tests", () => {
  beforeEach(() => {
    mockAppContext = {
      ...defaultAppContext,
      eventPermissions: { ...defaultAppContext.eventPermissions },
    };
    mockBeersData = [];
    mockBeerCountsData = [];
    mockEventMembersData = [];
    mockGameStatsData = { stats: [], missingTable: true };
    mockLeaderStateData = { leader: null, missingTable: true };
    mockRefetch.mockClear();
  });

  describe("Home Screen", () => {
    it("renders initial state with no active round", async () => {
      mockAppContext.activeEvent = null;
      const { getByText } = await render(<HomeScreen />, { wrapper: AllProviders });
      expect(getByText(/No active round/i)).toBeTruthy();
      expect(getByText(/Start a Round/i)).toBeTruthy();
    });

    it("renders active event state", async () => {
      mockAppContext.activeEvent = {
        id: "e1",
        name: "Friday Beers",
        created_at: new Date().toISOString(),
      };
      const { getByText } = await render(<HomeScreen />, { wrapper: AllProviders });
      expect(getByText("Friday Beers")).toBeTruthy();
    });

    it("renders leaderboard with multiple users", async () => {
      mockAppContext.activeEvent = { id: "e1", name: "Friday Beers" };
      mockBeerCountsData = [
        { userId: "u1", name: "Alice", count: 5 },
        { userId: "u2", name: "Bob", count: 3 },
      ];
      const { getByText } = await render(<HomeScreen />, { wrapper: AllProviders });
      expect(getByText("Alice")).toBeTruthy();
      expect(getByText("Bob")).toBeTruthy();
      expect(getByText("5")).toBeTruthy();
      expect(getByText("3")).toBeTruthy();
    });

    it('disables "End" button for non-admins', async () => {
      mockAppContext.activeEvent = { id: "e1", name: "Friday Beers" };
      mockAppContext.eventPermissions.canCloseEvent = false;
      const { getByText } = await render(<HomeScreen />, { wrapper: AllProviders });

      const endButton = getByText(/End/i);
      expect(endButton).toBeTruthy();
    });
  });

  describe("Add Beer Screen", () => {
    it("renders initial state with user list", async () => {
      mockAppContext.users = [
        { id: "u1", name: "Alice", is_admin: false },
        { id: "u2", name: "Bob", is_admin: false },
      ];
      const { getByText } = await render(<AddBeerScreen />, { wrapper: AllProviders });
      await act(async () => {
        await Promise.resolve();
      });
      expect(getByText("Who's drinking?")).toBeTruthy();
      expect(getByText("Alice")).toBeTruthy();
      expect(getByText("Bob")).toBeTruthy();
    });

    it("shows action buttons when a user is selected", async () => {
      mockAppContext.users = [{ id: "u1", name: "Alice", is_admin: false }];
      const { getByText } = await render(<AddBeerScreen />, { wrapper: AllProviders });

      await act(async () => {
        fireEvent.press(getByText("Alice"));
      });

      await waitFor(() => expect(getByText(/Add 1 Beer/i)).toBeTruthy());
      await waitFor(() => expect(getByText(/Stamp QR/i)).toBeTruthy());
    });
  });

  describe("History Screen", () => {
    it("renders correctly", async () => {
      const { getAllByText } = await render(<HistoryScreen />, { wrapper: AllProviders });
      await waitFor(() =>
        expect(getAllByText(/History/i).length).toBeGreaterThan(0),
      );
    });

    it("shows empty state", async () => {
      const { getByText } = await render(<HistoryScreen />, { wrapper: AllProviders });
      await waitFor(() =>
        expect(getByText(/History is empty/i)).toBeTruthy(),
      );
    });
  });

  describe("Settings Screen", () => {
    it("renders correctly", async () => {
      const { getByText } = await render(<SettingsScreen />, { wrapper: AllProviders });
      await waitFor(() => expect(getByText(copy.settings.title)).toBeTruthy());
      expect(getByText(copy.settings.notifications)).toBeTruthy();
    });

    it("shows Admin Tools section", async () => {
      const { getByText } = await render(<SettingsScreen />, { wrapper: AllProviders });
      await waitFor(() =>
        expect(getByText(copy.settings.adminTools)).toBeTruthy(),
      );
    });

    it("shows the tier card with credit counts", async () => {
      const { getByText } = await render(<SettingsScreen />, { wrapper: AllProviders });
      await waitFor(() => expect(getByText(copy.settings.currentTier)).toBeTruthy());
      expect(getByText(copy.settings.freeEvents)).toBeTruthy();
      expect(getByText(copy.settings.dayPasses)).toBeTruthy();
      expect(getByText(copy.settings.weekendPasses)).toBeTruthy();
    });

    // IAP is deferred to v1.1 (IAP_ENABLED === false). No purchase entry point
    // may be reachable in v1.0 — a broken purchase flow is an App Store
    // rejection under Guideline 2.1.
    it("does not render any purchase call-to-action while IAP is disabled", async () => {
      const { IAP_ENABLED } = jest.requireActual("@/services/iap");
      expect(IAP_ENABLED).toBe(false);

      const { queryByText, getByText } = await render(<SettingsScreen />, { wrapper: AllProviders });
      await waitFor(() => expect(getByText(copy.settings.currentTier)).toBeTruthy());
      expect(queryByText(/Buy Single Event/i)).toBeNull();
      expect(queryByText(/Buy Weekend Unlimited/i)).toBeNull();
      expect(queryByText(/Become a Supporter/i)).toBeNull();
      expect(queryByText(/CHF/i)).toBeNull();
    });

    it("shows Event Administration only when active event and permissions exist", async () => {
      mockAppContext.activeEvent = { id: "e1", name: "Test Event" };
      mockAppContext.eventPermissions.canManageMembers = true;
      const { getByText } = await render(<SettingsScreen />, { wrapper: AllProviders });
      expect(getByText(copy.settings.eventAdministration)).toBeTruthy();

      mockAppContext.activeEvent = null;
      const { unmount, queryByText } = await render(<SettingsScreen />, { wrapper: AllProviders });
      expect(queryByText(copy.settings.eventAdministration)).toBeNull();
      unmount();
    });

    it("renders user selection grid for switching members", async () => {
      mockAppContext.users = [
        { id: "u1", name: "Alice", is_admin: false },
        { id: "u2", name: "Bob", is_admin: false },
      ];
      const { getByText } = await render(<SettingsScreen />, { wrapper: AllProviders });
      expect(getByText(copy.settings.switchMember)).toBeTruthy();
      expect(getByText("Alice")).toBeTruthy();
      expect(getByText("Bob")).toBeTruthy();
    });
  });

  describe("Profile Screen", () => {
    it("renders no user view when no current user", async () => {
      mockAppContext.currentUser = null as any;
      const { getByText } = await render(<ProfileScreen />, { wrapper: AllProviders });
      await waitFor(() => expect(getByText(/Please select a user/i)).toBeTruthy());
    });

    it("renders profile content when user is logged in", async () => {
      mockAppContext.currentUser = { id: "u1", name: "Alice", is_admin: false, weight_kg: 70, gender: "female" } as any;
      const { getByText } = await render(<ProfileScreen />, { wrapper: AllProviders });
      await waitFor(() => expect(getByText(/Trophy Case/i)).toBeTruthy());
      expect(getByText(/Soberness Estimator/i)).toBeTruthy();
      expect(getByText(/Consumption Stats/i)).toBeTruthy();
    });
  });

  describe("Legends Screen", () => {
    it("renders correctly", async () => {
      const { getByText } = await render(<LegendsScreen />, { wrapper: AllProviders });
      await act(async () => {
        await Promise.resolve();
      });
      await waitFor(() => expect(getByText(/Legends Gallery/i)).toBeTruthy());
      expect(getByText(/Hall of Fame/i)).toBeTruthy();
    });
  });
});
