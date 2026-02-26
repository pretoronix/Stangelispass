export type BeersTable = {
  Row: {
    id: string;
    user_id: string;
    event_id: string | null;
    added_by: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    event_id?: string | null;
    added_by?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    event_id?: string | null;
    added_by?: string | null;
    created_at?: string;
  };
};
