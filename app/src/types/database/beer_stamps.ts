export type BeerStampsTable = {
  Row: {
    id: string;
    user_id: string;
    event_id: string;
    issued_by: string | null;
    consumed_by: string | null;
    consumed_at: string | null;
    expires_at: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    event_id: string;
    issued_by?: string | null;
    consumed_by?: string | null;
    consumed_at?: string | null;
    expires_at: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    event_id?: string;
    issued_by?: string | null;
    consumed_by?: string | null;
    consumed_at?: string | null;
    expires_at?: string;
    created_at?: string;
  };
};
