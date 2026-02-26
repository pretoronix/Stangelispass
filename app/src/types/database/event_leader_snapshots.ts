import type { Json } from "./json";

export type EventLeaderSnapshotsTable = {
  Row: {
    id: string;
    event_id: string;
    leader_id: string | null;
    leader_beer_count: number;
    leader_points: number;
    leader_last_beer_at: string | null;
    leaderboard: Json | null;
    snapshot_at: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    event_id: string;
    leader_id?: string | null;
    leader_beer_count?: number;
    leader_points?: number;
    leader_last_beer_at?: string | null;
    leaderboard?: Json | null;
    snapshot_at: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    event_id?: string;
    leader_id?: string | null;
    leader_beer_count?: number;
    leader_points?: number;
    leader_last_beer_at?: string | null;
    leaderboard?: Json | null;
    snapshot_at?: string;
    created_at?: string;
  };
};
