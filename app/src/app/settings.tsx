import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Alert,
    ScrollView,
    Switch,
    Platform,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import {
    User,
    EventMembership,
    EventRole,
    addUser,
    updateUser,
    resetEventData,
    normalizeNotificationPrefs,
    NotificationPrefs,
    upsertEventMemberRole,
    removeEventMember,
} from '@/services/supabase';
import { registerForPushNotificationsAsync } from '@/services/notifications';
import { useApp } from '@/providers/AppProvider';
import { router } from 'expo-router';
import { labels } from '@/ui/labels';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { audioService } from '@/services/audio';
import { getCacheStats, clearCache, type CacheStats } from '@/utils/cacheManager';

export default function SettingsScreen() {
    const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
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
    const [newUserName, setNewUserName] = useState('');
    const [isNewUserAdmin, setIsNewUserAdmin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [newEventName, setNewEventName] = useState('');
    const [newEventPassType, setNewEventPassType] = useState<'free' | 'standard' | 'weekend'>('standard');
    const notificationPrefs = normalizeNotificationPrefs(currentUser?.notification_prefs);
    const availableUsersForEvent = useMemo(() => {
        if (!activeEvent) return [];
        const currentMemberIds = new Set(eventMembers.map((member) => member.user_id));
        return users.filter((user) => !currentMemberIds.has(user.id));
    }, [activeEvent, eventMembers, users]);

    // Load cache stats on mount
    React.useEffect(() => {
        getCacheStats().then(setCacheStats);
    }, []);

    const handleClearCache = async () => {
        Alert.alert(
            'Clear Cache',
            'This will remove all cached data. The app will reload fresh data from the server.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearCache();
                            const stats = await getCacheStats();
                            setCacheStats(stats);
                            Alert.alert('Success', 'Cache cleared successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear cache');
                        }
                    },
                },
            ]
        );
    };

    const updateNotificationPrefs = async (nextPrefs: NotificationPrefs) => {
        if (!currentUser) return;
        const previousUser = currentUser;
        const nextUser = { ...currentUser, notification_prefs: nextPrefs };
        setCurrentUser(nextUser);
        try {
            await updateUser(currentUser.id, { notification_prefs: nextPrefs } as Partial<User>);
        } catch (e) {
            console.warn('Failed to update notification prefs:', e);
            setCurrentUser(previousUser);
            Alert.alert('Error', 'Could not save notification settings.');
        }
    };

    const handleSelectUser = (user: User) => {
        if (Platform.OS === 'ios') Haptics.selectionAsync().catch(() => null);
        setCurrentUser(user);
        Alert.alert('User Selected', `You are now signed in as ${user.name}`);
        // Try to register device push token for this user (best-effort)
        try {
            registerForPushNotificationsAsync(user.id).catch((e) => console.warn('Push register failed', e));
        } catch (e) {
            console.warn('Push registration error', e);
        }
    };

    const handleAddUser = async () => {
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
            // Auto sign-in the newly created user and register push token
            await setCurrentUser(user);
            try {
                registerForPushNotificationsAsync(user.id).catch((e) => console.warn('Push register failed', e));
            } catch (e) {
                console.warn('Push registration error', e);
            }
            if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
            await refreshUsers();
            setNewUserName('');
            setIsNewUserAdmin(false);
            Alert.alert('Success', `Added ${user.name}!`);
        } catch (e) {
            if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => null);
            Alert.alert('Error', 'Failed to add user');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
        setCurrentUser(null);
    };

    const handleStartEvent = async () => {
        if (!currentUser) {
            Alert.alert('No User', 'Select a user before starting a new event.');
            return;
        }
        if (!eventPermissions.canManageEvent) {
            Alert.alert('Not Authorized', 'Only admins can start new events.');
            return;
        }
        if (!newEventName.trim()) {
            Alert.alert('Error', 'Enter a name for the event.');
            return;
        }
        try {
            await startEvent(newEventName.trim(), newEventPassType);
            setNewEventName('');
            setShowEventModal(false);
            Alert.alert('Event Started', 'A new event is now active.');
        } catch (e) {
            Alert.alert('Error', 'Failed to start event.');
            console.error(e);
        }
    };

    const handleResetEventData = () => {
        if (!isAdmin) {
            Alert.alert('Not Authorized', 'Only admins can reset event data.');
            return;
        }
        Alert.alert(
            'Reset Event Data',
            'This will delete events, beers, achievements, wall of fame, notifications, and device tokens. Users are kept. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const results = await resetEventData();
                            const failed = results.filter(r => !r.ok);
                            if (failed.length > 0) {
                                Alert.alert('Partial Reset', 'Some tables could not be cleared. Check logs.');
                                console.warn('Reset results:', results);
                            } else {
                                Alert.alert('Reset Complete', 'Event data has been cleared.');
                            }
                        } catch (e) {
                            Alert.alert('Error', 'Failed to reset event data.');
                            console.error(e);
                        }
                    },
                },
            ]
        );
    };

    const handleEventRoleChange = async (member: EventMembership, role: EventRole) => {
        if (!activeEvent || !currentUser) return;
        if (member.role === 'owner' && role !== 'owner') {
            Alert.alert('Not Allowed', 'Owner role cannot be changed here.');
            return;
        }
        try {
            await upsertEventMemberRole(activeEvent.id, member.user_id, role, currentUser.id);
            await refreshEventMembers();
        } catch (e) {
            console.error('Failed to update event role:', e);
            Alert.alert('Error', 'Could not update event role.');
        }
    };

    const handleAddEventMember = async (userId: string, role: EventRole) => {
        if (!activeEvent || !currentUser) return;
        try {
            await upsertEventMemberRole(activeEvent.id, userId, role, currentUser.id);
            await refreshEventMembers();
            Alert.alert('Added', `Member added as ${role}.`);
        } catch (e) {
            console.error('Failed to add event member:', e);
            Alert.alert('Error', 'Could not add member to this event.');
        }
    };

    const handleRemoveEventMember = async (member: EventMembership) => {
        if (!activeEvent) return;
        if (member.role === 'owner') {
            Alert.alert('Not Allowed', 'Owner cannot be removed from the event.');
            return;
        }
        Alert.alert(
            'Remove Member',
            `Remove ${member.user?.name || 'this user'} from the event?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeEventMember(activeEvent.id, member.user_id);
                            await refreshEventMembers();
                        } catch (e) {
                            console.error('Failed to remove event member:', e);
                            Alert.alert('Error', 'Could not remove event member.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.largeTitle}>Settings</Text>
                </View>

                {/* Current User Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Active Profiles</Text>
                    {currentUser ? (
                        <Card style={styles.currentUserCard}>
                            <Avatar name={currentUser.name} size={50} />
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{currentUser.name}</Text>
                                {(isAdmin || currentEventRole === 'owner' || currentEventRole === 'admin') && (
                                    <View style={styles.adminBadge}>
                                        <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                                        <Text style={styles.adminText}>
                                            {isAdmin ? 'Admin Access' : `Event ${currentEventRole}`}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Button
                                title="Switch"
                                onPress={handleLogout}
                                variant="ghost"
                                testID={labels.settings.switchUser.testID}
                                accessibilityLabel={labels.settings.switchUser.accessibilityLabel}
                                style={styles.switchButton}
                            />
                        </Card>
                    ) : (
                        <Card style={styles.noUserCard}>
                            <Ionicons name="person-circle-outline" size={32} color={colors.textMuted} />
                            <Text style={styles.noUserText}>No user selected. Pick one below!</Text>
                        </Card>
                    )}
                </View>

                {/* Add User Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Admin Tools</Text>
                    <Card>
                        <TextInput
                            style={styles.input}
                            placeholder="New member name..."
                            placeholderTextColor={colors.textMuted}
                            value={newUserName}
                            onChangeText={setNewUserName}
                        />
                        <View style={styles.adminToggle}>
                            <View>
                                <Text style={styles.toggleLabel}>Admin Privileges</Text>
                                <Text style={styles.toggleSublabel}>Can log beers for others</Text>
                            </View>
                            <Switch
                                value={isNewUserAdmin}
                                onValueChange={setIsNewUserAdmin}
                                trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                                thumbColor="#FFFFFF"
                                ios_backgroundColor={colors.surfaceLight}
                            />
                        </View>
                        <Button
                            title={loading ? 'Creating...' : 'Add Member'}
                            onPress={handleAddUser}
                            icon="person-add"
                            testID={labels.settings.addUser.testID}
                            accessibilityLabel={labels.settings.addUser.accessibilityLabel}
                            disabled={loading}
                        />
                        <View style={styles.adminActions}>
                            <Button
                                title="Start New Event"
                                variant="secondary"
                                onPress={() => setShowEventModal(true)}
                                testID={labels.settings.startEvent.testID}
                                accessibilityLabel={labels.settings.startEvent.accessibilityLabel}
                                disabled={!currentUser || !eventPermissions.canManageEvent}
                                style={styles.adminActionButton}
                            />
                            <Button
                                title="Reset Event Data"
                                variant="danger"
                                onPress={handleResetEventData}
                                testID={labels.settings.resetEvent.testID}
                                accessibilityLabel={labels.settings.resetEvent.accessibilityLabel}
                                disabled={!isAdmin}
                                style={styles.adminActionButton}
                            />
                        </View>
                    </Card>
                </View>

                {activeEvent && eventPermissions.canManageMembers && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Event Administration</Text>
                        <Card>
                            <Text style={styles.eventAdminTitle}>{activeEvent.name}</Text>
                            {eventMembers.length === 0 && (
                                <Text style={styles.bioDisclaimer}>No members found for this event yet.</Text>
                            )}
                            {eventMembers.map((member) => (
                                <View key={member.id} style={styles.eventMemberRow}>
                                    <View style={styles.eventMemberInfo}>
                                        <Text style={styles.eventMemberName}>
                                            {member.user?.name || member.user_id.slice(0, 8)}
                                        </Text>
                                        <Text style={styles.eventMemberRole}>{member.role}</Text>
                                    </View>
                                    <View style={styles.eventRoleActions}>
                                        {member.role !== 'owner' && (
                                            <>
                                                <Pressable
                                                    onPress={() => handleEventRoleChange(member, 'admin')}
                                                    style={styles.roleActionButton}
                                                >
                                                    <Text style={styles.roleActionText}>Admin</Text>
                                                </Pressable>
                                                <Pressable
                                                    onPress={() => handleEventRoleChange(member, 'member')}
                                                    style={styles.roleActionButton}
                                                >
                                                    <Text style={styles.roleActionText}>Member</Text>
                                                </Pressable>
                                                <Pressable
                                                    onPress={() => handleRemoveEventMember(member)}
                                                    style={[styles.roleActionButton, styles.roleActionDanger]}
                                                >
                                                    <Text style={styles.roleActionText}>Remove</Text>
                                                </Pressable>
                                            </>
                                        )}
                                    </View>
                                </View>
                            ))}
                            <View style={styles.eventMemberDivider} />
                            <Text style={styles.eventAdminSubtitle}>Add Existing User</Text>
                            {availableUsersForEvent.length === 0 && (
                                <Text style={styles.bioDisclaimer}>All users are already part of this event.</Text>
                            )}
                            {availableUsersForEvent.map((user) => (
                                <View key={`available-${user.id}`} style={styles.eventMemberRow}>
                                    <View style={styles.eventMemberInfo}>
                                        <Text style={styles.eventMemberName}>{user.name}</Text>
                                        <Text style={styles.eventMemberRole}>not in event</Text>
                                    </View>
                                    <View style={styles.eventRoleActions}>
                                        <Pressable
                                            onPress={() => handleAddEventMember(user.id, 'member')}
                                            style={styles.roleActionButton}
                                        >
                                            <Text style={styles.roleActionText}>Add</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => handleAddEventMember(user.id, 'admin')}
                                            style={styles.roleActionButton}
                                        >
                                            <Text style={styles.roleActionText}>Admin</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ))}
                        </Card>
                    </View>
                )}

                {/* Premium Section */}
                <View style={styles.section}>
                    <Card style={styles.premiumCard}>
                        <View style={styles.premiumHeader}>
                            <View>
                                <Text style={styles.premiumLabel}>Current Tier</Text>
                                <Text style={styles.premiumTitle}>
                                    {currentUser?.subscription_tier === 'craft' ? 'Craft (Premium)' : 'Pilsner (Free)'}
                                </Text>
                            </View>
                            <Ionicons
                                name={currentUser?.subscription_tier === 'craft' ? "star" : "beer-outline"}
                                size={32}
                                color={colors.primary}
                            />
                        </View>

                        {currentUser?.subscription_tier !== 'craft' && (
                            <Button
                                title="Upgrade to Craft"
                                onPress={() => Alert.alert('Premium Access', 'This will soon redirect you to Stripe/Apple Pay to unlock unlimited squads and personal heatmaps! 🍻')}
                                style={styles.upgradeButton}
                            />
                        )}
                    </Card>
                </View>

                {/* Bio Data Section (for BAC) */}
                {currentUser && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Physiology (Soberness Estimator)</Text>
                        <Card>
                            <View style={styles.bioRow}>
                                <Text style={styles.bioLabel}>Weight (kg)</Text>
                                <TextInput
                                    style={styles.bioInput}
                                    keyboardType="numeric"
                                    value={currentUser.weight_kg?.toString() || '80'}
                                    onChangeText={(val) => {
                                        const weight = parseFloat(val);
                                        if (!isNaN(weight)) {
                                            updateUser(currentUser.id, { weight_kg: weight }).catch((e) =>
                                                console.warn('Failed to update weight:', e)
                                            );
                                            setCurrentUser({ ...currentUser, weight_kg: weight });
                                        }
                                    }}
                                />
                            </View>
                            <View style={styles.bioRow}>
                                <Text style={styles.bioLabel}>Gender</Text>
                                <View style={styles.genderContainer}>
                                    {(['male', 'female', 'neutral'] as const).map((g) => (
                                        <Pressable
                                            key={g}
                                            onPress={() => {
                                                updateUser(currentUser.id, { gender: g }).catch((e) =>
                                                    console.warn('Failed to update gender:', e)
                                                );
                                                setCurrentUser({ ...currentUser, gender: g });
                                                if (Platform.OS === 'ios') Haptics.selectionAsync().catch(() => null);
                                            }}
                                            style={[
                                                styles.genderButton,
                                                currentUser.gender === g && styles.genderButtonActive
                                            ]}
                                        >
                                            <Text style={[
                                                styles.genderButtonText,
                                                currentUser.gender === g && styles.genderButtonTextActive
                                            ]}>
                                                {g.charAt(0).toUpperCase() + g.slice(1)}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                            <Text style={styles.bioDisclaimer}>
                                Stats are used strictly for the "for fun" BAC estimator.
                            </Text>
                        </Card>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Sensory Experience</Text>
                    <Card>
                        <View style={styles.bioRow}>
                            <Text style={styles.bioLabel}>Play "Psst!" Sound</Text>
                            <Switch
                                value={!audioService.getMuted()}
                                onValueChange={(val) => {
                                    audioService.setMuted(!val);
                                    if (val) audioService.playPsst();
                                }}
                                trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                            />
                        </View>
                        <Text style={styles.bioDisclaimer}>
                            Plays a crisp bottle opening sound when a beer is logged.
                        </Text>
                    </Card>
                </View>

                {/* Cache Management Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Cache & Storage</Text>
                    <Card>
                        {cacheStats && (
                            <>
                                <View style={styles.bioRow}>
                                    <Text style={styles.bioLabel}>Cache Size</Text>
                                    <Text style={styles.bioValue}>
                                        {cacheStats.sizeKB.toFixed(2)} KB
                                    </Text>
                                </View>
                                <View style={styles.bioRow}>
                                    <Text style={styles.bioLabel}>Cached Queries</Text>
                                    <Text style={styles.bioValue}>
                                        {cacheStats.queriesCount}
                                    </Text>
                                </View>
                            </>
                        )}
                        <Button
                            title="Clear Cache"
                            variant="secondary"
                            onPress={handleClearCache}
                            icon="trash-outline"
                            style={styles.clearCacheButton}
                        />
                        <Text style={styles.bioDisclaimer}>
                            Cached data enables offline viewing and instant app startup.
                        </Text>
                    </Card>
                </View>

                {currentUser && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Notifications</Text>
                        <Card>
                            <View style={styles.bioRow}>
                                <Text style={styles.bioLabel}>Lead Change Alerts</Text>
                                <Switch
                                    value={notificationPrefs.leader_change}
                                    onValueChange={(value) => {
                                        updateNotificationPrefs({
                                            ...notificationPrefs,
                                            leader_change: value,
                                        });
                                    }}
                                    trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                                />
                            </View>

                            {[5, 10, 20].map((milestone) => {
                                const enabled = notificationPrefs.milestones.includes(milestone);
                                return (
                                    <View style={styles.bioRow} key={`milestone-${milestone}`}>
                                        <Text style={styles.bioLabel}>{milestone} Beers Milestone</Text>
                                        <Switch
                                            value={enabled}
                                            onValueChange={(value) => {
                                                const nextMilestones = value
                                                    ? [...notificationPrefs.milestones, milestone]
                                                    : notificationPrefs.milestones.filter((m) => m !== milestone);
                                                updateNotificationPrefs({
                                                    ...notificationPrefs,
                                                    milestones: [...new Set(nextMilestones)].sort((a, b) => a - b),
                                                });
                                            }}
                                            trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                                        />
                                    </View>
                                );
                            })}

                            <Text style={styles.bioDisclaimer}>
                                Choose when you want push alerts for lead changes and beer milestones.
                            </Text>
                        </Card>
                    </View>
                )}

                {/* Select User Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Switch Member</Text>
                    <View style={styles.userGrid}>
                        <SettingItem
                            icon="trophy"
                            label="Trophy Case (Profile)"
                            onPress={() => router.push('/profile')}
                            showChevron
                        />

                        <SettingItem
                            icon="people"
                            label="Manage Users"
                            onPress={() => setShowUserModal(true)}
                        />
                        {users.map((user) => (
                            <Pressable
                                key={user.id}
                                onPress={() => handleSelectUser(user)}
                                style={styles.userSelectWrapper}
                            >
                                <Card style={[
                                    styles.userSelectCard,
                                    currentUser?.id === user.id && styles.selectedCard,
                                ]}>
                                    <Avatar name={user.name} size={40} />
                                    <View style={styles.userSelectInfo}>
                                        <Text style={styles.userSelectName} numberOfLines={1}>{user.name}</Text>
                                        {user.is_admin && (
                                            <Text style={styles.adminSmallText}>Admin</Text>
                                        )}
                                    </View>
                                    {currentUser?.id === user.id && (
                                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                    )}
                                </Card>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Stängelispass v1.5.0</Text>
                    <Text style={styles.footerSubtext}>Crafted for Beer Lovers 🍻</Text>
                </View>

                <View style={{ height: spacing.xxl }} />
            </ScrollView>

            <Modal
                visible={showEventModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowEventModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Start New Event</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Event name..."
                            placeholderTextColor={colors.textMuted}
                            value={newEventName}
                            onChangeText={setNewEventName}
                        />
                        <View style={styles.passTypeRow}>
                            {(['free', 'standard', 'weekend'] as const).map((type) => (
                                <Pressable
                                    key={type}
                                    onPress={() => setNewEventPassType(type)}
                                    style={[
                                        styles.passTypeButton,
                                        newEventPassType === type && styles.passTypeButtonActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.passTypeText,
                                            newEventPassType === type && styles.passTypeTextActive,
                                        ]}
                                    >
                                        {type}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        <View style={styles.modalActions}>
                            <Button
                                title="Cancel"
                                variant="ghost"
                                onPress={() => setShowEventModal(false)}
                                style={styles.modalButton}
                            />
                            <Button
                                title="Start"
                                onPress={handleStartEvent}
                                style={styles.modalButton}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const SettingItem = ({ icon, label, onPress, showChevron }: { icon: any, label: string, onPress: () => void, showChevron?: boolean }) => (
    <Pressable onPress={onPress} style={styles.settingItem}>
        <View style={styles.settingLeft}>
            <Ionicons name={icon} size={22} color={colors.primary} style={styles.settingIcon} />
            <Text style={styles.settingLabel}>{label}</Text>
        </View>
        {showChevron && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
    </Pressable>
);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // ... existing styles ...
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingIcon: {
        marginRight: spacing.md,
    },
    settingLabel: {
        ...typography.body,
        fontWeight: '600',
    },
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
    currentUserCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    userInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    userName: {
        ...typography.headline,
    },
    adminBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    adminText: {
        ...typography.small,
        color: colors.primary,
        fontWeight: 'bold',
    },
    switchButton: {
        height: 32,
        paddingHorizontal: spacing.md,
    },
    noUserCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: colors.textMuted,
        backgroundColor: 'transparent',
    },
    noUserText: {
        ...typography.callout,
        color: colors.textMuted,
    },
    input: {
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.textPrimary,
        fontSize: 17,
        marginBottom: spacing.md,
    },
    adminToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.xs,
    },
    adminActions: {
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    adminActionButton: {
        height: 44,
    },
    eventAdminTitle: {
        ...typography.headline,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    eventAdminSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    eventMemberDivider: {
        height: 1,
        backgroundColor: colors.surfaceLight,
        marginVertical: spacing.md,
    },
    eventMemberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceLight,
        gap: spacing.sm,
    },
    eventMemberInfo: {
        flex: 1,
        gap: 2,
    },
    eventMemberName: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    eventMemberRole: {
        ...typography.caption,
        color: colors.textMuted,
        textTransform: 'uppercase',
    },
    eventRoleActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    roleActionButton: {
        paddingVertical: 6,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.surfaceLight,
        backgroundColor: colors.surface,
    },
    roleActionDanger: {
        borderColor: colors.error,
    },
    roleActionText: {
        ...typography.caption,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    toggleLabel: {
        ...typography.headline,
    },
    toggleSublabel: {
        ...typography.caption,
        color: colors.textMuted,
    },
    userGrid: {
        gap: spacing.sm,
    },
    userSelectWrapper: {
        width: '100%',
    },
    userSelectCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
    },
    selectedCard: {
        borderColor: colors.primary,
        borderWidth: 1.5,
    },
    userSelectInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    userSelectName: {
        ...typography.headline,
    },
    adminSmallText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '600',
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
    premiumCard: {
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.primary + '40', // 25% opacity
    },
    premiumHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    premiumLabel: {
        ...typography.caption,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    premiumTitle: {
        ...typography.subtitle,
        color: colors.primary,
        fontWeight: 'bold',
        marginTop: 2,
    },
    upgradeButton: {
        height: 44,
    },
    bioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceLight,
    },
    bioLabel: {
        ...typography.body,
        fontWeight: '600',
    },
    bioInput: {
        ...typography.body,
        color: colors.primary,
        fontWeight: 'bold',
        textAlign: 'right',
        width: 100,
    },
    bioValue: {
        ...typography.body,
        color: colors.primary,
        fontWeight: 'bold',
    },
    clearCacheButton: {
        marginTop: spacing.md,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    genderButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surfaceLight,
    },
    genderButtonActive: {
        backgroundColor: colors.primary,
    },
    genderButtonText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    genderButtonTextActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.surfaceLight,
    },
    modalTitle: {
        ...typography.title,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    passTypeRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    passTypeButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceLight,
        alignItems: 'center',
    },
    passTypeButtonActive: {
        backgroundColor: colors.primary,
    },
    passTypeText: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    passTypeTextActive: {
        color: colors.background,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
    },
    modalButton: {
        height: 40,
        paddingHorizontal: spacing.md,
    },
    bioDisclaimer: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: spacing.sm,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
