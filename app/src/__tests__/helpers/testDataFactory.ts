/**
 * Test data factory for creating realistic test fixtures
 */

import type { MockUser, MockEvent, MockBeer } from './mockSupabase';

let userIdCounter = 0;
let eventIdCounter = 0;
let beerIdCounter = 0;

export function resetCounters() {
    userIdCounter = 0;
    eventIdCounter = 0;
    beerIdCounter = 0;
}

/**
 * Create a test user
 */
export function createTestUser(overrides?: Partial<MockUser>): MockUser {
    userIdCounter++;
    return {
        id: `user_${userIdCounter}`,
        name: `TestUser${userIdCounter}`,
        is_admin: false,
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

/**
 * Create multiple test users
 */
export function createTestUsers(count: number, adminCount: number = 1): MockUser[] {
    const users: MockUser[] = [];
    
    // Create admins first
    for (let i = 0; i < adminCount; i++) {
        users.push(createTestUser({ is_admin: true, name: `Admin${i + 1}` }));
    }
    
    // Create regular users
    for (let i = adminCount; i < count; i++) {
        users.push(createTestUser({ name: `User${i + 1}` }));
    }
    
    return users;
}

/**
 * Create a test event
 */
export function createTestEvent(overrides?: Partial<MockEvent>): MockEvent {
    eventIdCounter++;
    return {
        id: `event_${eventIdCounter}`,
        name: `Test Night Out ${eventIdCounter}`,
        beer_price: 5.00,
        status: 'active',
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

/**
 * Create a test beer log
 */
export function createTestBeer(
    userId: string,
    eventId: string,
    timestamp?: string
): MockBeer {
    beerIdCounter++;
    return {
        id: `beer_${beerIdCounter}`,
        user_id: userId,
        event_id: eventId,
        added_by_user_id: userId,
        created_at: timestamp || new Date().toISOString(),
    };
}

/**
 * Create multiple beers with time spacing
 */
export function createTestBeersWithTiming(
    userId: string,
    eventId: string,
    count: number,
    minutesBetween: number = 10
): MockBeer[] {
    const beers: MockBeer[] = [];
    const baseTime = new Date();
    
    for (let i = 0; i < count; i++) {
        const timestamp = new Date(baseTime.getTime() + i * minutesBetween * 60 * 1000);
        beers.push(
            createTestBeer(userId, eventId, {
                created_at: timestamp.toISOString(),
            })
        );
    }
    
    return beers;
}

/**
 * Create a realistic event scenario:
 * - Multiple users
 * - One active event
 * - Beers logged over time
 * - Some users ahead, some behind
 */
export interface EventScenario {
    users: MockUser[];
    event: MockEvent;
    beers: MockBeer[];
    admin: MockUser;
}

export function createRealisticEventScenario(): EventScenario {
    resetCounters();
    
    // Create users
    const users = createTestUsers(5, 1);
    const admin = users[0]!; // First user is admin
    
    // Create event
    const event = createTestEvent({
        beer_price: 7.50, // Zurich prices!
    });
    
    // Create beers with realistic distribution
    const beers: MockBeer[] = [];
    
    // User 1 (admin) - 8 beers, steady pace
    beers.push(...createTestBeersWithTiming(users[0]!.id, event.id, 8, 15));
    
    // User 2 - 12 beers, aggressive (current leader)
    beers.push(...createTestBeersWithTiming(users[1]!.id, event.id, 12, 10));
    
    // User 3 - 7 beers, moderate
    beers.push(...createTestBeersWithTiming(users[2]!.id, event.id, 7, 20));
    
    // User 4 - 10 beers, consistent
    beers.push(...createTestBeersWithTiming(users[3]!.id, event.id, 10, 12));
    
    // User 5 - 3 beers, lightweight
    beers.push(...createTestBeersWithTiming(users[4]!.id, event.id, 3, 30));
    
    return { users, event, beers, admin };
}

/**
 * Create beers for testing Hat Trick achievement (3 beers in 60 minutes)
 */
export function createHatTrickBeers(userId: string, eventId: string): MockBeer[] {
    const baseTime = new Date();
    return [
        createTestBeer(userId, eventId, {
            created_at: baseTime.toISOString(),
        }),
        createTestBeer(userId, eventId, {
            created_at: new Date(baseTime.getTime() + 20 * 60 * 1000).toISOString(),
        }),
        createTestBeer(userId, eventId, {
            created_at: new Date(baseTime.getTime() + 40 * 60 * 1000).toISOString(),
        }),
    ];
}

/**
 * Create beers that should NOT trigger Hat Trick (3 beers in 61+ minutes)
 */
export function createAlmostHatTrickBeers(userId: string, eventId: string): MockBeer[] {
    const baseTime = new Date();
    return [
        createTestBeer(userId, eventId, {
            created_at: baseTime.toISOString(),
        }),
        createTestBeer(userId, eventId, {
            created_at: new Date(baseTime.getTime() + 30 * 60 * 1000).toISOString(),
        }),
        createTestBeer(userId, eventId, {
            created_at: new Date(baseTime.getTime() + 61 * 60 * 1000).toISOString(),
        }),
    ];
}
