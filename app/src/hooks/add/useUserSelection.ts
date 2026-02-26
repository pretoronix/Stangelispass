import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { User } from "@/services/supabase";

export function useUserSelection() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleSelectUser = useCallback((user: User) => {
    Haptics.selectionAsync().catch(() => null);
    setSelectedUser(user);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUser(null);
  }, []);

  return {
    selectedUser,
    setSelectedUser,
    handleSelectUser,
    clearSelection,
  };
}
