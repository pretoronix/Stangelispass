import { useMemo } from "react";
import { useEventMembership } from "@/hooks/useEventsQuery";
import {
  getPermissionsForRole,
  EventPermissions,
  EventRole,
} from "@/services/permissions";

/**
 * Custom hook to get event permissions for a user
 * Combines membership lookup with permission calculation
 */
export function useEventPermissions(
  eventId: string | undefined | null,
  userId: string | undefined | null,
  isGlobalAdmin: boolean = false,
): {
  permissions: EventPermissions;
  role: EventRole | null;
  loading: boolean;
  missingTable: boolean;
} {
  const { data, isLoading } = useEventMembership(
    eventId || "",
    userId || "",
    !!(eventId && userId),
  );

  const result = useMemo(() => {
    // Default state when no event or user
    if (!eventId || !userId) {
      return {
        permissions: getPermissionsForRole(null, isGlobalAdmin),
        role: null as EventRole | null,
        missingTable: false,
      };
    }

    // Data from query
    const role = data?.membership?.role || null;
    const missingTable = data?.missingTable || false;

    return {
      permissions: getPermissionsForRole(role, isGlobalAdmin),
      role,
      missingTable,
    };
  }, [eventId, userId, data, isGlobalAdmin]);

  return {
    ...result,
    loading: isLoading,
  };
}

/**
 * Simple hook to check if user has admin rights
 */
export function useHasEventAdminRights(
  eventId: string | undefined | null,
  userId: string | undefined | null,
  isGlobalAdmin: boolean = false,
): boolean {
  const { permissions } = useEventPermissions(eventId, userId, isGlobalAdmin);
  return (
    permissions.canManageEvent ||
    permissions.canManageMembers ||
    permissions.canManageLogs
  );
}
