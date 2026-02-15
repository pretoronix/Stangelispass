import { estimateBAC } from '../services/safety';
import { User } from '../services/types';

describe('Safe Ride: BAC Estimation', () => {
    const mockUser: User = {
        id: 'user-1',
        name: 'Test User',
        is_admin: false,
        created_at: new Date().toISOString(),
        physiology: {
            weight_kg: 80,
            gender: 'male',
        },
    } as any;

    test('returns 0 BAC when no beers are consumed', () => {
        const stats = estimateBAC(0, new Date(), mockUser);
        expect(stats.bac).toBe(0);
        expect(stats.canDrive).toBe(true);
    });

    test('calculates BAC correctly for 4 beers', () => {
        // 4 beers * 13g = 52g alcohol
        // Weight 80kg, r 0.68 -> 54.4
        // 52 / 54.4 = ~0.95 ‰
        // Instantaneous (0 hours since start)
        const stats = estimateBAC(4, new Date(), mockUser);
        expect(stats.bac).toBeCloseTo(0.96, 1);
        expect(stats.canDrive).toBe(false);
    });

    test('accounts for metabolism over time', () => {
        const startTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
        const stats = estimateBAC(4, startTime, mockUser);
        // ~0.96 - (0.15 * 2) = 0.66
        expect(stats.bac).toBeLessThan(0.96);
        expect(stats.bac).toBeCloseTo(0.66, 1);
    });

    test('returns accurate clearInHours', () => {
        const stats = estimateBAC(4, new Date(), mockUser);
        // 0.96 / 0.15 = ~6.4 hours
        expect(stats.clearInHours).toBeGreaterThan(6);
    });
});
