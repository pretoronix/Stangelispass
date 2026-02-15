import React from 'react';
import { colors } from '@/lib/theme';
import { normalizeNotificationPrefs } from '@/services/supabase';
import { useApp } from '@/providers/AppProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { reportError } from '@/utils/logger';
import {
    useUserManagement,
    useNotificationPreferences,
    useCacheManagement,
    useAnimationPreferences,
    useEventManagement,
    useLifetimePasses,
    useLiveBeerLogPreference,
} from '@/hooks/settings';
import {
    StartEventModal,
} from '@/components/settings';
import { SettingsSections } from '@/screens/settings/SettingsSections';

export default function SettingsScreen() {
    const {
        currentUser,
        setCurrentUser,
        users,
        refreshUsers,
        isAdmin,
        startEvent,
        activeEvent,
        currentEventRole,
        eventPermissions,
        eventMembers,
        refreshEventMembers,
    } = useApp();

    const notificationPrefs = normalizeNotificationPrefs(currentUser?.notification_prefs);

    const userManagement = useUserManagement({ currentUser, setCurrentUser, refreshUsers });
    const cacheManagement = useCacheManagement();
    const animationPreferences = useAnimationPreferences();
    const notificationPreferences = useNotificationPreferences({
        currentUser,
        setCurrentUser,
        notificationPrefs,
    });
    const liveBeerLogPreference = useLiveBeerLogPreference();
    const eventManagement = useEventManagement({
        currentUser,
        isAdmin,
        startEvent,
        activeEvent,
        eventPermissions,
        eventMembers,
        refreshEventMembers,
        users,
    });
    const lifetimePasses = useLifetimePasses({
        currentUser,
        setCurrentUser,
        refreshUsers,
    });

    const [showUserModal, setShowUserModal] = React.useState(false);

    const handleUpdateWeight = async (weight: number) => {
        try {
            await userManagement.handleUpdateUserField({ weight_kg: weight });
        } catch (e) {
            reportError(new Error('Failed to update weight'), {
                scope: 'settings',
                action: 'update_weight',
                metadata: { cause: e instanceof Error ? e.message : String(e) },
            });
        }
    };

    const handleUpdateGender = async (gender: 'male' | 'female' | 'neutral') => {
        try {
            await userManagement.handleUpdateUserField({ gender });
        } catch (e) {
            reportError(new Error('Failed to update gender'), {
                scope: 'settings',
                action: 'update_gender',
                metadata: { cause: e instanceof Error ? e.message : String(e) },
            });
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
            <SettingsSections
                currentUser={currentUser}
                isAdmin={isAdmin}
                currentEventRole={currentEventRole}
                eventPermissions={eventPermissions}
                activeEvent={activeEvent}
                eventMembers={eventMembers}
                users={users}
                notificationPrefs={notificationPrefs}
                userManagement={userManagement}
                cacheManagement={cacheManagement}
                animationPreferences={animationPreferences}
                notificationPreferences={notificationPreferences}
                liveBeerLogPreference={liveBeerLogPreference}
                eventManagement={eventManagement}
                lifetimePasses={lifetimePasses}
                onManageUsers={() => setShowUserModal(true)}
                onUpdateWeight={handleUpdateWeight}
                onUpdateGender={handleUpdateGender}
            />

            <StartEventModal
                visible={eventManagement.showEventModal}
                eventName={eventManagement.newEventName}
                passType={eventManagement.newEventPassType}
                onChangeEventName={eventManagement.setNewEventName}
                onChangePassType={eventManagement.setNewEventPassType}
                onCancel={() => eventManagement.setShowEventModal(false)}
                onStart={eventManagement.handleStartEvent}
            />
        </SafeAreaView>
    );
}
