// Re-export types for convenience
export type { Event, EventMembership, EventGameStats, EventLeaderState, EventLeaderSnapshot, EventRole } from './types';

/**
 * Event operations module
 * Handles all event-related database operations including memberships and game stats
 */

export {
    getEventMembership,
    getEventMembers,
    upsertEventMemberRole,
    removeEventMember,
    joinEvent,
} from './events/memberships';

export {
    getEventGameStats,
    getEventLeaderState,
} from './events/stats';

export {
    getWallOfFame,
    addToWallOfFame,
} from './events/wallOfFame';

export { createLeaderEventSnapshot } from './events/leaderSnapshots';

export { resetEventData } from './events/reset';
