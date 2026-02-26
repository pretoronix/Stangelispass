export type EventLeaderStateTable = {
  Row: {
    event_id: string;
    user_id: string | null;
    beer_count: number;
    updated_at: string;
  };
  Insert: {
    event_id: string;
    user_id?: string | null;
    beer_count?: number;
    updated_at?: string;
  };
  Update: {
    event_id?: string;
    user_id?: string | null;
    beer_count?: number;
    updated_at?: string;
  };
};
