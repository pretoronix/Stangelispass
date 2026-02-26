export type WallOfFameTable = {
  Row: {
    id: string;
    event_id: string | null;
    winner_id: string | null;
    total_stängeli: number;
    image_url: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    event_id?: string | null;
    winner_id?: string | null;
    total_stängeli?: number;
    image_url?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    event_id?: string | null;
    winner_id?: string | null;
    total_stängeli?: number;
    image_url?: string | null;
    created_at?: string;
  };
};
