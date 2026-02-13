import { EventRole, EventPermissions } from './types';

// Re-export types for convenience
export type { EventRole, EventPermissions } from './types';

const PERMISSIONS_BY_ROLE: Record<EventRole, EventPermissions> = {
    owner: {
        canManageEvent: true,
        canManageMembers: true,
        canManageLogs: true,
        canIssueStamps: true,
        canCloseEvent: true,
        canInvite: true,
        canResetEventData: true,
    },
    admin: {
        canManageEvent: true,
        canManageMembers: true,
        canManageLogs: true,
        canIssueStamps: true,
        canCloseEvent: true,
        canInvite: true,
        canResetEventData: false,
    },
    member: {
        canManageEvent: false,
        canManageMembers: false,
        canManageLogs: false,
        canIssueStamps: false,
        canCloseEvent: false,
        canInvite: false,
        canResetEventData: false,
    },
    viewer: {
        canManageEvent: false,
        canManageMembers: false,
        canManageLogs: false,
        canIssueStamps: false,
        canCloseEvent: false,
        canInvite: false,
        canResetEventData: false,
    },
};

export const getPermissionsForRole = (
    role: EventRole | null | undefined,
    fallbackIsAdmin: boolean = false
): EventPermissions => {
    const rolePermissions = role && PERMISSIONS_BY_ROLE[role]
        ? PERMISSIONS_BY_ROLE[role]
        : PERMISSIONS_BY_ROLE.member;

    if (!fallbackIsAdmin) {
        return rolePermissions;
    }

    // Global admins keep admin capabilities even when event role is more restrictive.
    return {
        ...rolePermissions,
        canManageEvent: rolePermissions.canManageEvent || PERMISSIONS_BY_ROLE.admin.canManageEvent,
        canManageMembers: rolePermissions.canManageMembers || PERMISSIONS_BY_ROLE.admin.canManageMembers,
        canManageLogs: rolePermissions.canManageLogs || PERMISSIONS_BY_ROLE.admin.canManageLogs,
        canIssueStamps: rolePermissions.canIssueStamps || PERMISSIONS_BY_ROLE.admin.canIssueStamps,
        canCloseEvent: rolePermissions.canCloseEvent || PERMISSIONS_BY_ROLE.admin.canCloseEvent,
        canInvite: rolePermissions.canInvite || PERMISSIONS_BY_ROLE.admin.canInvite,
        canResetEventData: rolePermissions.canResetEventData || PERMISSIONS_BY_ROLE.admin.canResetEventData,
    };
};

export const hasEventAdminRights = (
    role: EventRole | null | undefined,
    fallbackIsAdmin: boolean = false
) => {
    const perms = getPermissionsForRole(role, fallbackIsAdmin);
    return perms.canManageEvent || perms.canManageMembers || perms.canManageLogs;
};
