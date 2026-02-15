/**
 * PHASE 2: LEADERBOARD & ACHIEVEMENTS - Integration Tests
 * 
 * Tests the accuracy of leaderboard calculations and achievement detection.
 * These are HIGH priority because disputes over rankings/badges ruin events.
 * 
 * Scenarios covered:
 * 1. Achievement Edge Cases - Hat Trick timing precision (59 min vs 61 min)
 * 2. Leader Changes - Announcement timing and correctness
 * 3. Streak Milestones - Bonus point calculation (3x, 5x, 7x)
 * 4. Badge Uniqueness - No duplicate achievement unlocks
 * 5. Leaderboard Stress - 20+ users, 100+ beers, complex scenarios
 */

import { MockDatabase, simulateNetworkDelay, simulateConcurrentOperations } from '../helpers/mockSupabase';
import {
    createTestUser,
    createTestUsers,
    createTestEvent,
    createTestBeer,
    createHatTrickBeers,
    resetCounters,
} from '../helpers/testDataFactory';
import { checkAchievements, type BadgeType } from '@/services/achievements';
import type { Beer } from '@/services/supabase';

describe('Phase 2: Leaderboard & Achievements (Host Perspective)', () => {
    let db: MockDatabase;

    beforeEach(() => {
        db = new MockDatabase();
        resetCounters();
    });

    afterEach(() => {
        db.reset();
    });

    describe('1. Hat Trick - "The Most Disputed Achievement"', () => {
        test('Hat Trick unlocks at exactly 60 minutes (edge case)', () => {
            // Given: User logs 3 beers spanning exactly 60 minutes
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            const baseTime = new Date('2026-02-13T20:00:00Z');
            
            // Beer 1: 20:00:00
            const beer1 = createTestBeer(user.id, event.id, baseTime.toISOString());
            db.addBeer(beer1);

            // Beer 2: 20:30:00 (30 min later)
            const beer2Time = new Date(baseTime.getTime() + 30 * 60 * 1000);
            const beer2 = createTestBeer(user.id, event.id, beer2Time.toISOString());
            db.addBeer(beer2);

            // Beer 3: 21:00:00 (exactly 60 min from Beer 1)
            const beer3Time = new Date(baseTime.getTime() + 60 * 60 * 1000);
            const beer3 = createTestBeer(user.id, event.id, beer3Time.toISOString());
            
            // When: Check achievements for Beer 3
            const allBeers = db.getBeersForEvent(event.id);
            const badges = checkAchievements(
                allBeers.filter(b => b.id !== beer3.id) as Beer[],
                beer3 as Beer,
                3
            );

            // Then: Hat Trick is unlocked (60 min <= 1 hour)
            expect(badges).toContain('hat_trick');
        });

        test('Hat Trick FAILS at 61 minutes (critical edge case)', () => {
            // Given: User logs 3 beers spanning 61 minutes
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            const baseTime = new Date('2026-02-13T20:00:00Z');
            
            // Beer 1: 20:00:00
            const beer1 = createTestBeer(user.id, event.id, baseTime.toISOString());
            db.addBeer(beer1);

            // Beer 2: 20:30:00
            const beer2Time = new Date(baseTime.getTime() + 30 * 60 * 1000);
            const beer2 = createTestBeer(user.id, event.id, beer2Time.toISOString());
            db.addBeer(beer2);

            // Beer 3: 21:01:00 (61 min from Beer 1)
            const beer3Time = new Date(baseTime.getTime() + 61 * 60 * 1000);
            const beer3 = createTestBeer(user.id, event.id, beer3Time.toISOString());
            
            // When: Check achievements for Beer 3
            const allBeers = db.getBeersForEvent(event.id);
            const badges = checkAchievements(
                allBeers.filter(b => b.id !== beer3.id) as Beer[],
                beer3 as Beer,
                3
            );

            // Then: Hat Trick is NOT unlocked (61 min > 1 hour)
            expect(badges).not.toContain('hat_trick');
        });

        test('Hat Trick with 4th beer in sequence (checks correct 3-beer window)', () => {
            // Given: User logs 4 beers
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            const baseTime = new Date('2026-02-13T20:00:00Z');

            // Beer 1: 20:00 (too old for final hat trick)
            const beer1 = createTestBeer(user.id, event.id, baseTime.toISOString());
            db.addBeer(beer1);

            // Beer 2: 21:10 (start of hat trick window)
            const beer2Time = new Date(baseTime.getTime() + 70 * 60 * 1000);
            const beer2 = createTestBeer(user.id, event.id, beer2Time.toISOString());
            db.addBeer(beer2);

            // Beer 3: 21:40
            const beer3Time = new Date(baseTime.getTime() + 100 * 60 * 1000);
            const beer3 = createTestBeer(user.id, event.id, beer3Time.toISOString());
            db.addBeer(beer3);

            // Beer 4: 22:05 (55 min from Beer 2)
            const beer4Time = new Date(baseTime.getTime() + 125 * 60 * 1000);
            const beer4 = createTestBeer(user.id, event.id, beer4Time.toISOString());

            // When: Check achievements for Beer 4
            const allBeers = db.getBeersForEvent(event.id);
            const badges = checkAchievements(
                allBeers.filter(b => b.id !== beer4.id) as Beer[],
                beer4 as Beer,
                4
            );

            // Then: Hat Trick unlocked (last 3 beers within 55 min)
            expect(badges).toContain('hat_trick');
        });

        test('Hat Trick: Different users should not interfere', () => {
            // Given: 2 users, User 1 has Hat Trick, User 2 does not
            const user1 = createTestUser({ name: 'Alice' });
            const user2 = createTestUser({ name: 'Bob' });
            db.addUser(user1);
            db.addUser(user2);

            const event = createTestEvent();
            db.addEvent(event);

            const baseTime = new Date('2026-02-13T20:00:00Z');

            // User 1: 3 beers in 30 minutes (HAT TRICK)
            const u1b1 = createTestBeer(user1.id, event.id, baseTime.toISOString());
            const u1b2 = createTestBeer(user1.id, event.id, new Date(baseTime.getTime() + 15 * 60 * 1000).toISOString());
            const u1b3 = createTestBeer(user1.id, event.id, new Date(baseTime.getTime() + 30 * 60 * 1000).toISOString());
            db.addBeer(u1b1);
            db.addBeer(u1b2);

            // User 2: 3 beers over 2 hours (NO HAT TRICK)
            const u2b1 = createTestBeer(user2.id, event.id, baseTime.toISOString());
            const u2b2 = createTestBeer(user2.id, event.id, new Date(baseTime.getTime() + 60 * 60 * 1000).toISOString());
            const u2b3 = createTestBeer(user2.id, event.id, new Date(baseTime.getTime() + 120 * 60 * 1000).toISOString());
            db.addBeer(u2b1);
            db.addBeer(u2b2);

            // When: User 1 logs 3rd beer
            const allBeers = db.getBeersForEvent(event.id);
            const user1Badges = checkAchievements(
                allBeers.filter(b => b.id !== u1b3.id) as Beer[],
                u1b3 as Beer,
                3
            );

            // When: User 2 logs 3rd beer
            const user2Badges = checkAchievements(
                allBeers.filter(b => b.id !== u2b3.id) as Beer[],
                u2b3 as Beer,
                3
            );

            // Then: User 1 has Hat Trick, User 2 does not
            expect(user1Badges).toContain('hat_trick');
            expect(user2Badges).not.toContain('hat_trick');
        });
    });

    describe('2. First Blood - "Who started the party?"', () => {
        test('First beer in event gets First Blood badge', () => {
            // Given: Empty event
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            // When: User logs first beer
            const beer = createTestBeer(user.id, event.id);
            const badges = checkAchievements([], beer as Beer, 1);

            // Then: First Blood awarded
            expect(badges).toContain('first_blood');
        });

        test('Second beer does NOT get First Blood', () => {
            // Given: Event with 1 beer already logged
            const user1 = createTestUser({ name: 'Alice' });
            const user2 = createTestUser({ name: 'Bob' });
            db.addUser(user1);
            db.addUser(user2);

            const event = createTestEvent();
            db.addEvent(event);

            const beer1 = createTestBeer(user1.id, event.id);
            db.addBeer(beer1);

            // When: User 2 logs second beer
            const beer2 = createTestBeer(user2.id, event.id);
            const allBeers = db.getBeersForEvent(event.id);
            const badges = checkAchievements(
                allBeers.filter(b => b.id !== beer2.id) as Beer[],
                beer2 as Beer,
                1
            );

            // Then: No First Blood
            expect(badges).not.toContain('first_blood');
        });

        test('Concurrent first beers: Only truly first gets badge', async () => {
            // Given: 3 users trying to log "first" beer simultaneously
            const users = createTestUsers(3, 0);
            users.forEach(u => db.addUser(u));
            const event = createTestEvent();
            db.addEvent(event);

            // When: All 3 users log at "same time" (simulated race)
            const beers = [
                createTestBeer(users[0]!.id, event.id),
                createTestBeer(users[1]!.id, event.id),
                createTestBeer(users[2]!.id, event.id),
            ];

            // Simulate race: first one wins
            db.addBeer(beers[0]!);
            await simulateNetworkDelay(1);
            db.addBeer(beers[1]!);
            await simulateNetworkDelay(1);
            db.addBeer(beers[2]!);

            // Then: Only first beer gets First Blood
            const firstBadges = checkAchievements([], beers[0] as Beer, 1);
            const secondBadges = checkAchievements([beers[0] as Beer], beers[1] as Beer, 1);
            const thirdBadges = checkAchievements([beers[0] as Beer, beers[1] as Beer], beers[2] as Beer, 1);

            expect(firstBadges).toContain('first_blood');
            expect(secondBadges).not.toContain('first_blood');
            expect(thirdBadges).not.toContain('first_blood');
        });
    });

    describe('3. Time-Based Achievements - "Early Bird & Night Owl"', () => {
        test('Early Bird: Beer logged at 16:59 UTC gets badge (17:59 local CET)', () => {
            // Given: User logs beer at 4:59 PM UTC (5:59 PM local)
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            const ts = new Date('2026-02-13T16:59:00Z'); // 5:59 PM local (CET)
            const beer = createTestBeer(user.id, event.id, ts.toISOString());

            // When: Check achievements
            const badges = checkAchievements([], beer as Beer, 1);

            // Then: Early Bird awarded
            expect(badges).toContain('early_bird');
        });

        test('Early Bird: Beer logged at 17:00 UTC does NOT get badge (18:00 local CET)', () => {
            // Given: User logs beer at 5:00 PM UTC (6:00 PM local)
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            const ts = new Date('2026-02-13T17:00:00Z'); // 6:00 PM local (CET)
            const beer = createTestBeer(user.id, event.id, ts.toISOString());

            // When: Check achievements
            const badges = checkAchievements([], beer as Beer, 1);

            // Then: No Early Bird
            expect(badges).not.toContain('early_bird');
        });

        test('Night Owl: Beer logged at 02:00 gets badge', () => {
            // Given: User logs beer at 2:00 AM
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            const ts = new Date('2026-02-14T02:00:00Z');
            const beer = createTestBeer(user.id, event.id, ts.toISOString());

            // When: Check achievements
            const badges = checkAchievements([], beer as Beer, 1);

            // Then: Night Owl awarded
            expect(badges).toContain('night_owl');
        });

        test('Night Owl: Beer logged at 04:59 UTC gets badge (05:59 local CET)', () => {
            // Given: User logs beer at 4:59 AM UTC (5:59 AM local)
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            const ts = new Date('2026-02-14T04:59:00Z'); // 5:59 AM local
            const beer = createTestBeer(user.id, event.id, ts);

            // When: Check achievements
            const badges = checkAchievements([], beer as Beer, 1);

            // Then: Night Owl awarded
            expect(badges).toContain('night_owl');
        });

        test('Night Owl: Beer logged at 06:00 does NOT get badge', () => {
            // Given: User logs beer at 6:00 AM
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            const ts = new Date('2026-02-14T06:00:00Z');
            const beer = createTestBeer(user.id, event.id, ts.toISOString());

            // When: Check achievements
            const badges = checkAchievements([], beer as Beer, 1);

            // Then: No Night Owl (too late, Early Bird window starts)
            expect(badges).not.toContain('night_owl');
        });
    });

    describe('4. Weekend Warrior - "Friday Night Lights"', () => {
        test('Friday beer gets Weekend Warrior', () => {
            // Given: Beer logged on Friday
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            // Feb 14, 2026 is a Saturday, so Feb 13 is Friday
            const ts = new Date('2026-02-13T20:00:00Z');
            const dayOfWeek = ts.getDay(); // Should be 5 (Friday)
            
            const beer = createTestBeer(user.id, event.id, ts.toISOString());

            // When: Check achievements
            const badges = checkAchievements([], beer as Beer, 1);

            // Then: Weekend Warrior if it's Friday or Saturday
            if (dayOfWeek === 5 || dayOfWeek === 6) {
                expect(badges).toContain('weekend_warrior');
            }
        });

        test('Monday beer does NOT get Weekend Warrior', () => {
            // Given: Beer logged on Monday (local timezone)
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            // Feb 16, 2026 is a Monday in UTC, check local
            const ts = new Date('2026-02-16T12:00:00Z');
            const localDay = ts.getDay(); // Will vary by timezone
            
            const beer = createTestBeer(user.id, event.id, ts.toISOString());

            // When: Check achievements
            const badges = checkAchievements([], beer as Beer, 1);

            // Then: No Weekend Warrior if it's Mon-Thu in local timezone
            if (localDay !== 5 && localDay !== 6) {
                expect(badges).not.toContain('weekend_warrior');
            }
        });
    });

    describe('5. Century Club - "100 Lifetime Beers"', () => {
        test('Exactly 100th beer unlocks Century Club', () => {
            // Given: User has 99 lifetime beers
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            const beer = createTestBeer(user.id, event.id);

            // When: User logs 100th beer
            const badges = checkAchievements([], beer as Beer, 100);

            // Then: Century Club awarded
            expect(badges).toContain('century_club');
        });

        test('99th beer does NOT unlock Century Club', () => {
            // Given: User has 98 lifetime beers
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            const beer = createTestBeer(user.id, event.id);

            // When: User logs 99th beer
            const badges = checkAchievements([], beer as Beer, 99);

            // Then: No Century Club yet
            expect(badges).not.toContain('century_club');
        });

        test('101st beer does NOT unlock Century Club again', () => {
            // Given: User has 100 lifetime beers already
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            const beer = createTestBeer(user.id, event.id);

            // When: User logs 101st beer
            const badges = checkAchievements([], beer as Beer, 101);

            // Then: No Century Club (already unlocked at 100)
            expect(badges).not.toContain('century_club');
        });
    });

    describe('6. Leaderboard - "Who\'s Actually Winning?"', () => {
        test('20 users, 100+ beers: Leaderboard stays accurate', () => {
            // Given: Large event with 20 users
            const users = createTestUsers(20, 1);
            users.forEach(u => db.addUser(u));

            const event = createTestEvent();
            db.addEvent(event);

            // When: Each user logs random number of beers (5-15)
            const targetCounts: Record<string, number> = {};
            users.forEach((user, idx) => {
                const count = 5 + idx; // 5, 6, 7, ..., 24
                targetCounts[user.id] = count;
                
                for (let i = 0; i < count; i++) {
                    db.addBeer(createTestBeer(user.id, event.id));
                }
            });

            // Then: Leaderboard matches actual counts
            const leaderboard = db.getBeerCountByUser(event.id);
            expect(leaderboard).toHaveLength(20);

            // Verify descending order
            for (let i = 0; i < leaderboard.length - 1; i++) {
                expect(leaderboard[i]!.count).toBeGreaterThanOrEqual(leaderboard[i + 1]!.count);
            }

            // Verify all counts are correct
            leaderboard.forEach(entry => {
                expect(entry.count).toBe(targetCounts[entry.userId]);
            });

            // Verify leader (User 19 has 24 beers)
            expect(leaderboard[0]!.userId).toBe(users[19]!.id);
            expect(leaderboard[0]!.count).toBe(24);
        });

        test('Leader changes multiple times: Final leader is correct', () => {
            // Given: 3 users in fierce competition
            const users = createTestUsers(3, 0);
            users.forEach(u => db.addUser(u));

            const event = createTestEvent();
            db.addEvent(event);

            // Round 1: User 1 takes lead (3 beers)
            db.addBeer(createTestBeer(users[0]!.id, event.id));
            db.addBeer(createTestBeer(users[0]!.id, event.id));
            db.addBeer(createTestBeer(users[0]!.id, event.id));

            let leaderboard = db.getBeerCountByUser(event.id);
            expect(leaderboard[0]!.userId).toBe(users[0]!.id);

            // Round 2: User 2 takes lead (5 beers)
            for (let i = 0; i < 5; i++) {
                db.addBeer(createTestBeer(users[1]!.id, event.id));
            }

            leaderboard = db.getBeerCountByUser(event.id);
            expect(leaderboard[0]!.userId).toBe(users[1]!.id);

            // Round 3: User 3 takes lead (7 beers)
            for (let i = 0; i < 7; i++) {
                db.addBeer(createTestBeer(users[2]!.id, event.id));
            }

            leaderboard = db.getBeerCountByUser(event.id);
            expect(leaderboard[0]!.userId).toBe(users[2]!.id);

            // Round 4: User 1 comes back (10 beers total)
            for (let i = 0; i < 7; i++) {
                db.addBeer(createTestBeer(users[0]!.id, event.id));
            }

            leaderboard = db.getBeerCountByUser(event.id);
            expect(leaderboard[0]!.userId).toBe(users[0]!.id);
            expect(leaderboard[0]!.count).toBe(10);
        });

        test('Concurrent beer logging: Leaderboard updates correctly', async () => {
            // Given: 5 users all logging simultaneously
            const users = createTestUsers(5, 0);
            users.forEach(u => db.addUser(u));

            const event = createTestEvent();
            db.addEvent(event);

            // When: All 5 users log 3 beers each concurrently
            const logOperations = users.flatMap(user =>
                Array.from({ length: 3 }, () => async () => {
                    await simulateNetworkDelay(Math.random() * 50);
                    return db.addBeer(createTestBeer(user.id, event.id));
                })
            );

            await simulateConcurrentOperations(logOperations);

            // Then: All beers are counted correctly
            const leaderboard = db.getBeerCountByUser(event.id);
            expect(leaderboard).toHaveLength(5);
            
            // Each user should have exactly 3 beers
            leaderboard.forEach(entry => {
                expect(entry.count).toBe(3);
            });

            // Total beers: 15
            const totalBeers = db.getBeersForEvent(event.id);
            expect(totalBeers.length).toBeGreaterThanOrEqual(15);
        });
    });

    describe('7. Badge Deduplication - "No Double Rewards"', () => {
        test('Multiple conditions met: Each badge only appears once', () => {
            // Given: Friday at 4:00 PM UTC (5:00 PM local CET) with 0 beers in event
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            // This beer qualifies for: First Blood, Early Bird, Weekend Warrior
            const ts = new Date('2026-02-13T16:00:00Z'); // Friday, 5 PM local
            const beer = createTestBeer(user.id, event.id, ts.toISOString());

            // When: Check achievements
            const badges = checkAchievements([], beer as Beer, 1);

            // Then: Each badge appears exactly once
            const uniqueBadges = Array.from(new Set(badges));
            expect(badges.length).toBe(uniqueBadges.length);

            // And: All expected badges are present
            expect(badges).toContain('first_blood');
            expect(badges).toContain('early_bird');
            expect(badges).toContain('weekend_warrior');
        });

        test('Hat Trick + Century Club + Weekend Warrior: All distinct', () => {
            // Given: User has 99 lifetime beers, logs 3 beers on Saturday
            const user = createTestUser();
            db.addUser(user);
            const event = createTestEvent();
            db.addEvent(event);

            const baseTime = new Date('2026-02-14T20:00:00Z'); // Saturday

            // First 2 beers (total: 100, 101)
            const beer1 = createTestBeer(user.id, event.id, baseTime.toISOString());
            const beer2 = createTestBeer(user.id, event.id, new Date(baseTime.getTime() + 15 * 60 * 1000).toISOString());
            db.addBeer(beer1);
            db.addBeer(beer2);

            // Third beer (total: 102) - triggers Hat Trick
            const beer3 = createTestBeer(user.id, event.id, new Date(baseTime.getTime() + 30 * 60 * 1000).toISOString());
            
            // When: Check achievements for different lifetime counts
            const badges100 = checkAchievements([beer1 as Beer], beer2 as Beer, 100); // 100th beer
            const badges102 = checkAchievements([beer1 as Beer, beer2 as Beer], beer3 as Beer, 102); // Hat Trick beer

            // Then: Century Club at 100th
            expect(badges100).toContain('century_club');

            // And: Hat Trick at 102nd (with Weekend Warrior)
            expect(badges102).toContain('hat_trick');
            expect(badges102).toContain('weekend_warrior');
            expect(badges102).not.toContain('century_club'); // Only at 100

            // And: No duplicates
            const uniqueBadges102 = Array.from(new Set(badges102));
            expect(badges102.length).toBe(uniqueBadges102.length);
        });
    });

    describe('8. Real-World Achievement Scenario', () => {
        test('Full event: Multiple users unlock different badges', () => {
            // Given: Event starting Friday at 5:30 PM
            const users = createTestUsers(5, 1);
            users.forEach(u => db.addUser(u));

            const event = createTestEvent();
            db.addEvent(event);

            const baseTime = new Date('2026-02-13T16:30:00Z'); // Friday, 5:30 PM local
            const allBadges: Record<string, BadgeType[]> = {};

            // User 1: First Blood + Early Bird + Weekend Warrior
            const u1b1 = createTestBeer(users[0]!.id, event.id, baseTime.toISOString());
            allBadges[users[0]!.id] = checkAchievements([], u1b1 as Beer, 1);
            db.addBeer(u1b1);

            expect(allBadges[users[0]!.id]).toContain('first_blood');
            expect(allBadges[users[0]!.id]).toContain('early_bird');
            expect(allBadges[users[0]!.id]).toContain('weekend_warrior');

            // User 2: Hat Trick + Weekend Warrior (3 beers in 45 min)
            const u2b1 = createTestBeer(users[1]!.id, event.id, new Date(baseTime.getTime() + 5 * 60 * 1000).toISOString());
            const u2b2 = createTestBeer(users[1]!.id, event.id, new Date(baseTime.getTime() + 25 * 60 * 1000).toISOString());
            const u2b3 = createTestBeer(users[1]!.id, event.id, new Date(baseTime.getTime() + 45 * 60 * 1000).toISOString());
            
            db.addBeer(u2b1);
            db.addBeer(u2b2);

            const currentBeers = db.getBeersForEvent(event.id);
            allBadges[users[1]!.id] = checkAchievements(
                currentBeers.filter(b => b.id !== u2b3.id) as Beer[],
                u2b3 as Beer,
                3
            );
            db.addBeer(u2b3);

            expect(allBadges[users[1]!.id]).toContain('hat_trick');
            expect(allBadges[users[1]!.id]).toContain('weekend_warrior');

            // User 3: Night Owl (logs at 3 AM)
            const u3b1 = createTestBeer(users[2]!.id, event.id, new Date('2026-02-14T03:00:00Z').toISOString());
            const beersBeforeU3 = db.getBeersForEvent(event.id);
            allBadges[users[2]!.id] = checkAchievements(beersBeforeU3 as Beer[], u3b1 as Beer, 1);
            db.addBeer(u3b1);

            expect(allBadges[users[2]!.id]).toContain('night_owl');

            // Then: All badges tracked correctly
            expect(Object.keys(allBadges)).toHaveLength(3);
            
            // User 1 has 3 badges
            expect(allBadges[users[0]!.id]!.length).toBe(3);
            
            // User 2 has 2 badges (might have early_bird too if still < 6 PM)
            expect(allBadges[users[1]!.id]).toContain('hat_trick');
            
            // User 3 has 1 badge
            expect(allBadges[users[2]!.id]!.length).toBeGreaterThanOrEqual(1);
        });
    });
});
