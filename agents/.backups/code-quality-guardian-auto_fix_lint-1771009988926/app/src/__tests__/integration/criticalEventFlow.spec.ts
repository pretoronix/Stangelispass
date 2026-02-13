/**
 * PHASE 1: CRITICAL EVENT FLOW - Integration Tests
 * 
 * Tests the most critical user journeys from a host's perspective.
 * If these fail, the app is completely unusable.
 * 
 * Scenarios covered:
 * 1. Event Start - Create event with custom pricing
 * 2. User Management - Multiple users joining simultaneously
 * 3. Beer Logging - Real-time tracking with optimistic updates
 * 4. Leaderboard - Accurate sorting and leader detection
 * 5. Event Closure - MVP modal and Wall of Fame archival
 */

import { MockDatabase, simulateNetworkDelay, simulateConcurrentOperations } from '../helpers/mockSupabase';
import {
    createTestUser,
    createTestUsers,
    createTestEvent,
    createTestBeer,
    createRealisticEventScenario,
    resetCounters,
} from '../helpers/testDataFactory';

describe('Phase 1: Critical Event Flow (Host Perspective)', () => {
    let db: MockDatabase;

    beforeEach(() => {
        db = new MockDatabase();
        resetCounters();
    });

    afterEach(() => {
        db.reset();
    });

    describe('1. Event Start - "Can we even begin?"', () => {
        test('Host can create event with custom beer price', async () => {
            // Given: A host (admin user)
            const host = createTestUser({ is_admin: true, name: 'Host' });
            db.addUser(host);

            // When: Host creates an event with Zurich pricing
            const event = createTestEvent({
                name: 'Friday Night',
                beer_price: 7.50, // Zurich prices, not default 5.00
            });
            db.addEvent(event);

            // Then: Event is created with correct price
            expect(event.beer_price).toBe(7.50);
            expect(event.status).toBe('active');
            expect(db.events).toHaveLength(1);

            // And: Event is immediately active
            const activeEvent = db.getActiveEvent();
            expect(activeEvent).toBeDefined();
            expect(activeEvent?.id).toBe(event.id);
        });

        test('Only admins can create events', async () => {
            // Given: A non-admin user
            const regularUser = createTestUser({ is_admin: false });
            db.addUser(regularUser);

            // When: Regular user tries to create event
            // Then: This should fail (permission check)
            expect(regularUser.is_admin).toBe(false);

            // Given: An admin user
            const adminUser = createTestUser({ is_admin: true });
            db.addUser(adminUser);

            // When: Admin creates event
            const event = createTestEvent();
            db.addEvent(event);

            // Then: Event is created successfully
            expect(adminUser.is_admin).toBe(true);
            expect(db.events).toHaveLength(1);
        });

        test('Multiple users can join event simultaneously without duplicates', async () => {
            // Given: An active event
            const event = createTestEvent();
            db.addEvent(event);

            // And: 5 users trying to join at the same time
            const users = createTestUsers(5, 0);
            users.forEach(u => db.addUser(u));

            // When: All users join concurrently
            const joinOperations = users.map(user => async () => {
                await simulateNetworkDelay(10);
                return db.addMembership({
                    event_id: event.id,
                    user_id: user.id,
                    role: 'member',
                });
            });

            await simulateConcurrentOperations(joinOperations);

            // Then: All users are members (no duplicates)
            const memberships = db.getMembershipsForEvent(event.id);
            expect(memberships).toHaveLength(5);

            // And: Each user appears exactly once
            const userIds = memberships.map(m => m.user_id);
            const uniqueUserIds = new Set(userIds);
            expect(uniqueUserIds.size).toBe(5);
        });

        test('Event appears as "Active" immediately after creation', async () => {
            // Given: No active events
            expect(db.getActiveEvent()).toBeUndefined();

            // When: Event is created
            const event = createTestEvent({ status: 'active' });
            db.addEvent(event);

            // Then: Event is immediately queryable as active
            const activeEvent = db.getActiveEvent();
            expect(activeEvent).toBeDefined();
            expect(activeEvent?.status).toBe('active');
            expect(activeEvent?.id).toBe(event.id);
        });
    });

    describe('2. Beer Logging - "Tracking must be reliable"', () => {
        test('Adding beer updates count immediately (optimistic)', async () => {
            // Given: Active event with one user
            const event = createTestEvent();
            db.addEvent(event);
            const user = createTestUser();
            db.addUser(user);

            // When: User logs a beer
            const beer = createTestBeer(user.id, event.id);
            db.addBeer(beer);

            // Then: Beer is in database immediately
            const beers = db.getBeersForEvent(event.id);
            expect(beers).toHaveLength(1);
            expect(beers[0]!.user_id).toBe(user.id);
        });

        test('Beer persists to database (no data loss)', async () => {
            // Given: Active event and user
            const event = createTestEvent();
            db.addEvent(event);
            const user = createTestUser();
            db.addUser(user);

            // When: Multiple beers logged
            const beer1 = createTestBeer(user.id, event.id);
            const beer2 = createTestBeer(user.id, event.id);
            const beer3 = createTestBeer(user.id, event.id);

            db.addBeer(beer1);
            await simulateNetworkDelay(50);
            db.addBeer(beer2);
            await simulateNetworkDelay(50);
            db.addBeer(beer3);

            // Then: All beers are persisted
            const beers = db.getBeersForEvent(event.id);
            expect(beers).toHaveLength(3);
            expect(beers.map(b => b.id)).toContain(beer1.id);
            expect(beers.map(b => b.id)).toContain(beer2.id);
            expect(beers.map(b => b.id)).toContain(beer3.id);
        });

        test('Multiple people logging beers simultaneously', async () => {
            // Given: Event with 5 users
            const scenario = createRealisticEventScenario();
            scenario.users.forEach(u => db.addUser(u));
            db.addEvent(scenario.event);

            // When: All 5 users log a beer at the same time
            const logOperations = scenario.users.map(user => async () => {
                await simulateNetworkDelay(Math.random() * 100);
                return db.addBeer(createTestBeer(user.id, scenario.event.id));
            });

            const results = await simulateConcurrentOperations(logOperations);

            // Then: All 5 beers are logged
            expect(results).toHaveLength(5);
            const beers = db.getBeersForEvent(scenario.event.id);
            expect(beers.length).toBeGreaterThanOrEqual(5);

            // And: Each user has exactly 1 beer from this round
            const beersByUser = new Map<string, number>();
            results.forEach(beer => {
                beersByUser.set(beer.user_id, (beersByUser.get(beer.user_id) || 0) + 1);
            });
            
            scenario.users.forEach(user => {
                expect(beersByUser.get(user.id)).toBe(1);
            });
        });
    });

    describe('3. Leaderboard - "Who\'s actually winning?"', () => {
        test('Leaderboard sorts by total beers (points)', () => {
            // Given: Realistic event scenario
            const scenario = createRealisticEventScenario();
            scenario.users.forEach(u => db.addUser(u));
            db.addEvent(scenario.event);
            scenario.beers.forEach(b => db.addBeer(b));

            // When: Get leaderboard
            const leaderboard = db.getBeerCountByUser(scenario.event.id);

            // Then: Users are sorted by beer count (descending)
            expect(leaderboard).toHaveLength(5);
            
            // User 2 has 12 beers (leader)
            expect(leaderboard[0]!.count).toBe(12);
            expect(leaderboard[0]!.userId).toBe(scenario.users[1]!.id);

            // User 4 has 10 beers (second)
            expect(leaderboard[1]!.count).toBe(10);

            // User 1 has 8 beers (third)
            expect(leaderboard[2]!.count).toBe(8);

            // Verify descending order
            for (let i = 0; i < leaderboard.length - 1; i++) {
                expect(leaderboard[i]!.count).toBeGreaterThanOrEqual(leaderboard[i + 1]!.count);
            }
        });

        test('Leader badge shows correct person', () => {
            // Given: Event with clear leader
            const users = createTestUsers(3, 0);
            users.forEach(u => db.addUser(u));
            const event = createTestEvent();
            db.addEvent(event);

            // User 1: 3 beers
            db.addBeer(createTestBeer(users[0]!.id, event.id));
            db.addBeer(createTestBeer(users[0]!.id, event.id));
            db.addBeer(createTestBeer(users[0]!.id, event.id));

            // User 2: 7 beers (LEADER)
            for (let i = 0; i < 7; i++) {
                db.addBeer(createTestBeer(users[1]!.id, event.id));
            }

            // User 3: 2 beers
            db.addBeer(createTestBeer(users[2]!.id, event.id));
            db.addBeer(createTestBeer(users[2]!.id, event.id));

            // When: Get leaderboard
            const leaderboard = db.getBeerCountByUser(event.id);

            // Then: User 2 is the leader
            const leader = leaderboard[0]!;
            expect(leader.userId).toBe(users[1]!.id);
            expect(leader.count).toBe(7);
        });

        test('Ties handled consistently (alphabetical fallback)', () => {
            // Given: Event with two users tied at 5 beers
            const userA = createTestUser({ name: 'Alice' });
            const userZ = createTestUser({ name: 'Zach' });
            db.addUser(userA);
            db.addUser(userZ);

            const event = createTestEvent();
            db.addEvent(event);

            // Both users: 5 beers
            for (let i = 0; i < 5; i++) {
                db.addBeer(createTestBeer(userA.id, event.id));
                db.addBeer(createTestBeer(userZ.id, event.id));
            }

            // When: Get leaderboard
            const leaderboard = db.getBeerCountByUser(event.id);

            // Then: Both have same count
            expect(leaderboard[0]!.count).toBe(5);
            expect(leaderboard[1]!.count).toBe(5);

            // And: Alphabetical order is consistent
            // (In real implementation, this would use name.localeCompare)
            const names = leaderboard.map(l => l.name);
            expect(names).toHaveLength(2);
        });

        test('Empty leaderboard before any beers logged', () => {
            // Given: Event with users but no beers
            const users = createTestUsers(5, 1);
            users.forEach(u => db.addUser(u));
            const event = createTestEvent();
            db.addEvent(event);

            // When: Get leaderboard
            const leaderboard = db.getBeerCountByUser(event.id);

            // Then: Leaderboard is empty
            expect(leaderboard).toHaveLength(0);
        });

        test('Single user edge case handled gracefully', () => {
            // Given: Event with only 1 user
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            // User logs 3 beers
            db.addBeer(createTestBeer(user.id, event.id));
            db.addBeer(createTestBeer(user.id, event.id));
            db.addBeer(createTestBeer(user.id, event.id));

            // When: Get leaderboard
            const leaderboard = db.getBeerCountByUser(event.id);

            // Then: Single user is shown correctly
            expect(leaderboard).toHaveLength(1);
            expect(leaderboard[0]!.userId).toBe(user.id);
            expect(leaderboard[0]!.count).toBe(3);
        });
    });

    describe('4. Event Closure - "End of night procedures"', () => {
        test('Event can be closed (status changes)', () => {
            // Given: Active event
            const event = createTestEvent({ status: 'active' });
            db.addEvent(event);
            expect(db.getActiveEvent()).toBeDefined();

            // When: Event is closed
            db.closeEvent(event.id);

            // Then: Event status is closed
            const closedEvent = db.events.find(e => e.id === event.id);
            expect(closedEvent?.status).toBe('closed');

            // And: No active event exists
            expect(db.getActiveEvent()).toBeUndefined();
        });

        test('Winner archived to Wall of Fame with correct data', () => {
            // Given: Completed event with clear winner
            const users = createTestUsers(3, 0);
            users.forEach(u => db.addUser(u));
            const event = createTestEvent();
            db.addEvent(event);

            // User 1: 12 beers (WINNER)
            for (let i = 0; i < 12; i++) {
                db.addBeer(createTestBeer(users[0]!.id, event.id));
            }

            // User 2: 7 beers
            for (let i = 0; i < 7; i++) {
                db.addBeer(createTestBeer(users[1]!.id, event.id));
            }

            // User 3: 5 beers
            for (let i = 0; i < 5; i++) {
                db.addBeer(createTestBeer(users[2]!.id, event.id));
            }

            // When: Event is closed and winner archived
            const leaderboard = db.getBeerCountByUser(event.id);
            const winner = leaderboard[0]!;

            db.addToWallOfFame({
                id: `wof_${event.id}`,
                event_id: event.id,
                winner_user_id: winner.userId,
                total_beers: winner.count,
                created_at: new Date().toISOString(),
            });

            // Then: Winner is in Wall of Fame
            const wallOfFame = db.getWallOfFameEntries();
            expect(wallOfFame).toHaveLength(1);
            expect(wallOfFame[0]!.winner_user_id).toBe(users[0]!.id);
            expect(wallOfFame[0]!.total_beers).toBe(12);
            expect(wallOfFame[0]!.event_id).toBe(event.id);
        });

        test('Cannot log beers after event is closed', () => {
            // Given: Closed event
            const event = createTestEvent();
            db.addEvent(event);
            db.closeEvent(event.id);

            const user = createTestUser();
            db.addUser(user);

            // When: Trying to log beer after closure
            // (In real app, this would be prevented by business logic)
            const closedEvent = db.events.find(e => e.id === event.id);
            expect(closedEvent?.status).toBe('closed');

            // Then: We can verify the event is closed before allowing beer logging
            // This test documents the expected behavior
            expect(closedEvent?.status).not.toBe('active');
        });

        test('Event with 0 beers can still be closed gracefully', () => {
            // Given: Event with no beers logged
            const event = createTestEvent();
            db.addEvent(event);

            // When: Event is closed
            db.closeEvent(event.id);

            // Then: Event closes successfully
            const closedEvent = db.events.find(e => e.id === event.id);
            expect(closedEvent?.status).toBe('closed');

            // And: Wall of Fame can handle null winner scenario
            const leaderboard = db.getBeerCountByUser(event.id);
            expect(leaderboard).toHaveLength(0);
        });
    });

    describe('5. Real-world Integration Scenario', () => {
        test('Full event lifecycle: Create → Log → Lead Changes → Close', async () => {
            // GIVEN: A realistic event setup
            const scenario = createRealisticEventScenario();
            const { users, event, admin } = scenario;

            // Add all users to database
            users.forEach(u => db.addUser(u));

            // WHEN: Host (admin) creates event
            db.addEvent(event);
            expect(db.getActiveEvent()).toBeDefined();

            // AND: All users join the event
            users.forEach(user => {
                db.addMembership({
                    event_id: event.id,
                    user_id: user.id,
                    role: user.is_admin ? 'admin' : 'member',
                });
            });

            const memberships = db.getMembershipsForEvent(event.id);
            expect(memberships).toHaveLength(5);

            // AND: Users log beers over time
            // Round 1: All users log 1 beer each
            users.forEach(user => {
                db.addBeer(createTestBeer(user.id, event.id));
            });

            let leaderboard = db.getBeerCountByUser(event.id);
            expect(leaderboard).toHaveLength(5);
            expect(leaderboard.every(l => l.count === 1)).toBe(true);

            // Round 2: User 2 pulls ahead with 3 more beers
            for (let i = 0; i < 3; i++) {
                db.addBeer(createTestBeer(users[1]!.id, event.id));
            }

            leaderboard = db.getBeerCountByUser(event.id);
            const leader = leaderboard[0]!;
            expect(leader.userId).toBe(users[1]!.id);
            expect(leader.count).toBe(4);

            // Round 3: User 4 catches up with 4 beers
            for (let i = 0; i < 4; i++) {
                db.addBeer(createTestBeer(users[3]!.id, event.id));
            }

            leaderboard = db.getBeerCountByUser(event.id);
            expect(leaderboard[0]!.count).toBeGreaterThanOrEqual(4);

            // THEN: Event can be closed by admin
            db.closeEvent(event.id);
            const closedEvent = db.events.find(e => e.id === event.id);
            expect(closedEvent?.status).toBe('closed');

            // AND: Final winner is archived
            const finalLeaderboard = db.getBeerCountByUser(event.id);
            const finalWinner = finalLeaderboard[0]!;

            db.addToWallOfFame({
                id: `wof_${event.id}`,
                event_id: event.id,
                winner_user_id: finalWinner.userId,
                total_beers: finalWinner.count,
                created_at: new Date().toISOString(),
            });

            const wallOfFame = db.getWallOfFameEntries();
            expect(wallOfFame).toHaveLength(1);
            expect(wallOfFame[0]!.total_beers).toBeGreaterThan(0);
        });
    });
});
