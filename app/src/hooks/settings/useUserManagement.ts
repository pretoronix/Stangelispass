import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { User, addUser, updateUser } from '@/services/supabase';
import { registerForPushNotificationsAsync } from '@/services/notifications';
import { playHapticSelection, playHapticSuccess, playHapticError, playHapticImpact } from '@/utils/settings/settingsHelpers';

interface UseUserManagementProps {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    refreshUsers: () => Promise<void>;
}

export const useUserManagement = ({ currentUser, setCurrentUser, refreshUsers }: UseUserManagementProps) => {
    const [newUserName, setNewUserName] = useState('');
    const [isNewUserAdmin, setIsNewUserAdmin] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSelectUser = useCallback(async (user: User) => {
        playHapticSelection();
        setCurrentUser(user);
        Alert.alert('User Selected', `You are now signed in as ${user.name}`);
        try {
            registerForPushNotificationsAsync(user.id).catch((e) => console.warn('Push register failed', e));
        } catch (e) {
            console.warn('Push registration error', e);
        }
    }, [setCurrentUser]);

    const handleAddUser = useCallback(async () => {
        if (!newUserName.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }

        setLoading(true);
        try {
            const user = await addUser(newUserName.trim(), isNewUserAdmin);
            if (!user) {
                Alert.alert('Error', 'User could not be created. Check your database connection.');
                return;
            }
            await setCurrentUser(user);
            try {
                registerForPushNotificationsAsync(user.id).catch((e) => console.warn('Push register failed', e));
            } catch (e) {
                console.warn('Push registration error', e);
            }
            playHapticSuccess();
            await refreshUsers();
            setNewUserName('');
            setIsNewUserAdmin(false);
            Alert.alert('Success', `Added ${user.name}!`);
        } catch (e) {
            playHapticError();
            Alert.alert('Error', 'Failed to add user');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [newUserName, isNewUserAdmin, setCurrentUser, refreshUsers]);

    const handleLogout = useCallback(() => {
        playHapticImpact();
        setCurrentUser(null);
    }, [setCurrentUser]);

    const handleUpdateUserField = useCallback(async (field: Partial<User>) => {
        if (!currentUser) return;
        try {
            await updateUser(currentUser.id, field);
            setCurrentUser({ ...currentUser, ...field });
        } catch (e) {
            console.warn('Failed to update user field:', e);
            throw e;
        }
    }, [currentUser, setCurrentUser]);

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
