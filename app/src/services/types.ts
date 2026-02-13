import { Database } from '@/types/database.types';
import { BadgeType } from './achievements';

/**
 * Type definitions for Supabase entities
 * Centralizes all type exports for better organization
 */

export type NotificationPrefs = {
    leader_change: boolean;
    milestones: number[];
    admin_broadcasts: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
    leader_change: true,
    milestones: [5, 10, 20],
    admin_broadcasts: true,
};

export type EventRole = 'owner' | 'admin' | 'member' | 'viewer';

export type EventPermissions = {
    canManageEvent: boolean;
    canManageMembers: boolean;
    canManageLogs: boolean;
    canIssueStamps: boolean;
    canCloseEvent: boolean;
    canInvite: boolean;
    canResetEventData: boolean;
};

export type User = Database['public']['Tables']['users']['Row'] & {
    subscription_tier?: 'pilsner' | 'craft' | 'brewmaster';
    weight_kg?: number;
    gender?: 'male' | 'female' | 'neutral';
    notification_prefs?: NotificationPrefs;
};

export type Event = {
    id: string;
    name: string;
    created_by: string;
    is_active: boolean;
    pass_type: 'free' | 'standard' | 'weekend';
    expires_at: string;
    created_at: string;
    beer_price?: number; // Price per beer in CHF (default: 5.00)
};

export type EventMembership = {
    id: string;
    event_id: string;
    user_id: string;
    role: EventRole;
    status: 'active' | 'invited' | 'removed';
    invited_by: string | null;
    joined_at: string;
    created_at: string;
    user?: Pick<User, 'id' | 'name' | 'is_admin'> | null;
};

export type EventGameStats = {
    event_id: string;
    user_id: string;
    beer_count: number;
    points: number;
    streak_count: number;
    longest_streak: number;
    last_beer_at: string | null;
    lead_changes: number;
    user?: Pick<User, 'id' | 'name' | 'is_admin'> | null;
};

export type EventLeaderState = {
    event_id: string;
    user_id: string | null;
    beer_count: number;
    updated_at: string;
    user?: Pick<User, 'id' | 'name' | 'is_admin'> | null;
};

export type Beer = Database['public']['Tables']['beers']['Row'] & {
    event_id?: string;
    user?: User | null;
    added_by_user?: User | null;
};

export type BeerStamp = {
    id: string;
    user_id: string;
    event_id: string;
    issued_by: string | null;
    consumed_by: string | null;
    consumed_at: string | null;
    expires_at: string;
    created_at: string;
};

export type BeerStampIssueResult = {
    stamp: BeerStamp | null;
    fallbackLegacy: boolean;
};

export type Achievement = {
    id: string;
    user_id: string;
    badge_type: BadgeType;
    created_at: string;
};

export type Comment = {
    id: string;
    beer_id: string;
    user_id: string;
    text: string;
    created_at: string;
    updated_at: string;
    user?: Pick<User, 'id' | 'name' | 'is_admin'> | null;
    beer?: Pick<Beer, 'id' | 'user_id' | 'event_id'> | null;
};

export type CommentInput = {
    beer_id: string;
    user_id: string;
    text: string;
};

export type CommentUpdate = {
    text: string;
};

