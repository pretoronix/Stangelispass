export type EventMembershipsTable = {
  Row: {
    id: string;
    event_id: string;
    user_id: string;
    role: "owner" | "admin" | "member" | "viewer";
    status: "active" | "invited" | "removed";
    invited_by: string | null;
    joined_at: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    event_id: string;
    user_id: string;
    role?: "owner" | "admin" | "member" | "viewer";
    status?: "active" | "invited" | "removed";
    invited_by?: string | null;
    joined_at?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    event_id?: string;
    user_id?: string;
    role?: "owner" | "admin" | "member" | "viewer";
    status?: "active" | "invited" | "removed";
    invited_by?: string | null;
    joined_at?: string | null;
    created_at?: string;
  };
};
