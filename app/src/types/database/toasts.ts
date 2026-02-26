export type ToastsTable = {
  Row: {
    id: string;
    wall_id: string | null;
    user_id: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    wall_id?: string | null;
    user_id?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    wall_id?: string | null;
    user_id?: string | null;
    created_at?: string;
  };
};
