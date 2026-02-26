import type { Json } from "./json";

export type UsersTable = {
  Row: {
    id: string;
    name: string;
    is_admin: boolean;
    subscription_tier: string;
    weight_kg: number;
    gender: "male" | "female" | "neutral";
    notification_prefs: Json | null;
    lifetime_pass: boolean;
    lifetime_pass_granted_at: string | null;
    lifetime_pass_code: string | null;
    free_event_credits: number;
    paid_event_credits_day: number;
    paid_event_credits_weekend: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    is_admin?: boolean;
    subscription_tier?: string;
    weight_kg?: number;
    gender?: "male" | "female" | "neutral";
    notification_prefs?: Json | null;
    lifetime_pass?: boolean;
    lifetime_pass_granted_at?: string | null;
    lifetime_pass_code?: string | null;
    free_event_credits?: number;
    paid_event_credits_day?: number;
    paid_event_credits_weekend?: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    is_admin?: boolean;
    subscription_tier?: string;
    weight_kg?: number;
    gender?: "male" | "female" | "neutral";
    notification_prefs?: Json | null;
    lifetime_pass?: boolean;
    lifetime_pass_granted_at?: string | null;
    lifetime_pass_code?: string | null;
    free_event_credits?: number;
    paid_event_credits_day?: number;
    paid_event_credits_weekend?: number;
    created_at?: string;
  };
};
