export type EventsTable = {
  Row: {
    id: string;
    name: string;
    created_by: string | null;
    is_active: boolean;
    pass_type: string;
    beer_price: number;
    expires_at: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    created_by?: string | null;
    is_active?: boolean;
    pass_type?: string;
    beer_price?: number;
    expires_at?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    created_by?: string | null;
    is_active?: boolean;
    pass_type?: string;
    beer_price?: number;
    expires_at?: string | null;
    created_at?: string;
  };
};
