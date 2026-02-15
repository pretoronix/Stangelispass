import { Database } from "@/types/database.types";
/**
 * Type definitions for Supabase entities
 * Centralizes all type exports for better organization
 */

export type BadgeType =
  | "hat_trick"
  | "early_bird"
  | "night_owl"
  | "century_club"
  | "first_blood"
  | "weekend_warrior";

export type NotificationPrefs = {
  leader_change: boolean;
  milestones: number[];
  admin_broadcasts: boolean;
  new_round: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  leader_change: true,
  milestones: [5, 10, 20],
  admin_broadcasts: true,
  new_round: true,
};

export type EventRole = "owner" | "admin" | "member" | "viewer";

export type EventPermissions = {
  canManageEvent: boolean;
  canManageMembers: boolean;
  canManageLogs: boolean;
  canIssueStamps: boolean;
  canCloseEvent: boolean;
  canInvite: boolean;
  canResetEventData: boolean;
};

export type User = Database["public"]["Tables"]["users"]["Row"] & {
  subscription_tier?: "pilsner" | "craft" | "brewmaster" | "lifetime";
  physiology?: {
    weight_kg?: number;
    gender?: "male" | "female" | "other";
  };
  notification_prefs?: NotificationPrefs;
  lifetime_pass?: boolean;
  lifetime_pass_granted_at?: string | null;
  lifetime_pass_code?: string | null;
  free_event_credits?: number | null;
  paid_event_credits_day?: number | null;
  paid_event_credits_weekend?: number | null;
};

export type Event = {
  id: string;
  name: string;
  created_by: string;
  is_active: boolean;
  pass_type: "free" | "day" | "week" | "year";
  expires_at: string;
  created_at: string;
  beer_price?: number; // Price per beer in CHF (default: 5.00)
};

export type EventMembership = {
  id: string;
  event_id: string;
  user_id: string;
  role: EventRole;
  status: "active" | "invited" | "removed";
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  user?: Pick<User, "id" | "name" | "is_admin"> | null;
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
  user?: Pick<User, "id" | "name" | "is_admin"> | null;
};

export type EventLeaderState = {
  event_id: string;
  user_id: string | null;
  beer_count: number;
  updated_at: string;
  user?: Pick<User, "id" | "name" | "is_admin"> | null;
};

export type EventLeaderSnapshot = {
  id: string;
  event_id: string;
  leader_id: string | null;
  leader_beer_count: number;
  leader_points: number;
  leader_last_beer_at: string | null;
  leaderboard:
    | {
        user_id: string;
        name: string;
        beer_count: number;
        points?: number;
        last_beer_at?: string | null;
      }[]
    | null;
  snapshot_at: string;
  created_at: string;
};

export type Beer = Database["public"]["Tables"]["beers"]["Row"] & {
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
  user?: Pick<User, "id" | "name" | "is_admin"> | null;
  beer?: Pick<Beer, "id" | "user_id" | "event_id"> | null;
};

export type CommentInput = {
  beer_id: string;
  user_id: string;
  text: string;
};

export type CommentUpdate = {
  text: string;
};
