/**
 * Main Supabase module
 * Re-exports all supabase-related services for backward compatibility
 *
 * This file maintains the existing API while delegating to modular services:
 * - client.ts: Supabase client initialization
 * - types.ts: Type definitions
 * - users.ts: User operations
 * - beers.ts: Beer and achievement operations
 * - events.ts: Event and membership operations
 * - storage.ts: Storage adapter
 * - permissions.ts: Role-based permissions
 * - helpers.ts: Utility functions
 */

// Client and configuration
export { supabase, isSupabaseConfigured } from "./client";

// Types
export type {
  User,
  Event,
  EventRole,
  EventPermissions,
  EventMembership,
  EventGameStats,
  EventLeaderState,
  EventLeaderSnapshot,
  Beer,
  BeerStamp,
  BeerStampIssueResult,
  Achievement,
  NotificationPrefs,
  Comment,
  CommentInput,
  CommentUpdate,
} from "./types";

export { DEFAULT_NOTIFICATION_PREFS } from "./types";

// Storage
export { ExpoSecureStoreAdapter } from "./storage";
export type { StorageAdapter } from "./storage";

// Permissions
export { getPermissionsForRole, hasEventAdminRights } from "./permissions";

// Helpers
export { isMissingTableError } from "./helpers";

// User operations
export {
  getUsers,
  addUser,
  updateUser,
  normalizeNotificationPrefs,
} from "./users";

// Beer operations
export {
  addBeer,
  getBeers,
  getBeersByUser,
  removeBeer,
  getBeerCountByUser,
  getBeerCountByEventMembers,
  createBeerStamp,
  redeemBeerStamp,
  getUserAchievements,
} from "./beers";

// Event operations
export {
  getEventMembership,
  getEventGameStats,
  getEventLeaderState,
  createLeaderEventSnapshot,
  getEventMembers,
  upsertEventMemberRole,
  removeEventMember,
  joinEvent,
  getWallOfFame,
  addToWallOfFame,
  resetEventData,
} from "./events";

// Comment operations
export {
  getComments,
  getCommentsByEvent,
  getCommentCount,
  addComment,
  updateComment,
  deleteComment,
} from "./comments";

// Lifetime pass codes
export {
  listLifetimePassCodes,
  createLifetimePassCode,
  redeemLifetimePassCode,
} from "./lifetimePass";
