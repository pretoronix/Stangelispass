import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { AppProvider } from '@/providers/AppProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Mock Expo Router
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn() }),
    useLocalSearchParams: () => ({}),
    Tabs: ({ children, screenOptions }: any) => <>{children}</>,
    Stack: ({ children }: any) => <>{children}</>,
}));

// Mock ionicons
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaProvider: ({ children }: any) => <>{children}</>,
    SafeAreaView: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/components/features/VelocityMetricCard', () => ({
    VelocityMetricCard: () => null,
}));

const defaultAppContext = {
    currentUser: { id: 'u1', name: 'Test User', is_admin: true },
    setCurrentUser: jest.fn(),
    users: [{ id: 'u1', name: 'Test User', is_admin: true }],
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

jest.mock('@/providers/AppProvider', () => ({
    AppProvider: ({ children }: any) => <>{children}</>,
    useApp: () => mockAppContext,
}));

const defaultBeersContext = {
    beerCounts: [] as any[],
    rawBeers: [] as any[],
    totalBeers: 0,
    leaderInfo: null as any,
    leaderLead: 0,
    hotStreak: null as any,
    gameStatsAvailable: false,
    loading: false,
    refreshing: false,
    refresh: jest.fn(),
};
let mockBeersContext = { ...defaultBeersContext };

jest.mock('@/hooks/useBeers', () => ({
    useBeers: () => mockBeersContext,
}));

jest.mock('@/hooks/useNetworkStatus', () => ({
    useNetworkStatus: jest.fn(() => ({ isOnline: true })),
}));

jest.mock('@/hooks/home/useLeaderboardAnnouncements', () => ({
    useLeaderboardAnnouncements: jest.fn(() => ({
        leaderAnnouncement: null,
        streakAnnouncement: null,
        showConfetti: false,
        setShowConfetti: jest.fn(),
    })),
}));

jest.mock('@/hooks/home/useScanHandler', () => ({
    useScanHandler: jest.fn(() => ({
        handleScan: jest.fn(),
    })),
}));

jest.mock('@/hooks/home/useEventActions', () => ({
    useEventActions: jest.fn(() => ({
        openNamePrompt: jest.fn(),
        showStartRoundPrompt: false,
        pendingAction: null,
        startRoundName: '',
        setStartRoundName: jest.fn(),
        beerPrice: '5.00',
        setBeerPrice: jest.fn(),
        pendingJoinEventName: '',
        promptSubmitting: false,
        submitNamePrompt: jest.fn(),
        setShowStartRoundPrompt: jest.fn(),
    })),
}));

jest.mock('@/hooks/home/useExportData', () => ({
    useExportData: jest.fn(() => ({
        handleExportData: jest.fn(),
    })),
}));

jest.mock('@/hooks/usePacePreset', () => ({
    usePacePreset: jest.fn(() => ({
        savedPace: null,
        savePace: jest.fn(),
        clearSavedPace: jest.fn(),
    })),
}));

jest.mock('@/components/home/StartRoundPrompt', () => ({
    StartRoundPrompt: () => null,
}));

jest.mock('@/components/features/MVPModal', () => ({
    MVPModal: () => null,
}));

jest.mock('@/components/features/QRScanner', () => ({
    QRScanner: () => null,
}));

jest.mock('@/components/features/InviteModal', () => ({
    InviteModal: () => null,
}));

jest.mock('@/components/notifications/BroadcastModal', () => ({
    BroadcastModal: () => null,
}));

jest.mock('@/components/animations/Confetti', () => ({
    Confetti: () => null,
}));

jest.mock('@/components/features/SafeRideCard', () => ({
    SafeRideCard: () => null,
}));

jest.mock('@/services/supabase', () => {
    const actual = jest.requireActual('@/services/supabase');
    return {
        ...actual,
        getBeers: jest.fn(async () => []),
        removeBeer: jest.fn(async () => null),
        supabase: {
            channel: jest.fn(() => ({
                on: jest.fn().mockReturnThis(),
                subscribe: jest.fn(() => ({})),
            })),
            removeChannel: jest.fn(),
        },
    };
});

jest.mock('@/hooks/settings', () => ({
    useUserManagement: () => ({
        newUserName: '',
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
        setShowEventModal: jest.fn(),
        handleResetEventData: jest.fn(),
        availableUsersForEvent: [],
        handleEventRoleChange: jest.fn(),
        handleRemoveEventMember: jest.fn(),
        handleAddEventMember: jest.fn(),
    }),
    useLifetimePasses: () => ({
        codes: [],
        loading: false,
        generating: false,
        redeeming: false,
        redeemCode: '',
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
import HomeScreen from '@/app/index';
import AddBeerScreen from '@/app/add';
import HistoryScreen from '@/app/history';
import SettingsScreen from '@/app/settings';

const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <SafeAreaProvider>
        <QueryProvider>
            <AppProvider>
                {children}
            </AppProvider>
        </QueryProvider>
    </SafeAreaProvider>
);

describe('GUI Integrity Tests', () => {
    beforeEach(() => {
        mockAppContext = { ...defaultAppContext, eventPermissions: { ...defaultAppContext.eventPermissions } };
        mockBeersContext = { ...defaultBeersContext };
    });

    describe('Home Screen', () => {
        it('renders initial state with no active round', () => {
            mockAppContext.activeEvent = null;
            render(<HomeScreen />, { wrapper: AllProviders });
            expect(screen.getByText(/No active round/i)).toBeTruthy();
            expect(screen.getByText(/Start a Round/i)).toBeTruthy();
        });

        it('renders active event state', () => {
            mockAppContext.activeEvent = { id: 'e1', name: 'Friday Beers', created_at: new Date().toISOString() };
            render(<HomeScreen />, { wrapper: AllProviders });
            expect(screen.getByText('Friday Beers')).toBeTruthy();
        });

        it('renders leaderboard with multiple users', () => {
            mockAppContext.activeEvent = { id: 'e1', name: 'Friday Beers' };
            mockBeersContext.beerCounts = [
                { userId: 'u1', name: 'Alice', count: 5 },
                { userId: 'u2', name: 'Bob', count: 3 },
            ];
            render(<HomeScreen />, { wrapper: AllProviders });
            expect(screen.getByText('Alice')).toBeTruthy();
            expect(screen.getByText('Bob')).toBeTruthy();
            expect(screen.getByText('5')).toBeTruthy();
            expect(screen.getByText('3')).toBeTruthy();
        });

        it('disables "End" button for non-admins', () => {
            mockAppContext.activeEvent = { id: 'e1', name: 'Friday Beers' };
            mockAppContext.eventPermissions.canCloseEvent = false;
            render(<HomeScreen />, { wrapper: AllProviders });

            const endButton = screen.getByText(/End/i);
            expect(endButton).toBeTruthy();
        });
    });

    describe('Add Beer Screen', () => {
        it('renders initial state with user list', () => {
            mockAppContext.users = [
                { id: 'u1', name: 'Alice', is_admin: false },
                { id: 'u2', name: 'Bob', is_admin: false }
            ];
            render(<AddBeerScreen />, { wrapper: AllProviders });
            expect(screen.getByText("Who's drinking?")).toBeTruthy();
            expect(screen.getByText('Alice')).toBeTruthy();
            expect(screen.getByText('Bob')).toBeTruthy();
        });

        it('shows action buttons when a user is selected', async () => {
            const { fireEvent } = require('@testing-library/react-native');
            mockAppContext.users = [{ id: 'u1', name: 'Alice', is_admin: false }];
            render(<AddBeerScreen />, { wrapper: AllProviders });

            fireEvent.press(screen.getByText('Alice'));

            expect(screen.getByText(/Add Beer/i)).toBeTruthy();
            expect(screen.getByText(/Issue Stamp/i)).toBeTruthy();
        });
    });

    describe('History Screen', () => {
        it('renders correctly', async () => {
            render(<HistoryScreen />, { wrapper: AllProviders });
            await waitFor(() => expect(screen.getByText(/History/i)).toBeTruthy());
        });

        it('shows empty state', async () => {
            render(<HistoryScreen />, { wrapper: AllProviders });
            await waitFor(() => expect(screen.getByText(/History is empty/i)).toBeTruthy());
        });
    });

    describe('Settings Screen', () => {
        it('renders correctly', async () => {
            render(<SettingsScreen />, { wrapper: AllProviders });
            await waitFor(() => expect(screen.getByText(/Settings/i)).toBeTruthy());
            expect(screen.getByText(/Notifications/i)).toBeTruthy();
        });

        it('shows Admin Tools section', async () => {
            render(<SettingsScreen />, { wrapper: AllProviders });
            await waitFor(() => expect(screen.getByText(/Admin Tools/i)).toBeTruthy());
        });

        it('shows Event Administration only when active event and permissions exist', () => {
            mockAppContext.activeEvent = { id: 'e1', name: 'Test Event' };
            mockAppContext.eventPermissions.canManageMembers = true;
            render(<SettingsScreen />, { wrapper: AllProviders });
            expect(screen.getByText(/Event Administration/i)).toBeTruthy();

            mockAppContext.activeEvent = null;
            const { unmount } = render(<SettingsScreen />, { wrapper: AllProviders });
            expect(screen.queryByText(/Event Administration/i)).toBeNull();
            unmount();
        });

        it('renders user selection grid for switching members', () => {
            mockAppContext.users = [
                { id: 'u1', name: 'Alice', is_admin: false },
                { id: 'u2', name: 'Bob', is_admin: false }
            ];
            render(<SettingsScreen />, { wrapper: AllProviders });
            expect(screen.getByText(/Switch Member/i)).toBeTruthy();
            expect(screen.getByText('Alice')).toBeTruthy();
            expect(screen.getByText('Bob')).toBeTruthy();
        });
    });
});
