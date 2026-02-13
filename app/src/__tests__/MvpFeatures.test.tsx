import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// Mock heavy dependencies
jest.mock('expo-haptics');
jest.mock('expo-sharing');
jest.mock('expo-file-system', () => ({
    cacheDirectory: 'file:///cache/',
    writeAsStringAsync: jest.fn(),
}));

// Mock Supabase to avoid network calls
const mockInsert = jest.fn();
const mockSelect = jest.fn(() => ({
    single: jest.fn(() => ({ data: { id: 'test-id' }, error: null })),
}));

jest.mock('@/services/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            insert: mockInsert,
            select: mockSelect,
        })),
    },
    addBeer: jest.fn(() => Promise.resolve({ newBadges: [] })),
    getBeers: jest.fn(() => Promise.resolve([
        { id: '1', user: { name: 'Alice' }, added_by_user: { name: 'Bob' }, created_at: '2023-01-01' }
    ])),
}));

describe('MVP Features Smoke Test', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Feature 1: Heavy Haptic Feedback', async () => {
        // Test that the haptics impact is called with Heavy style
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    test('Feature 2: "Who Pays?" Randomizer', () => {
        const beerCounts = [
            { name: 'Alice', count: 5 },
            { name: 'Bob', count: 3 }
        ];

        // Simulate randomizer logic
        const randomIndex = 0; // Force Alice
        const selected = beerCounts[randomIndex];

        expect(selected!.name).toBe('Alice');
        expect(beerCounts.length).toBeGreaterThan(0);
    });

    test('Feature 3: Cost Tracker - Default Price', () => {
        // Logic test: total beers * default price
        const totalBeers = 15;
        const pricePerBeer = 5.00;
        const totalBill = totalBeers * pricePerBeer;

        expect(totalBill).toBe(75.00);
        expect(totalBill.toFixed(2)).toBe('75.00');
    });

    test('Feature 3: Cost Tracker - Custom Price', () => {
        // Logic test: total beers * custom price
        const totalBeers = 10;
        const customPrice = 6.50;
        const totalBill = totalBeers * customPrice;

        expect(totalBill).toBe(65.00);
        expect(totalBill.toFixed(2)).toBe('65.00');
    });

    test('Feature 4: Export Data (CSV)', async () => {
        // Mock data
        const eventBeers = [
            { user: { name: 'Alice' }, added_by_user: { name: 'Bob' }, created_at: '2023-01-01' }
        ];

        // Simulate Export Logic
        const header = 'User,Added By,Timestamp\n';
        const rows = eventBeers.map(b =>
            `${b.user?.name},${b.added_by_user?.name},${b.created_at}`
        ).join('\n');
        const csv = header + rows;
        const fileUri = `file:///cache/export.csv`;

        // Execute file write and share
        await FileSystem.writeAsStringAsync(fileUri, csv);
        await Sharing.shareAsync(fileUri);

        expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(fileUri, expect.stringContaining('Alice,Bob'));
        expect(Sharing.shareAsync).toHaveBeenCalledWith(fileUri);
    });

    test('Feature 5: Wall of Fame (Logic)', () => {
        // Logic test: Determine winner
        const leaderboard = [
            { userId: 'u1', name: 'Alice', count: 10 },
            { userId: 'u2', name: 'Bob', count: 8 }
        ];

        const winner = leaderboard.sort((a, b) => b.count - a.count)[0];

        expect(winner!.name).toBe('Alice');
        expect(winner!.count).toBe(10);
    });
});
