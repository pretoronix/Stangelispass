/**
 * Central export point for all query hooks
 * Import from here for better discoverability
 */

// User hooks
export {
  useUsers,
  useAddUser,
  useUpdateUser,
  QUERY_KEYS as USER_QUERY_KEYS,
} from "./useUsersQuery";

// Beer hooks
export {
  useBeersQuery,
  useBeersByUser,
  useBeerCounts,
  useUserAchievements,
  useAddBeer,
  useRemoveBeer,
  useCreateBeerStamp,
  useRedeemBeerStamp,
  QUERY_KEYS as BEER_QUERY_KEYS,
} from "./useBeersQuery";

// Event hooks
export {
  useEventMembership,
  useEventGameStats,
  useEventLeaderState,
  useEventMembers,
  useWallOfFame,
  useUpsertEventMemberRole,
  useRemoveEventMember,
  useJoinEvent,
  useAddToWallOfFame,
  QUERY_KEYS as EVENT_QUERY_KEYS,
} from "./useEventsQuery";

// Permission hooks
export {
  useEventPermissions,
  useHasEventAdminRights,
} from "./useEventPermissions";

// User session hook
export { useCurrentUser } from "./useCurrentUser";
