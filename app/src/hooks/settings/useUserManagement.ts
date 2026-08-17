import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { User, addUser, updateUser } from "@/services/supabase";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import {
  playHapticSelection,
  playHapticSuccess,
  playHapticError,
  playHapticImpact,
} from "@/utils/settings/settingsHelpers";
import { reportError } from "@/utils/logger";
import { copy } from "@/ui/copy";

interface UseUserManagementProps {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  refreshUsers: () => Promise<void>;
}

export const useUserManagement = ({
  currentUser,
  setCurrentUser,
  refreshUsers,
}: UseUserManagementProps) => {
  const [newUserName, setNewUserName] = useState("");
  const [isNewUserAdmin, setIsNewUserAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectUser = useCallback(
    async (user: User) => {
      playHapticSelection();
      setCurrentUser(user);
      Alert.alert(copy.settings.alerts.userSelected, `You are now signed in as ${user.name}`);
      try {
        registerForPushNotificationsAsync(user.id).catch((e) =>
          reportError(new Error("Push register failed"), {
            scope: "useUserManagement",
            action: "push_register",
            metadata: { cause: e instanceof Error ? e.message : String(e) },
          }),
        );
      } catch (e) {
        reportError(new Error("Push registration error"), {
          scope: "useUserManagement",
          action: "push_register",
          metadata: { cause: e instanceof Error ? e.message : String(e) },
        });
      }
    },
    [setCurrentUser],
  );

  const handleAddUser = useCallback(async () => {
    if (!newUserName.trim()) {
      Alert.alert(copy.common.error, copy.settings.alerts.enterName);
      return;
    }

    setLoading(true);
    try {
      const user = await addUser(newUserName.trim(), isNewUserAdmin);
      if (!user) {
        Alert.alert(
          copy.common.error,
          copy.settings.alerts.userCreateFailed,
        );
        return;
      }
      await setCurrentUser(user);
      try {
        registerForPushNotificationsAsync(user.id).catch((e) =>
          reportError(new Error("Push register failed"), {
            scope: "useUserManagement",
            action: "push_register",
            metadata: { cause: e instanceof Error ? e.message : String(e) },
          }),
        );
      } catch (e) {
        reportError(new Error("Push registration error"), {
          scope: "useUserManagement",
          action: "push_register",
          metadata: { cause: e instanceof Error ? e.message : String(e) },
        });
      }
      playHapticSuccess();
      await refreshUsers();
      setNewUserName("");
      setIsNewUserAdmin(false);
      Alert.alert(copy.common.success, `Added ${user.name}!`);
    } catch (e) {
      playHapticError();
      Alert.alert(copy.common.error, copy.settings.alerts.addUserFailed);
      reportError(e as Error, {
        scope: "useUserManagement",
        action: "add_user",
      });
    } finally {
      setLoading(false);
    }
  }, [newUserName, isNewUserAdmin, setCurrentUser, refreshUsers]);

  const handleLogout = useCallback(() => {
    playHapticImpact();
    setCurrentUser(null);
  }, [setCurrentUser]);

  const handleUpdateUserField = useCallback(
    async (field: Partial<User>) => {
      if (!currentUser) return;
      try {
        await updateUser(currentUser.id, field);
        setCurrentUser({ ...currentUser, ...field });
      } catch (e) {
        reportError(new Error("Failed to update user field"), {
          scope: "useUserManagement",
          action: "update_user_field",
          metadata: { cause: e instanceof Error ? e.message : String(e) },
        });
        throw e;
      }
    },
    [currentUser, setCurrentUser],
  );

  return {
    newUserName,
    setNewUserName,
    isNewUserAdmin,
    setIsNewUserAdmin,
    loading,
    handleSelectUser,
    handleAddUser,
    handleLogout,
    handleUpdateUserField,
  };
};
