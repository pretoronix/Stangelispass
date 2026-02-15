/**
 * Mock Supabase client for integration tests
 * Simulates database operations with in-memory storage
 */

export interface MockUser {
  id: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

export interface MockEvent {
  id: string;
  name: string;
  beer_price: number;
  status: "active" | "closed";
  created_at: string;
}

export interface MockBeer {
  id: string;
  user_id: string;
  event_id: string;
  added_by: string;
  added_by_user_id: string;
  created_at: string;
}

export interface MockEventMembership {
  event_id: string;
  user_id: string;
  role: "admin" | "member";
}

export interface MockWallOfFameEntry {
  id: string;
  event_id: string;
  winner_user_id: string;
  total_beers: number;
  created_at: string;
}

/**
 * In-memory database for testing
 */
export class MockDatabase {
  users: MockUser[] = [];
  events: MockEvent[] = [];
  beers: MockBeer[] = [];
  eventMemberships: MockEventMembership[] = [];
  wallOfFame: MockWallOfFameEntry[] = [];
  achievements: any[] = [];

  reset() {
    this.users = [];
    this.events = [];
    this.beers = [];
    this.eventMemberships = [];
    this.wallOfFame = [];
    this.achievements = [];
  }

  // User operations
  addUser(user: MockUser) {
    this.users.push(user);
    return user;
  }

  getUserById(id: string) {
    return this.users.find((u) => u.id === id);
  }

  // Event operations
  addEvent(event: MockEvent) {
    this.events.push(event);
    return event;
  }

  getActiveEvent() {
    return this.events.find((e) => e.status === "active");
  }

  closeEvent(eventId: string) {
    const event = this.events.find((e) => e.id === eventId);
    if (event) {
      event.status = "closed";
    }
    return event;
  }

  // Beer operations
  addBeer(beer: MockBeer) {
    this.beers.push(beer);
    return beer;
  }

  getBeersForEvent(eventId: string) {
    return this.beers.filter((b) => b.event_id === eventId);
  }

  getBeerCountByUser(eventId: string) {
    const beers = this.getBeersForEvent(eventId);
    const counts = new Map<string, number>();

    beers.forEach((beer) => {
      counts.set(beer.user_id, (counts.get(beer.user_id) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([userId, count]) => {
        const user = this.getUserById(userId);
        return {
          userId,
          name: user?.name || "Unknown",
          count,
          totalPoints: count, // Simplified: actual would include streak bonuses
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }

  // Event membership operations
  addMembership(membership: MockEventMembership) {
    // Check for duplicates
    const exists = this.eventMemberships.find(
      (m) =>
        m.event_id === membership.event_id && m.user_id === membership.user_id,
    );
    if (!exists) {
      this.eventMemberships.push(membership);
    }
    return membership;
  }

  getMembershipsForEvent(eventId: string) {
    return this.eventMemberships.filter((m) => m.event_id === eventId);
  }

  // Wall of Fame operations
  addToWallOfFame(entry: MockWallOfFameEntry) {
    this.wallOfFame.push(entry);
    return entry;
  }

  getWallOfFameEntries() {
    return this.wallOfFame;
  }
}

/**
 * Create a mock Supabase client that uses MockDatabase
 */
export function createMockSupabaseClient(db: MockDatabase) {
  return {
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          data: db[table as keyof MockDatabase],
          error: null,
        }),
        order: (column: string) => ({
          data: db[table as keyof MockDatabase],
          error: null,
        }),
        single: () => ({
          data: Array.isArray(db[table as keyof MockDatabase])
            ? (db[table as keyof MockDatabase] as any[])[0]
            : null,
          error: null,
        }),
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () => {
            const newItem = { ...data, id: `${table}_${Date.now()}` };
            if (table === "users") db.addUser(newItem);
            if (table === "events") db.addEvent(newItem);
            if (table === "beers") db.addBeer(newItem);
            if (table === "event_memberships") db.addMembership(newItem);
            if (table === "wall_of_fame") db.addToWallOfFame(newItem);
            return { data: newItem, error: null };
          },
        }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          data: data,
          error: null,
        }),
      }),
    }),
    channel: () => ({
      on: jest.fn(() => ({ subscribe: jest.fn() })),
    }),
  };
}

/**
 * Helper to simulate network delay
 */
export function simulateNetworkDelay(ms: number = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to simulate concurrent operations
 */
export async function simulateConcurrentOperations<T>(
  operations: (() => Promise<T>)[],
): Promise<T[]> {
  return Promise.all(operations.map((op) => op()));
}
