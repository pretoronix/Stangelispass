import { parseScanPayload } from '@/utils/scanPayload';

describe('parseScanPayload', () => {
    test('parses JOIN_EVENT JSON payload', () => {
        const payload = JSON.stringify({
            type: 'JOIN_EVENT',
            eventId: 'e1',
            eventName: 'Friday',
        });

        expect(parseScanPayload(payload)).toEqual({
            type: 'join_event',
            eventId: 'e1',
            eventName: 'Friday',
        });
    });

    test('parses beer JSON payload', () => {
        const payload = JSON.stringify({
            userId: '11111111-1111-1111-1111-111111111111',
            eventId: '22222222-2222-2222-2222-222222222222',
        });

        expect(parseScanPayload(payload)).toEqual({
            type: 'beer_log',
            userId: '11111111-1111-1111-1111-111111111111',
            eventId: '22222222-2222-2222-2222-222222222222',
        });
    });

    test('parses STAMP_BEER JSON payload', () => {
        const payload = JSON.stringify({
            type: 'STAMP_BEER',
            userId: '11111111-1111-1111-1111-111111111111',
            eventId: '22222222-2222-2222-2222-222222222222',
        });

        expect(parseScanPayload(payload)).toEqual({
            type: 'beer_log',
            userId: '11111111-1111-1111-1111-111111111111',
            eventId: '22222222-2222-2222-2222-222222222222',
        });
    });

    test('parses one-time STAMP_BEER payload with stamp id', () => {
        const payload = JSON.stringify({
            type: 'STAMP_BEER',
            stampId: '33333333-3333-3333-3333-333333333333',
        });

        expect(parseScanPayload(payload)).toEqual({
            type: 'stamp_redeem',
            stampId: '33333333-3333-3333-3333-333333333333',
        });
    });

    test('parses legacy pipe payload', () => {
        expect(parseScanPayload('11111111-1111-1111-1111-111111111111|22222222-2222-2222-2222-222222222222')).toEqual({
            type: 'beer_log',
            userId: '11111111-1111-1111-1111-111111111111',
            eventId: '22222222-2222-2222-2222-222222222222',
        });
    });

    test('returns unknown for invalid payload', () => {
        expect(parseScanPayload('')).toEqual({ type: 'unknown' });
        expect(parseScanPayload('not-a-qr')).toEqual({ type: 'unknown' });
        expect(parseScanPayload('bad-user|bad-event')).toEqual({ type: 'unknown' });
        expect(parseScanPayload(JSON.stringify({
            type: 'SOMETHING_ELSE',
            userId: '11111111-1111-1111-1111-111111111111',
            eventId: '22222222-2222-2222-2222-222222222222',
        }))).toEqual({ type: 'unknown' });
    });

    test('parses admin log payload without type', () => {
        const payload = JSON.stringify({
            userId: '11111111-1111-1111-1111-111111111111',
            eventId: '22222222-2222-2222-2222-222222222222',
        });

        expect(parseScanPayload(payload)).toEqual({
            type: 'beer_log',
            userId: '11111111-1111-1111-1111-111111111111',
            eventId: '22222222-2222-2222-2222-222222222222',
        });
    });
});
