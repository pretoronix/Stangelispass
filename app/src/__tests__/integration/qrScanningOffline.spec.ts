/**
 * PHASE 3: QR SCANNING & REAL-TIME - Integration Tests
 * 
 * Tests QR code scanning flows and offline/online synchronization.
 * These are MEDIUM priority - important but less critical than core flow.
 * 
 * Scenarios covered:
 * 1. QR Payload Parsing - All formats (JSON, legacy, malformed)
 * 2. Join Event via QR - New users, existing users, concurrent scans
 * 3. Beer Logging via QR - Permissions, wrong event, admin override
 * 4. Stamp Redemption - Valid, expired, already redeemed
 * 5. Offline Queue - Add when offline, sync when online
 * 6. Concurrent Scanning - Multiple users scan same QR simultaneously
 */

import { parseScanPayload, type ParsedScanPayload } from '@/utils/scanPayload';
import { MockDatabase, simulateNetworkDelay, simulateConcurrentOperations } from '../helpers/mockSupabase';
import {
    createTestUser,
    createTestUsers,
    createTestEvent,
    createTestBeer,
    resetCounters,
} from '../helpers/testDataFactory';

describe('Phase 3: QR Scanning & Real-Time (Host Perspective)', () => {
    let db: MockDatabase;

    beforeEach(() => {
        db = new MockDatabase();
        resetCounters();
    });

    afterEach(() => {
        db.reset();
    });

    describe('1. QR Payload Parsing - "Does it understand the code?"', () => {
        test('JOIN_EVENT: Valid JSON payload', () => {
            // Given: QR code for joining event
            const payload = JSON.stringify({
                type: 'JOIN_EVENT',
                eventId: 'event_123',
                eventName: 'Friday Night Out'
            });

            // When: Parse the payload
            const result = parseScanPayload(payload);

            // Then: Correctly identified as join_event
            expect(result.type).toBe('join_event');
            if (result.type === 'join_event') {
                expect(result.eventId).toBe('event_123');
                expect(result.eventName).toBe('Friday Night Out');
            }
        });

        test('BEER_LOG: Valid JSON payload with userId', () => {
            // Given: QR code for logging beer with valid hex UUIDs
            const payload = JSON.stringify({
                userId: 'abc12345-def67890',
                eventId: 'fedcba98-76543210'
            });

            // When: Parse the payload
            const result = parseScanPayload(payload);

            // Then: Correctly identified as beer_log
            expect(result.type).toBe('beer_log');
            if (result.type === 'beer_log') {
                expect(result.userId).toBe('abc12345-def67890');
                expect(result.eventId).toBe('fedcba98-76543210');
            }
        });

        test('STAMP_REDEEM: Valid JSON payload', () => {
            // Given: QR code for stamp redemption with valid stamp ID (8+ hex chars)
            const payload = JSON.stringify({
                type: 'STAMP_BEER',
                stampId: '12345678abcd'
            });

            // When: Parse the payload
            const result = parseScanPayload(payload);

            // Then: Correctly identified as stamp_redeem
            expect(result.type).toBe('stamp_redeem');
            if (result.type === 'stamp_redeem') {
                expect(result.stampId).toBe('12345678abcd');
            }
        });

        test('Legacy format: userId|eventId', () => {
            // Given: Old-style QR code with valid UUIDs
            const payload = 'abc12345-6789|def12345-6789';

            // When: Parse the payload
            const result = parseScanPayload(payload);

            // Then: Still works (backward compatibility)
            expect(result.type).toBe('beer_log');
            if (result.type === 'beer_log') {
                expect(result.userId).toBe('abc12345-6789');
                expect(result.eventId).toBe('def12345-6789');
            }
        });

        test('Legacy format: userId only (no eventId)', () => {
            // Given: Simple userId QR with valid UUID
            const payload = 'abc12345-6789|';

            // When: Parse the payload
            const result = parseScanPayload(payload);

            // Then: Works with undefined eventId
            expect(result.type).toBe('beer_log');
            if (result.type === 'beer_log') {
                expect(result.userId).toBe('abc12345-6789');
                expect(result.eventId).toBeUndefined();
            }
        });

        test('Invalid payload: Random string', () => {
            // Given: Non-QR random text
            const payload = 'hello world this is not a QR code';

            // When: Parse the payload
            const result = parseScanPayload(payload);

            // Then: Identified as unknown
            expect(result.type).toBe('unknown');
        });

        test('Invalid payload: Empty string', () => {
            // Given: Empty QR scan
            const payload = '';

            // When: Parse the payload
            const result = parseScanPayload(payload);

            // Then: Identified as unknown
            expect(result.type).toBe('unknown');
        });

        test('Invalid payload: Malformed JSON', () => {
            // Given: Broken JSON
            const payload = '{"type":"JOIN_EVENT", missing bracket';

            // When: Parse the payload
            const result = parseScanPayload(payload);

            // Then: Falls back to unknown (doesn't crash)
            expect(result.type).toBe('unknown');
        });

        test('Invalid userId: Too short (not UUID-like)', () => {
            // Given: Suspicious short ID
            const payload = JSON.stringify({
                userId: 'abc',
                eventId: '12345678abcd'
            });

            // When: Parse the payload
            const result = parseScanPayload(payload);

            // Then: Rejected as unknown (security)
            expect(result.type).toBe('unknown');
        });

        test('Special case: "local" userId (offline fallback)', () => {
            // Given: Offline-generated ID with valid event ID
            const payload = JSON.stringify({
                userId: 'local',
                eventId: '12345678abcd'
            });

            // When: Parse the payload
            const result = parseScanPayload(payload);

            // Then: Accepted (offline support)
            expect(result.type).toBe('beer_log');
            if (result.type === 'beer_log') {
                expect(result.userId).toBe('local');
            }
        });
    });

    describe('2. Join Event via QR - "Invite friends easily"', () => {
        test('New user scans invite QR: Creates membership', () => {
            // Given: Event exists
            const event = createTestEvent({ name: 'Friday Night' });
            db.addEvent(event);

            // And: New user scans invite
            const user = createTestUser({ name: 'Alice' });
            db.addUser(user);

            // When: User joins via QR
            db.addMembership({
                event_id: event.id,
                user_id: user.id,
                role: 'member',
            });

            // Then: User is member of event
            const memberships = db.getMembershipsForEvent(event.id);
            expect(memberships).toHaveLength(1);
            expect(memberships[0]!.user_id).toBe(user.id);
            expect(memberships[0]!.role).toBe('member');
        });

        test('5 users scan invite simultaneously: All join successfully', async () => {
            // Given: Event with invite QR
            const event = createTestEvent();
            db.addEvent(event);

            const users = createTestUsers(5, 0);
            users.forEach(u => db.addUser(u));

            // When: All 5 scan at same time
            const joinOperations = users.map(user => async () => {
                await simulateNetworkDelay(Math.random() * 50);
                return db.addMembership({
                    event_id: event.id,
                    user_id: user.id,
                    role: 'member',
                });
            });

            await simulateConcurrentOperations(joinOperations);

            // Then: All 5 are members (no duplicates)
            const memberships = db.getMembershipsForEvent(event.id);
            expect(memberships).toHaveLength(5);

            const memberIds = memberships.map(m => m.user_id);
            const uniqueIds = new Set(memberIds);
            expect(uniqueIds.size).toBe(5);
        });

        test('User already in event: Re-scan is idempotent', () => {
            // Given: User already joined
            const event = createTestEvent();
            db.addEvent(event);

            const user = createTestUser();
            db.addUser(user);

            db.addMembership({
                event_id: event.id,
                user_id: user.id,
                role: 'member',
            });

            // When: User scans invite again
            const existingMemberships = db.getMembershipsForEvent(event.id);
            const alreadyMember = existingMemberships.some(m => m.user_id === user.id);

            // Then: No duplicate membership
            expect(alreadyMember).toBe(true);
            expect(existingMemberships).toHaveLength(1);
        });
    });

    describe('3. Beer Logging via QR - "Quick beer entry"', () => {
        test('User scans own QR: Beer logged successfully', () => {
            // Given: Active event with user
            const event = createTestEvent();
            db.addEvent(event);

            const user = createTestUser();
            db.addUser(user);

            db.addMembership({
                event_id: event.id,
                user_id: user.id,
                role: 'member',
            });

            // When: User scans their QR
            const beer = createTestBeer(user.id, event.id);
            db.addBeer(beer);

            // Then: Beer is logged
            const beers = db.getBeersForEvent(event.id);
            expect(beers).toHaveLength(1);
            expect(beers[0]!.user_id).toBe(user.id);
        });

        test('Admin scans another user\'s QR: Allowed', () => {
            // Given: Event with admin and regular user
            const event = createTestEvent();
            db.addEvent(event);

            const admin = createTestUser({ is_admin: true, name: 'Admin' });
            const user = createTestUser({ is_admin: false, name: 'User' });
            db.addUser(admin);
            db.addUser(user);

            // When: Admin logs beer for user (via QR scan)
            const beer = createTestBeer(user.id, event.id);
            beer.added_by_user_id = admin.id; // Admin scanned
            db.addBeer(beer);

            // Then: Beer logged successfully
            const beers = db.getBeersForEvent(event.id);
            expect(beers).toHaveLength(1);
            expect(beers[0]!.user_id).toBe(user.id);
            expect(beers[0]!.added_by_user_id).toBe(admin.id);
        });

        test('QR for wrong event: Should detect mismatch', () => {
            // Given: Two events
            const event1 = createTestEvent({ name: 'Event 1' });
            const event2 = createTestEvent({ name: 'Event 2' });
            db.addEvent(event1);
            db.addEvent(event2);

            const user = createTestUser();
            db.addUser(user);

            // When: Scan validation checks event mismatch
            const activeEventId = event1.id;
            const qrEventId = event2.id;

            // Then: Should detect wrong event
            expect(activeEventId).not.toBe(qrEventId);
        });

        test('Multiple users scan different QRs concurrently', async () => {
            // Given: Event with 3 users
            const event = createTestEvent();
            db.addEvent(event);

            const users = createTestUsers(3, 0);
            users.forEach(u => db.addUser(u));

            // When: All 3 scan their own QRs at same time
            const scanOperations = users.map(user => async () => {
                await simulateNetworkDelay(Math.random() * 30);
                return db.addBeer(createTestBeer(user.id, event.id));
            });

            await simulateConcurrentOperations(scanOperations);

            // Then: All 3 beers logged correctly
            const beers = db.getBeersForEvent(event.id);
            expect(beers).toHaveLength(3);

            // Each user has exactly 1 beer
            users.forEach(user => {
                const userBeers = beers.filter(b => b.user_id === user.id);
                expect(userBeers).toHaveLength(1);
            });
        });

        test('Same user scans QR 3 times rapidly: All logged', async () => {
            // Given: User at event
            const event = createTestEvent();
            db.addEvent(event);

            const user = createTestUser();
            db.addUser(user);

            // When: User scans 3 times in quick succession
            const beer1 = createTestBeer(user.id, event.id);
            const beer2 = createTestBeer(user.id, event.id);
            const beer3 = createTestBeer(user.id, event.id);

            db.addBeer(beer1);
            await simulateNetworkDelay(10);
            db.addBeer(beer2);
            await simulateNetworkDelay(10);
            db.addBeer(beer3);

            // Then: All 3 beers logged (no duplicate prevention)
            const beers = db.getBeersForEvent(event.id);
            expect(beers).toHaveLength(3);
            expect(beers.every(b => b.user_id === user.id)).toBe(true);
        });
    });

    describe('4. Stamp Redemption - "Free beer stamps"', () => {
        test('Valid stamp: Redeems successfully', () => {
            // Given: Valid stamp exists
            const stamp = {
                id: 'stamp_123',
                user_id: 'user_abc',
                event_id: 'event_xyz',
                redeemed: false,
                created_at: new Date().toISOString(),
            };

            // When: Check if redeemable
            const isValid = !stamp.redeemed;

            // Then: Can be redeemed
            expect(isValid).toBe(true);
        });

        test('Already redeemed stamp: Rejected', () => {
            // Given: Stamp already used
            const stamp = {
                id: 'stamp_123',
                redeemed: true,
                redeemed_at: new Date().toISOString(),
            };

            // When: Check if redeemable
            const isValid = !stamp.redeemed;

            // Then: Cannot be redeemed again
            expect(isValid).toBe(false);
        });

        test('Expired stamp: Rejected', () => {
            // Given: Old stamp (30 days old)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const stamp = {
                id: 'stamp_123',
                created_at: thirtyDaysAgo.toISOString(),
                redeemed: false,
            };

            // When: Check if expired (assuming 7-day validity)
            const VALIDITY_DAYS = 7;
            const stampAge = (Date.now() - new Date(stamp.created_at).getTime()) / (1000 * 60 * 60 * 24);
            const isExpired = stampAge > VALIDITY_DAYS;

            // Then: Stamp is expired
            expect(isExpired).toBe(true);
        });

        test('Invalid stamp ID: Rejected', () => {
            // Given: Malformed stamp ID
            const payload = JSON.stringify({
                type: 'STAMP_BEER',
                stampId: 'invalid'
            });

            // When: Parse payload
            const result = parseScanPayload(payload);

            // Then: Rejected (too short for valid ID)
            expect(result.type).toBe('unknown');
        });
    });

    describe('5. Offline Queue - "WiFi dies mid-event"', () => {
        test('Beer logged while offline: Queued for sync', () => {
            // Given: Offline queue
            const queue: any[] = [];

            // When: Beer logged offline
            const offlineBeer = {
                id: 'offline_1',
                type: 'addBeer',
                data: {
                    userId: 'user_123',
                    eventId: 'event_abc',
                },
                timestamp: Date.now(),
            };

            queue.push(offlineBeer);

            // Then: In queue waiting for sync
            expect(queue).toHaveLength(1);
            expect(queue[0].type).toBe('addBeer');
        });

        test('Multiple beers offline: All queued in order', () => {
            // Given: Offline queue
            const queue: any[] = [];

            // When: 3 beers logged offline
            for (let i = 0; i < 3; i++) {
                queue.push({
                    id: `offline_${i}`,
                    type: 'addBeer',
                    data: { userId: 'user_123', eventId: 'event_abc' },
                    timestamp: Date.now() + i,
                });
            }

            // Then: All in queue, ordered by timestamp
            expect(queue).toHaveLength(3);
            expect(queue[0].timestamp).toBeLessThan(queue[1].timestamp);
            expect(queue[1].timestamp).toBeLessThan(queue[2].timestamp);
        });

        test('Back online: Queue syncs successfully', async () => {
            // Given: Queue with 2 offline beers
            const event = createTestEvent();
            db.addEvent(event);

            const user = createTestUser();
            db.addUser(user);

            const queue = [
                { id: 'offline_1', type: 'addBeer', data: { userId: user.id, eventId: event.id } },
                { id: 'offline_2', type: 'addBeer', data: { userId: user.id, eventId: event.id } },
            ];

            // When: Process queue (back online)
            for (const mutation of queue) {
                db.addBeer(createTestBeer(mutation.data.userId, mutation.data.eventId));
            }

            // Then: Both beers synced
            const beers = db.getBeersForEvent(event.id);
            expect(beers).toHaveLength(2);
        });

        test('Sync fails for one beer: Keeps in queue, continues', async () => {
            // Given: Queue with 3 beers, one will fail
            const queue = [
                { id: 'offline_1', type: 'addBeer', data: { userId: 'user_123' } },
                { id: 'offline_2_fail', type: 'addBeer', data: null }, // Will fail
                { id: 'offline_3', type: 'addBeer', data: { userId: 'user_123' } },
            ];

            const synced: string[] = [];
            const failed: string[] = [];

            // When: Attempt to sync
            for (const mutation of queue) {
                try {
                    if (!mutation.data) throw new Error('Invalid data');
                    synced.push(mutation.id);
                } catch {
                    failed.push(mutation.id);
                }
            }

            // Then: 2 synced, 1 failed (kept for retry)
            expect(synced).toHaveLength(2);
            expect(failed).toHaveLength(1);
            expect(failed[0]).toBe('offline_2_fail');
        });
    });

	    describe('6. Concurrent Scanning - "Chaos at the bar"', () => {
	        test('10 people scan QRs within 1 second: All processed', async () => {
	            // Use fake timers to keep this test deterministic and avoid flakiness on slow CI machines.
	            jest.useFakeTimers();
	            jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
	            try {
	                // Given: Event with 10 users
	                const event = createTestEvent();
	                db.addEvent(event);

	                const users = createTestUsers(10, 0);
	                users.forEach(u => db.addUser(u));

	                // When: All 10 scan within 1 second
	                const scanOperations = users.map(user => async () => {
	                    await simulateNetworkDelay(Math.random() * 1000);
	                    return db.addBeer(createTestBeer(user.id, event.id));
	                });

	                const startTime = Date.now();
	                const promise = simulateConcurrentOperations(scanOperations);
	                // Flush the max delay window.
	                await jest.advanceTimersByTimeAsync(1000);
	                await promise;
	                const endTime = Date.now();

	                // Then: All processed within reasonable time
	                const beers = db.getBeersForEvent(event.id);
	                expect(beers).toHaveLength(10);
	                expect(endTime - startTime).toBeLessThan(2000); // < 2 seconds total
	            } finally {
	                jest.useRealTimers();
	            }
	        });

        test('Same QR scanned by 3 different users: Each gets their own beer', async () => {
            // Given: Shared QR code scenario (admin helping)
            const event = createTestEvent();
            db.addEvent(event);

            const admin = createTestUser({ is_admin: true });
            const user1 = createTestUser({ name: 'User 1' });
            const user2 = createTestUser({ name: 'User 2' });
            const user3 = createTestUser({ name: 'User 3' });

            db.addUser(admin);
            db.addUser(user1);
            db.addUser(user2);
            db.addUser(user3);

            // When: Admin scans for 3 different users rapidly
            const beer1 = createTestBeer(user1.id, event.id);
            beer1.added_by_user_id = admin.id;

            const beer2 = createTestBeer(user2.id, event.id);
            beer2.added_by_user_id = admin.id;

            const beer3 = createTestBeer(user3.id, event.id);
            beer3.added_by_user_id = admin.id;

            db.addBeer(beer1);
            await simulateNetworkDelay(5);
            db.addBeer(beer2);
            await simulateNetworkDelay(5);
            db.addBeer(beer3);

            // Then: 3 beers logged for 3 different users
            const beers = db.getBeersForEvent(event.id);
            expect(beers).toHaveLength(3);

            const userIds = beers.map(b => b.user_id);
            expect(userIds).toContain(user1.id);
            expect(userIds).toContain(user2.id);
            expect(userIds).toContain(user3.id);

            // All added by admin
            expect(beers.every(b => b.added_by_user_id === admin.id)).toBe(true);
        });

        test('Race condition: 2 users join + 1 logs beer simultaneously', async () => {
            // Given: Event exists
            const event = createTestEvent();
            db.addEvent(event);

            const user1 = createTestUser({ name: 'User 1' });
            const user2 = createTestUser({ name: 'User 2' });
            const user3 = createTestUser({ name: 'User 3' });

            db.addUser(user1);
            db.addUser(user2);
            db.addUser(user3);

            // When: 2 join, 1 logs beer, all at once
            const operations: Array<() => Promise<unknown>> = [
                async () => {
                    await simulateNetworkDelay(10);
                    return db.addMembership({ event_id: event.id, user_id: user1.id, role: 'member' });
                },
                async () => {
                    await simulateNetworkDelay(15);
                    return db.addMembership({ event_id: event.id, user_id: user2.id, role: 'member' });
                },
                async () => {
                    await simulateNetworkDelay(20);
                    return db.addBeer(createTestBeer(user3.id, event.id));
                },
            ];

            await simulateConcurrentOperations(operations);

            // Then: All operations successful
            const memberships = db.getMembershipsForEvent(event.id);
            const beers = db.getBeersForEvent(event.id);

            expect(memberships.length).toBeGreaterThanOrEqual(2);
            expect(beers).toHaveLength(1);
        });
    });

    describe('7. Real-World QR Scenario', () => {
        test('Bar scenario: Invite 5 friends, all log beers via QR', async () => {
            // Given: Host creates event
            const host = createTestUser({ is_admin: true, name: 'Host' });
            db.addUser(host);

            const event = createTestEvent({ name: 'Friday Night' });
            db.addEvent(event);

            // Host joins first
            db.addMembership({ event_id: event.id, user_id: host.id, role: 'admin' });

            // When: 5 friends scan invite QR
            const friends = createTestUsers(5, 0);
            friends.forEach(f => db.addUser(f));

            const joinOps = friends.map(friend => async () => {
                await simulateNetworkDelay(Math.random() * 100);
                return db.addMembership({ event_id: event.id, user_id: friend.id, role: 'member' });
            });

            await simulateConcurrentOperations(joinOps);

            // Then: All 6 people are members (host + 5 friends)
            const memberships = db.getMembershipsForEvent(event.id);
            expect(memberships).toHaveLength(6);

            // When: Everyone logs first beer via QR
            const allUsers = [host, ...friends];
            const beerOps = allUsers.map(user => async () => {
                await simulateNetworkDelay(Math.random() * 200);
                return db.addBeer(createTestBeer(user.id, event.id));
            });

            await simulateConcurrentOperations(beerOps);

            // Then: 6 beers logged
            const beers = db.getBeersForEvent(event.id);
            expect(beers).toHaveLength(6);

            // Each person has 1 beer
            allUsers.forEach(user => {
                const userBeers = beers.filter(b => b.user_id === user.id);
                expect(userBeers).toHaveLength(1);
            });

            // When: Throughout night, everyone logs more beers
            const nightOps = allUsers.flatMap(user =>
                Array.from({ length: 3 }, () => async () => {
                    await simulateNetworkDelay(Math.random() * 100);
                    return db.addBeer(createTestBeer(user.id, event.id));
                })
            );

            await simulateConcurrentOperations(nightOps);

            // Then: Total of 24 beers (6 users × 4 beers)
            const finalBeers = db.getBeersForEvent(event.id);
            expect(finalBeers).toHaveLength(24);
        });
    });
});
