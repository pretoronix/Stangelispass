import type {
  User,
  Event,
  EventRole,
  EventPermissions,
  EventMembership,
} from "@/services/supabase";
import type { OfflineMutation } from "@/hooks/useOfflineMutations";

export interface AppContextType {
  currentUser: User | null;
  isAdmin: boolean;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  refreshUsers: () => Promise<void>;
  loading: boolean;
  activeEvent: Event | null;
  startEvent: (
    name: string,
    passType: Event["pass_type"],
    beerPrice?: number,
  ) => Promise<void>;
  closeEvent: () => Promise<void>;
  showRecap: boolean;
  setShowRecap: (show: boolean) => void;
  remoteAvailable: boolean;
  supabaseConfigured: boolean;
  currentEventRole: EventRole | null;
  eventPermissions: EventPermissions;
  eventMembers: EventMembership[];
  refreshEventMembers: () => Promise<void>;
  offlineQueue: OfflineMutation[];
  addOfflineMutation: (
    mutation: Omit<OfflineMutation, "id" | "timestamp">,
  ) => Promise<void>;
  offlineQueueProcessing: boolean;
}
