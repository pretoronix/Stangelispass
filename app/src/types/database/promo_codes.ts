export type PromoCodesTable = {
  Row: {
    id: string;
    code: string;
    type: string;
    credits: number;
    active: boolean;
    created_by: string | null;
    redeemed_by: string | null;
    redeemed_at: string | null;
    expires_at: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    code: string;
    type: string;
    credits?: number;
    active?: boolean;
    created_by?: string | null;
    redeemed_by?: string | null;
    redeemed_at?: string | null;
    expires_at?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    code?: string;
    type?: string;
    credits?: number;
    active?: boolean;
    created_by?: string | null;
    redeemed_by?: string | null;
    redeemed_at?: string | null;
    expires_at?: string | null;
    created_at?: string;
  };
};
