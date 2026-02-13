import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeScreen from '@/app/index';
import AddBeerScreen from '@/app/add';
import SettingsScreen from '@/app/settings';
import { labels } from '@/ui/labels';

// Create a query client for tests
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

// Wrapper component
const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

const renderWithProviders = (ui: React.ReactElement) => {
    return render(ui, { wrapper: AllTheProviders });
};

const activeEvent = {
    id: 'e1',
    name: 'Round 1',
    created_by: 'u1',
    is_active: true,
    pass_type: 'free' as const,
    expires_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
};

const mockUseAppState = {
    currentUser: { id: 'u1', name: 'Test', is_admin: true },
    setCurrentUser: jest.fn(),
    users: [{ id: 'u1', name: 'Test', is_admin: true }],
    refreshUsers: jest.fn(),
    isAdmin: true,
    loading: false,
    activeEvent: activeEvent as any,
    startEvent: jest.fn(),
    closeEvent: jest.fn(),
    showRecap: false,
    setShowRecap: jest.fn(),
    remoteAvailable: true,
    currentEventRole: 'owner',
    eventPermissions: {
        canManageEvent: true,
        canManageMembers: true,
        canManageLogs: true,
        canIssueStamps: true,
        canCloseEvent: true,
        canInvite: true,
        canResetEventData: true,
    },
    eventMembers: [],
    refreshEventMembers: jest.fn(),
};

jest.mock('@/hooks/useBeers', () => ({
    useBeers: () => ({
        beerCounts: [],
        rawBeers: [],
        totalBeers: 0,
        leaderInfo: null,
        leaderLead: 0,
        hotStreak: null,
        gameStatsAvailable: false,
        loading: false,
        refreshing: false,
        refresh: jest.fn(),
    }),
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
}));

jest.mock('expo-router', () => ({
    router: {
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    },
}));

jest.mock('@/providers/AppProvider', () => ({
    useApp: () => mockUseAppState,
}));

jest.mock('@/components/features/InviteModal', () => ({
    InviteModal: () => null,
}));

jest.mock('@/components/features/QRScanner', () => ({
    QRScanner: () => null,
}));

jest.mock('@/components/features/VelocityMetricCard', () => ({
    VelocityMetricCard: () => null,
}));

jest.mock('expo-blur', () => ({
    BlurView: () => null,
}));

jest.mock('@/services/audio', () => ({
    audioService: {
        setMuted: jest.fn(),
        getMuted: jest.fn(() => true),
        playPsst: jest.fn(),
    },
}));

jest.mock('@/services/supabase', () => ({
    addBeer: jest.fn(() => Promise.resolve({ newBadges: [] })),
    getBeers: jest.fn(() => Promise.resolve([])),
    addUser: jest.fn(() => Promise.resolve({ id: 'u1', name: 'Test', is_admin: true })),
    updateUser: jest.fn(() => Promise.resolve(true)),
    resetEventData: jest.fn(() => Promise.resolve([])),
    normalizeNotificationPrefs: jest.fn((prefs) => prefs || ({ leader_change: true, milestones: [5, 10, 20] })),
    upsertEventMemberRole: jest.fn(() => Promise.resolve(true)),
    removeEventMember: jest.fn(() => Promise.resolve(true)),
    redeemBeerStamp: jest.fn(() => Promise.resolve({ ok: false, reason: 'invalid' })),
    joinEvent: jest.fn(() => Promise.resolve({ ok: true })),
    createBeerStamp: jest.fn(() => Promise.resolve({ stamp: { id: 's1' } })),
    getEventMembership: jest.fn(() => Promise.resolve({ membership: null, missingTable: false })),
    getEventMembers: jest.fn(() => Promise.resolve([])),
    getPermissionsForRole: jest.fn(() => ({
        canManageEvent: true,
        canManageMembers: true,
        canManageLogs: true,
        canIssueStamps: true,
        canCloseEvent: true,
        canInvite: true,
        canResetEventData: true,
    })),
}));

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
    notificationAsync: jest.fn(() => Promise.resolve()),
    selectionAsync: jest.fn(() => Promise.resolve()),
    ImpactFeedbackStyle: { Heavy: 'heavy', Medium: 'medium' },
    NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

jest.mock('expo-sharing', () => ({
    isAvailableAsync: jest.fn(() => Promise.resolve(false)),
    shareAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
    cacheDirectory: 'file:///cache/',
    writeAsStringAsync: jest.fn(),
    EncodingType: { Base64: 'base64' },
}));

jest.mock('@/services/notifications', () => ({
    registerForPushNotificationsAsync: jest.fn(() => Promise.resolve(true)),
}));

describe('UI labels', () => {
    beforeEach(() => {
        mockUseAppState.activeEvent = activeEvent;
        queryClient.clear();
    });

    test('home labels exist', () => {
        mockUseAppState.activeEvent = null;
        const noEvent = renderWithProviders(<HomeScreen />);
        expect(noEvent.getByTestId(labels.home.startRound.testID)).toBeTruthy();

        mockUseAppState.activeEvent = activeEvent;
        const withEvent = renderWithProviders(<HomeScreen />);
        expect(withEvent.getByTestId(labels.home.scan.testID)).toBeTruthy();
        expect(withEvent.getByTestId(labels.home.export.testID)).toBeTruthy();
        expect(withEvent.getByTestId(labels.home.invite.testID)).toBeTruthy();
        expect(withEvent.getByTestId(labels.home.whoPays.testID)).toBeTruthy();
        expect(withEvent.getByTestId(labels.home.endRound.testID)).toBeTruthy();
    });

    test('add screen labels exist', () => {
        const { getByTestId, getByText } = renderWithProviders(<AddBeerScreen />);
        fireEvent.press(getByText('Test'));
        fireEvent.press(getByText('User QR (Admin Log)'));
        expect(getByTestId(labels.add.addBeer.testID)).toBeTruthy();
        expect(getByTestId(labels.add.stampQr.testID)).toBeTruthy();
        expect(getByTestId(labels.add.userQr.testID)).toBeTruthy();
        expect(getByTestId(labels.add.shareQr.testID)).toBeTruthy();
    });

    test('settings labels exist', () => {
        const { getByTestId } = renderWithProviders(<SettingsScreen />);
        expect(getByTestId(labels.settings.switchUser.testID)).toBeTruthy();
        expect(getByTestId(labels.settings.addUser.testID)).toBeTruthy();
        expect(getByTestId(labels.settings.startEvent.testID)).toBeTruthy();
        expect(getByTestId(labels.settings.resetEvent.testID)).toBeTruthy();
    });
});
