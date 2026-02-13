import { useCallback } from 'react';
import { Alert } from 'react-native';
import { User, updateUser, NotificationPrefs } from '@/services/supabase';
import { MILESTONES } from '@/utils/settings/settingsConstants';
import { reportError } from '@/utils/logger';

interface UseNotificationPreferencesProps {
    currentUser: User | null;
    setCurrentUser: (user: User) => void;
    notificationPrefs: NotificationPrefs;
}

export const useNotificationPreferences = ({ 
    currentUser, 
    setCurrentUser, 
    notificationPrefs 
}: UseNotificationPreferencesProps) => {
    const updateNotificationPrefs = useCallback(async (nextPrefs: NotificationPrefs) => {
        if (!currentUser) return;
        const previousUser = currentUser;
        const nextUser = { ...currentUser, notification_prefs: nextPrefs };
        setCurrentUser(nextUser);
        try {
            await updateUser(currentUser.id, { notification_prefs: nextPrefs } as Partial<User>);
        } catch (e) {
            reportError(new Error('Failed to update notification prefs:', e), { scope: 'useNotificationPreferences', action: 'replace_console', level: 'warn' });
            setCurrentUser(previousUser);
            Alert.alert('Error', 'Could not save notification settings.');
        }
    }, [currentUser, setCurrentUser]);

    const toggleLeaderChange = useCallback((value: boolean) => {
        updateNotificationPrefs({
            ...notificationPrefs,
            leader_change: value,
        });
    }, [notificationPrefs, updateNotificationPrefs]);

    const toggleMilestone = useCallback((milestone: number, value: boolean) => {
        const nextMilestones = value
            ? [...notificationPrefs.milestones, milestone]
            : notificationPrefs.milestones.filter((m) => m !== milestone);
        updateNotificationPrefs({
            ...notificationPrefs,
            milestones: [...new Set(nextMilestones)].sort((a, b) => a - b),
        });
    }, [notificationPrefs, updateNotificationPrefs]);

    const toggleAdminBroadcasts = useCallback((value: boolean) => {
        updateNotificationPrefs({
            ...notificationPrefs,
            admin_broadcasts: value,
        });
    }, [notificationPrefs, updateNotificationPrefs]);

    return {
        updateNotificationPrefs,
        toggleLeaderChange,
        toggleMilestone,
        toggleAdminBroadcasts,
        milestones: MILESTONES,
    };
};
