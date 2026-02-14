import { buildLocalEvent, getPassExpiresAt } from '@/providers/appProviderUtils';

describe('appProviderUtils', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('getPassExpiresAt respects pass durations', () => {
        expect(getPassExpiresAt('day')).toBe('2026-01-02T00:00:00.000Z');
        expect(getPassExpiresAt('week')).toBe('2026-01-08T00:00:00.000Z');
        expect(getPassExpiresAt('year')).toBe('2027-01-01T00:00:00.000Z');
        expect(getPassExpiresAt('free')).toBe('2026-01-02T00:00:00.000Z');
    });

    test('buildLocalEvent uses free pass and correct expiry', () => {
        const event = buildLocalEvent();
        expect(event.pass_type).toBe('free');
        expect(event.expires_at).toBe('2026-01-02T00:00:00.000Z');
    });
});
