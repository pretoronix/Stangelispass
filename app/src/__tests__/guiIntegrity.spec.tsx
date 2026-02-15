import React from 'react';
import { render, screen } from '@testing-library/react-native';
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
    it('renders Home Screen correctly', () => {
        render(<HomeScreen />, { wrapper: AllProviders });
        // Check for key elements in Home Screen
        expect(screen.getByText(/Leaderboard/i)).toBeTruthy();
        expect(screen.getByText(/Total Beers/i)).toBeTruthy();
    });

    it('renders Add Beer Screen correctly', () => {
        render(<AddBeerScreen />, { wrapper: AllProviders });
        // Check for key elements in Add Beer Screen
        expect(screen.getByText(/Who's drinking?/i)).toBeTruthy();
    });

    it('renders History Screen correctly', () => {
        render(<HistoryScreen />, { wrapper: AllProviders });
        // Check for key elements in History Screen
        expect(screen.getByText(/Recent Activity/i)).toBeTruthy();
    });

    it('renders Settings Screen correctly', () => {
        render(<SettingsScreen />, { wrapper: AllProviders });
        // Check for key elements in Settings Screen
        expect(screen.getByText(/App Settings/i)).toBeTruthy();
        expect(screen.getByText(/Notifications/i)).toBeTruthy();
    });
});
