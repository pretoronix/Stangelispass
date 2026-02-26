export type { Json } from "./database/json";
import type { UsersTable } from "./database/users";
import type { EventsTable } from "./database/events";
import type { EventMembershipsTable } from "./database/event_memberships";
import type { PromoCodesTable } from "./database/promo_codes";
import type { BeersTable } from "./database/beers";
import type { AchievementsTable } from "./database/achievements";
import type { WallOfFameTable } from "./database/wall_of_fame";
import type { ToastsTable } from "./database/toasts";
import type { BeerStampsTable } from "./database/beer_stamps";
import type { DeviceTokensTable } from "./database/device_tokens";
import type { NotificationsTable } from "./database/notifications";
import type { CommentsTable } from "./database/comments";
import type { EventGameStatsTable } from "./database/event_game_stats";
import type { EventLeaderStateTable } from "./database/event_leader_state";
import type { EventLeaderSnapshotsTable } from "./database/event_leader_snapshots";

export interface PublicTables {
  users: UsersTable;
  events: EventsTable;
  event_memberships: EventMembershipsTable;
  promo_codes: PromoCodesTable;
  beers: BeersTable;
  achievements: AchievementsTable;
  wall_of_fame: WallOfFameTable;
  toasts: ToastsTable;
  beer_stamps: BeerStampsTable;
  device_tokens: DeviceTokensTable;
  notifications: NotificationsTable;
  comments: CommentsTable;
  event_game_stats: EventGameStatsTable;
  event_leader_state: EventLeaderStateTable;
  event_leader_snapshots: EventLeaderSnapshotsTable;
}

export interface Database {
  public: {
    Tables: PublicTables;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Helper types for easier access
export type TableRow<T extends keyof PublicTables> = PublicTables[T]["Row"];
export type TableInsert<T extends keyof PublicTables> =
  PublicTables[T]["Insert"];
export type TableUpdate<T extends keyof PublicTables> =
  PublicTables[T]["Update"];

// Direct exports for common types
export type UserRow = TableRow<"users">;
export type EventRow = TableRow<"events">;
export type BeerRow = TableRow<"beers">;
export type CommentRow = TableRow<"comments">;
export type EventMembershipRow = TableRow<"event_memberships">;
export type AchievementRow = TableRow<"achievements">;
export type WallOfFameRow = TableRow<"wall_of_fame">;
export type NotificationRow = TableRow<"notifications">;
export type DeviceTokenRow = TableRow<"device_tokens">;
export type BeerStampRow = TableRow<"beer_stamps">;
export type PromoCodeRow = TableRow<"promo_codes">;
export type ToastRow = TableRow<"toasts">;
