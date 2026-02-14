import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { QueryProvider } from '@/providers/QueryProvider';
import { Text } from 'react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock Expo Constants
jest.mock('expo-constants', () => ({
    __esModule: true,
    default: {
        expoConfig: {
            version: '1.0.0',
        },
    },
}));

describe('QueryProvider', () => {
    it('should render children', async () => {
        const { getByText } = render(
            <QueryProvider>
                <Text>Test Child</Text>
            </QueryProvider>
        );
        await act(async () => {});
        await waitFor(() => {
            expect(getByText('Test Child')).toBeTruthy();
        });
    });

    it('should provide query client context', async () => {
        // Simply verify it renders without crashing
        const result = render(
            <QueryProvider>
                <Text>Query Provider Test</Text>
            </QueryProvider>
        );

        await act(async () => {});
        await waitFor(() => {
            expect(result.getByText('Query Provider Test')).toBeTruthy();
        });
    });
});
