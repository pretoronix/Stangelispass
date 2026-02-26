export type DeviceTokensTable = {
  Row: {
    id: string;
    user_id: string;
    token: string;
    platform: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    token: string;
    platform?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    token?: string;
    platform?: string | null;
    created_at?: string;
    updated_at?: string;
  };
};
