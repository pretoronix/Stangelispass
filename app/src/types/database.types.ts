export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    name: string
                    is_admin: boolean
                    subscription_tier: string
                    weight_kg: number
                    gender: 'male' | 'female' | 'neutral'
                    notification_prefs: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    is_admin?: boolean
                    subscription_tier?: string
                    weight_kg?: number
                    gender?: 'male' | 'female' | 'neutral'
                    notification_prefs?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    is_admin?: boolean
                    subscription_tier?: string
                    weight_kg?: number
                    gender?: 'male' | 'female' | 'neutral'
                    notification_prefs?: Json | null
                    created_at?: string
                }
            }
            events: {
                Row: {
                    id: string
                    name: string
                    created_by: string | null
                    is_active: boolean
                    pass_type: string
                    beer_price: number
                    expires_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    created_by?: string | null
                    is_active?: boolean
                    pass_type?: string
                    beer_price?: number
                    expires_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    created_by?: string | null
                    is_active?: boolean
                    pass_type?: string
                    beer_price?: number
                    expires_at?: string | null
                    created_at?: string
                }
            }
            event_memberships: {
                Row: {
                    id: string
                    event_id: string
                    user_id: string
                    role: 'owner' | 'admin' | 'member' | 'viewer'
                    status: 'active' | 'invited' | 'removed'
                    invited_by: string | null
                    joined_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    event_id: string
                    user_id: string
                    role?: 'owner' | 'admin' | 'member' | 'viewer'
                    status?: 'active' | 'invited' | 'removed'
                    invited_by?: string | null
                    joined_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    event_id?: string
                    user_id?: string
                    role?: 'owner' | 'admin' | 'member' | 'viewer'
                    status?: 'active' | 'invited' | 'removed'
                    invited_by?: string | null
                    joined_at?: string | null
                    created_at?: string
                }
            }
            beers: {
                Row: {
                    id: string
                    user_id: string
                    event_id: string | null
                    added_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    event_id?: string | null
                    added_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    event_id?: string | null
                    added_by?: string | null
                    created_at?: string
                }
            }
            achievements: {
                Row: {
                    id: string
                    user_id: string
                    badge_type: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    badge_type: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    badge_type?: string
                    created_at?: string
                }
            }
            wall_of_fame: {
                Row: {
                    id: string
                    event_id: string | null
                    winner_id: string | null
                    total_stängeli: number
                    image_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    event_id?: string | null
                    winner_id?: string | null
                    total_stängeli?: number
                    image_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    event_id?: string | null
                    winner_id?: string | null
                    total_stängeli?: number
                    image_url?: string | null
                    created_at?: string
                }
            }
            toasts: {
                Row: {
                    id: string
                    wall_id: string | null
                    user_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    wall_id?: string | null
                    user_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    wall_id?: string | null
                    user_id?: string | null
                    created_at?: string
                }
            }
            beer_stamps: {
                Row: {
                    id: string
                    user_id: string
                    event_id: string
                    issued_by: string | null
                    consumed_by: string | null
                    consumed_at: string | null
                    expires_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    event_id: string
                    issued_by?: string | null
                    consumed_by?: string | null
                    consumed_at?: string | null
                    expires_at: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    event_id?: string
                    issued_by?: string | null
                    consumed_by?: string | null
                    consumed_at?: string | null
                    expires_at?: string
                    created_at?: string
                }
            }
            device_tokens: {
                Row: {
                    id: string
                    user_id: string
                    token: string
                    platform: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    token: string
                    platform?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    token?: string
                    platform?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    event_id: string | null
                    target_user: string | null
                    payload: Json
                    processed: boolean
                    processed_at: string | null
                    attempts: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    event_id?: string | null
                    target_user?: string | null
                    payload: Json
                    processed?: boolean
                    processed_at?: string | null
                    attempts?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    event_id?: string | null
                    target_user?: string | null
                    payload?: Json
                    processed?: boolean
                    processed_at?: string | null
                    attempts?: number
                    created_at?: string
                }
            }
            comments: {
                Row: {
                    id: string
                    beer_id: string
                    user_id: string
                    text: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    beer_id: string
                    user_id: string
                    text: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    beer_id?: string
                    user_id?: string
                    text?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            event_game_stats: {
                Row: {
                    event_id: string
                    user_id: string
                    beer_count: number
                    points: number
                    streak_count: number
                    longest_streak: number
                    last_beer_at: string | null
                    lead_changes: number
                }
                Insert: {
                    event_id: string
                    user_id: string
                    beer_count?: number
                    points?: number
                    streak_count?: number
                    longest_streak?: number
                    last_beer_at?: string | null
                    lead_changes?: number
                }
                Update: {
                    event_id?: string
                    user_id?: string
                    beer_count?: number
                    points?: number
                    streak_count?: number
                    longest_streak?: number
                    last_beer_at?: string | null
                    lead_changes?: number
                }
            }
            event_leader_state: {
                Row: {
                    event_id: string
                    user_id: string | null
                    beer_count: number
                    updated_at: string
                }
                Insert: {
                    event_id: string
                    user_id?: string | null
                    beer_count?: number
                    updated_at?: string
                }
                Update: {
                    event_id?: string
                    user_id?: string | null
                    beer_count?: number
                    updated_at?: string
                }
            }
            event_leader_snapshots: {
                Row: {
                    id: string
                    event_id: string
                    leader_id: string | null
                    leader_beer_count: number
                    leader_points: number
                    leader_last_beer_at: string | null
                    leaderboard: Json | null
                    snapshot_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    event_id: string
                    leader_id?: string | null
                    leader_beer_count?: number
                    leader_points?: number
                    leader_last_beer_at?: string | null
                    leaderboard?: Json | null
                    snapshot_at?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    event_id?: string
                    leader_id?: string | null
                    leader_beer_count?: number
                    leader_points?: number
                    leader_last_beer_at?: string | null
                    leaderboard?: Json | null
                    snapshot_at?: string
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
