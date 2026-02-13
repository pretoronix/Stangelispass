export type ParsedScanPayload =
    | { type: 'join_event'; eventId?: string; eventName?: string }
    | { type: 'stamp_redeem'; stampId: string }
    | { type: 'beer_log'; userId: string; eventId?: string }
    | { type: 'unknown' };

const isLikelyId = (value: string | undefined) => {
    if (!value) return false;
    // Accept UUIDs and local sentinel IDs used by offline fallback.
    return /^[0-9a-fA-F-]{8,}$/.test(value) || value === 'local';
};

const isLikelyStampId = (value: string | undefined) => {
    if (!value) return false;
    return /^[0-9a-fA-F-]{8,}$/.test(value);
};

export function parseScanPayload(raw: string): ParsedScanPayload {
    if (!raw || typeof raw !== 'string') {
        return { type: 'unknown' };
    }

    try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.type === 'JOIN_EVENT') {
            return {
                type: 'join_event',
                eventId: typeof parsed.eventId === 'string' ? parsed.eventId : undefined,
                eventName: typeof parsed.eventName === 'string' ? parsed.eventName : undefined,
            };
        }
        if (parsed && typeof parsed.userId === 'string') {
            const userId = parsed.userId.trim();
            const eventId = typeof parsed.eventId === 'string' ? parsed.eventId.trim() : undefined;
            if (!isLikelyId(userId)) return { type: 'unknown' };
            if (eventId && !isLikelyId(eventId)) return { type: 'unknown' };
            if (parsed.type && parsed.type !== 'STAMP_BEER') return { type: 'unknown' };
            return {
                type: 'beer_log',
                userId,
                eventId,
            };
        }
        if (parsed && parsed.type === 'STAMP_BEER' && typeof parsed.stampId === 'string') {
            const stampId = parsed.stampId.trim();
            if (!isLikelyStampId(stampId)) return { type: 'unknown' };
            return { type: 'stamp_redeem', stampId };
        }
    } catch (_err) {
        // Fall through to legacy payload parsing.
    }

    if (!raw.includes('|')) {
        return { type: 'unknown' };
    }

    const [userId, eventId] = raw.split('|');
    if (userId && userId.trim().length > 0 && isLikelyId(userId.trim())) {
        const safeEventId = eventId && eventId.trim().length > 0 ? eventId.trim() : undefined;
        if (safeEventId && !isLikelyId(safeEventId)) return { type: 'unknown' };
        return {
            type: 'beer_log',
            userId: userId.trim(),
            eventId: safeEventId,
        };
    }

    return { type: 'unknown' };
}
