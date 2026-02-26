export type AchievementsTable = {
  Row: {
    id: string;
    user_id: string;
    badge_type: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    badge_type: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    badge_type?: string;
    created_at?: string;
  };
};
