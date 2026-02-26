export type CommentsTable = {
  Row: {
    id: string;
    beer_id: string;
    user_id: string;
    text: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    beer_id: string;
    user_id: string;
    text: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    beer_id?: string;
    user_id?: string;
    text?: string;
    created_at?: string;
    updated_at?: string;
  };
};
