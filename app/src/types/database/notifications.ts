import type { Json } from "./json";

export type NotificationsTable = {
  Row: {
    id: string;
    event_id: string | null;
    target_user: string | null;
    payload: Json;
    processed: boolean;
    processed_at: string | null;
    attempts: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    event_id?: string | null;
    target_user?: string | null;
    payload: Json;
    processed?: boolean;
    processed_at?: string | null;
    attempts?: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    event_id?: string | null;
    target_user?: string | null;
    payload?: Json;
    processed?: boolean;
    processed_at?: string | null;
    attempts?: number;
    created_at?: string;
  };
};
