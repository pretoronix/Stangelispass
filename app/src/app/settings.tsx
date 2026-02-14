import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';
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
    CurrentUserCard,
    AddUserSection,
    EventAdminSection,
    PremiumTierCard,
    PhysiologySection,
    SensorySection,
    CacheManagementSection,
    LiveBeerLogSection,
    NotificationsSection,
    LifetimePassSection,
    UserSelectionGrid,
    StartEventModal,
} from '@/components/settings';

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
            reportError(new Error('Failed to update weight:', e), { scope: 'settings', action: 'replace_console' });
        }
    };

    const handleUpdateGender = async (gender: 'male' | 'female' | 'neutral') => {
        try {
            await userManagement.handleUpdateUserField({ gender });
        } catch (e) {
            reportError(new Error('Failed to update gender:', e), { scope: 'settings', action: 'replace_console' });
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.largeTitle}>Settings</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Active Profiles</Text>
                    <CurrentUserCard
                        currentUser={currentUser}
                        isAdmin={isAdmin}
                        currentEventRole={currentEventRole}
                        onSwitch={userManagement.handleLogout}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Admin Tools</Text>
                    <AddUserSection
                        newUserName={userManagement.newUserName}
                        setNewUserName={userManagement.setNewUserName}
                        isNewUserAdmin={userManagement.isNewUserAdmin}
                        setIsNewUserAdmin={userManagement.setIsNewUserAdmin}
                        loading={userManagement.loading}
                        onAddUser={userManagement.handleAddUser}
                        onStartEvent={() => eventManagement.setShowEventModal(true)}
                        onResetEvent={eventManagement.handleResetEventData}
                        canManageEvent={eventPermissions.canManageEvent}
                        isAdmin={isAdmin}
                        hasCurrentUser={!!currentUser}
                    />
                </View>

                {activeEvent && eventPermissions.canManageMembers && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Event Administration</Text>
                        <EventAdminSection
                            eventName={activeEvent.name}
                            eventMembers={eventMembers}
                            availableUsers={eventManagement.availableUsersForEvent}
                            onRoleChange={eventManagement.handleEventRoleChange}
                            onRemoveMember={eventManagement.handleRemoveEventMember}
                            onAddMember={eventManagement.handleAddEventMember}
                        />
                    </View>
                )}

                <View style={styles.section}>
                    <PremiumTierCard
                        subscriptionTier={currentUser?.subscription_tier}
                        lifetimePass={currentUser?.lifetime_pass}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Lifetime Pass</Text>
                    <LifetimePassSection
                        isAdmin={isAdmin}
                        currentUser={currentUser}
                        users={users}
                        codes={lifetimePasses.codes}
                        loading={lifetimePasses.loading}
                        generating={lifetimePasses.generating}
                        redeeming={lifetimePasses.redeeming}
                        redeemCode={lifetimePasses.redeemCode}
                        setRedeemCode={lifetimePasses.setRedeemCode}
                        onGenerateCode={lifetimePasses.handleGenerateCode}
                        onRedeemCode={lifetimePasses.handleRedeemCode}
                        onRefresh={lifetimePasses.refreshCodes}
                    />
                </View>

                {currentUser && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Physiology (Soberness Estimator)</Text>
                        <PhysiologySection
                            currentUser={currentUser}
                            onUpdateWeight={handleUpdateWeight}
                            onUpdateGender={handleUpdateGender}
                        />
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Sensory Experience</Text>
                    <SensorySection
                        isAudioEnabled={animationPreferences.isAudioEnabled()}
                        onToggleAudio={animationPreferences.toggleAudioMuted}
                        pourAnimationEnabled={animationPreferences.pourAnimationEnabled}
                        onTogglePourAnimation={animationPreferences.togglePourAnimation}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Cache & Storage</Text>
                    <CacheManagementSection
                        cacheStats={cacheManagement.cacheStats}
                        onClearCache={cacheManagement.handleClearCache}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Live Updates</Text>
                    <LiveBeerLogSection
                        enabled={liveBeerLogPreference.enabled}
                        onToggle={liveBeerLogPreference.toggle}
                    />
                </View>

                {currentUser && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Notifications</Text>
                        <NotificationsSection
                            notificationPrefs={notificationPrefs}
                            milestones={notificationPreferences.milestones}
                            onToggleLeaderChange={notificationPreferences.toggleLeaderChange}
                            onToggleMilestone={notificationPreferences.toggleMilestone}
                            onToggleAdminBroadcasts={notificationPreferences.toggleAdminBroadcasts}
                        />
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Switch Member</Text>
                    <UserSelectionGrid
                        users={users}
                        currentUserId={currentUser?.id}
                        onSelectUser={userManagement.handleSelectUser}
                        onManageUsers={() => setShowUserModal(true)}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Stängelispass v1.5.0</Text>
                    <Text style={styles.footerSubtext}>Crafted for Beer Lovers 🍻</Text>
                </View>

                <View style={{ height: spacing.xxl }} />
            </ScrollView>

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: spacing.sm,
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        marginBottom: spacing.md,
    },
    largeTitle: {
        ...typography.largeTitle,
    },
    section: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    sectionLabel: {
        ...typography.small,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    footer: {
        alignItems: 'center',
        marginTop: spacing.xxl,
        padding: spacing.xl,
    },
    footerText: {
        ...typography.small,
        color: colors.textMuted,
    },
    footerSubtext: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: 4,
    },
});
