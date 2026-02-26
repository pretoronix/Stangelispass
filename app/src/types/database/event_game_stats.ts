export type EventGameStatsTable = {
  Row: {
    event_id: string;
    user_id: string;
    beer_count: number;
    points: number;
    streak_count: number;
    longest_streak: number;
    last_beer_at: string | null;
    lead_changes: number;
  };
  Insert: {
    event_id: string;
    user_id: string;
    beer_count?: number;
    points?: number;
    streak_count?: number;
    longest_streak?: number;
    last_beer_at?: string | null;
    lead_changes?: number;
  };
  Update: {
    event_id?: string;
    user_id?: string;
    beer_count?: number;
    points?: number;
    streak_count?: number;
    longest_streak?: number;
    last_beer_at?: string | null;
    lead_changes?: number;
  };
};
