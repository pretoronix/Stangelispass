import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Platform,
    Alert,
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { useBeers } from '@/hooks/useBeers';
import { LeaderboardItem } from '@/components/features/LeaderboardItem';
import { useApp } from '@/providers/AppProvider';
import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/Button';
import { MVPModal } from '@/components/features/MVPModal';
import { QRScanner } from '@/components/features/QRScanner';
import { addBeer, getBeers, addUser, redeemBeerStamp, joinEvent } from '@/services/supabase';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BADGES } from '@/services/achievements';
import { calculateVelocity, prepareTrendData } from '@/utils/statsCalculator';
import { VelocityMetricCard } from '@/components/features/VelocityMetricCard';
import { audioService } from '@/services/audio';
import { InviteModal } from '@/components/features/InviteModal';
import { parseScanPayload } from '@/utils/scanPayload';
import { getStreakBonus, isStreakMilestone } from '@/utils/gameStats';
import { labels } from '@/ui/labels';

type PendingAction = 'start_round' | 'join_event';

export default function HomeScreen() {
    const { beerCounts, rawBeers, totalBeers, leaderInfo, leaderLead, hotStreak, gameStatsAvailable, loading, refreshing, refresh } = useBeers();
    const { currentUser, setCurrentUser, activeEvent, startEvent, closeEvent, showRecap, setShowRecap, eventPermissions } = useApp();
    const [scanning, setScanning] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [showStartRoundPrompt, setShowStartRoundPrompt] = useState(false);
    const [startRoundName, setStartRoundName] = useState('');
    const [pendingAction, setPendingAction] = useState<PendingAction>('start_round');
    const [pendingJoinEventName, setPendingJoinEventName] = useState('');
    const [pendingJoinEventId, setPendingJoinEventId] = useState<string | undefined>(undefined);
    const [promptSubmitting, setPromptSubmitting] = useState(false);
    const [leaderAnnouncement, setLeaderAnnouncement] = useState<string | null>(null);
    const [streakAnnouncement, setStreakAnnouncement] = useState<string | null>(null);
    const leaderRef = useRef<string | null>(null);
    const streakRef = useRef<number>(0);

    const groupVelocity = calculateVelocity(
        rawBeers.map(b => b.created_at),
        activeEvent?.created_at
    );

    const trendData = prepareTrendData(rawBeers.map(b => b.created_at));

    useEffect(() => {
        if (!activeEvent?.id || !leaderInfo?.userId) return;
        if (leaderRef.current && leaderRef.current !== leaderInfo.userId) {
            setLeaderAnnouncement(`${leaderInfo.name} took the lead!`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
        }
        leaderRef.current = leaderInfo.userId;
    }, [activeEvent?.id, leaderInfo?.userId, leaderInfo?.name]);

    useEffect(() => {
        if (!leaderAnnouncement) return;
        const timer = setTimeout(() => setLeaderAnnouncement(null), 3000);
        return () => clearTimeout(timer);
    }, [leaderAnnouncement]);

    useEffect(() => {
        if (!currentUser) return;
        const currentStats = beerCounts.find((u) => u.userId === currentUser.id);
        const nextStreak = currentStats?.streakCount || 0;
        if (nextStreak > (streakRef.current || 0) && isStreakMilestone(nextStreak)) {
            const bonus = getStreakBonus(nextStreak);
            setStreakAnnouncement(`Streak x${nextStreak}! +${bonus} pts`);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
        }
        streakRef.current = nextStreak;
    }, [beerCounts, currentUser]);

    useEffect(() => {
        if (!streakAnnouncement) return;
        const timer = setTimeout(() => setStreakAnnouncement(null), 3000);
        return () => clearTimeout(timer);
    }, [streakAnnouncement]);

    const openNamePrompt = (action: PendingAction, joinEventName?: string, joinEventId?: string) => {
        setPendingAction(action);
        setPendingJoinEventName(joinEventName || '');
        setPendingJoinEventId(joinEventId);
        setStartRoundName('');
        setShowStartRoundPrompt(true);
    };

    const submitNamePrompt = async () => {
        const cleanName = startRoundName.trim();
        if (!cleanName || promptSubmitting) return;

        setPromptSubmitting(true);
        try {
            const user = await addUser(cleanName, pendingAction === 'start_round');
            if (!user) {
                Alert.alert('Error', 'Could not create user. Please try again.');
                return;
            }

            await setCurrentUser(user);
            if (pendingAction === 'start_round') {
                if (!user.is_admin) {
                    Alert.alert('Admin Required', 'Only an admin can start a round.');
                    return;
                }
                await startEvent('Night Out', 'standard');
            } else {
                if (pendingJoinEventId) {
                    await joinEvent(pendingJoinEventId, user.id).catch((e) => {
                        console.warn('Failed to join event membership:', e);
                    });
                }
                Alert.alert('Joined!', `You are now part of ${pendingJoinEventName || 'the round'}.`);
            }

            setShowStartRoundPrompt(false);
            setStartRoundName('');
            refresh();
        } catch (e) {
            console.error('Failed to complete action after creating user:', e);
            Alert.alert('Error', 'Failed to complete this action. Please try again.');
        } finally {
            setPromptSubmitting(false);
        }
    };

    const handleScan = async (data: string) => {
        try {
            const payload = parseScanPayload(data);
            if (payload.type === 'unknown') {
                Alert.alert('Invalid QR', 'This code is not recognized by Stangelispass.');
                return;
            }

            if (payload.type === 'join_event') {
                if (currentUser) {
                    if (payload.eventId) {
                        await joinEvent(payload.eventId, currentUser.id).catch((e) => {
                            console.warn('Failed to join event membership:', e);
                        });
                    }
                    Alert.alert('Joined!', `You are now part of ${payload.eventName || 'the round'}.`);
                    setScanning(false);
                    return;
                }

                openNamePrompt('join_event', payload.eventName || 'the round', payload.eventId);
                setScanning(false);
                return;
            }

            if (payload.type === 'stamp_redeem') {
                if (!currentUser) {
                    Alert.alert('Select User', 'Please select a user in Settings before redeeming stamps.');
                    return;
                }
                const redemption = await redeemBeerStamp(payload.stampId, currentUser.id);
                if (!redemption.ok) {
                    const reasonMessage = {
                        invalid_stamp: 'This stamp is invalid.',
                        already_redeemed: 'This stamp has already been redeemed.',
                        expired_stamp: 'This stamp has expired.',
                        stamps_unavailable: 'Stamp feature is not available in the database yet.',
                    } as Record<string, string>;
                    Alert.alert('Stamp', reasonMessage[redemption.reason] || 'Could not redeem stamp.');
                    setScanning(false);
                    return;
                }

                audioService.playPsst();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null);
                if (redemption.newBadges.length > 0) {
                    const badgeNames = redemption.newBadges.map(b => BADGES[b].name).join(', ');
                    Alert.alert('Stamp Redeemed', `+1 beer added.\nNew badges: ${badgeNames}`);
                } else {
                    Alert.alert('Stamp Redeemed', '+1 beer added successfully.');
                }
                setScanning(false);
                refresh();
                return;
            }

            if (!currentUser) {
                Alert.alert('Select User', 'Please select a user in Settings before scanning beer QR codes.');
                return;
            }
            const effectiveEventId = payload.eventId || activeEvent?.id;
            if (!effectiveEventId) {
                Alert.alert('No Active Round', 'This QR code is not linked to an active round.');
                return;
            }
            if (activeEvent?.id && payload.eventId && payload.eventId !== activeEvent.id) {
                Alert.alert('Wrong Round', 'This QR code belongs to a different event.');
                return;
            }
            if (!eventPermissions.canManageLogs && payload.userId !== currentUser.id) {
                Alert.alert('Not Authorized', 'Only admins can log beers for other users.');
                return;
            }

            const { newBadges } = await addBeer(payload.userId, currentUser.id, effectiveEventId);

            // Audio & Haptic feedback
            audioService.playPsst();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null);

            if (newBadges.length > 0) {
                const badgeNames = newBadges.map(b => BADGES[b].name).join(', ');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
                Alert.alert(
                    '🏆 Achievement Unlocked!',
                    `You earned: ${badgeNames}\n\nBeer logged via scan!`,
                    [{ text: 'Woohoo!' }]
                );
            }

            setScanning(false);
            refresh();
        } catch (e) {
            console.error('Failed to add beer via scan:', e);
            Alert.alert('Error', 'Failed to log beer. Please try again.');
        }
    };

    const handleWhoPays = () => {
        if (beerCounts.length === 0) {
            Alert.alert('Who Pays?', 'Nobody has logged any beers yet!');
            return;
        }
        const randomIndex = Math.floor(Math.random() * beerCounts.length);
        const selected = beerCounts[randomIndex];

        if (!selected) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
        Alert.alert(
            '🍻 The Round is On...',
            `${selected.name}! \n\nGet ready to open that wallet.`,
            [{ text: 'Prost!' }]
        );
    };

    const handleExportData = async () => {
        if (!activeEvent) {
            Alert.alert('Export', 'No active round to export.');
            return;
        }
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
            const beers = await getBeers(activeEvent.id);
            const eventBeers = beers.filter(b => b.event_id === activeEvent.id);

            if (eventBeers.length === 0) {
                Alert.alert('Export', 'No beers logged for this event yet.');
                return;
            }

            const header = 'User,Added By,Timestamp\n';
            const rows = eventBeers.map(b =>
                `${b.user?.name || 'Unknown'},${b.added_by_user?.name || 'Unknown'},${b.created_at}`
            ).join('\n');

            const csv = header + rows;
            const filename = `stangelispass_${activeEvent.name.replace(/\s+/g, '_')}.csv`;

            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    return;
                }
                Alert.alert('Export', 'Web export is not available in this environment.');
                return;
            }

            const cacheDirectory = (FileSystem as any).cacheDirectory;
            if (!cacheDirectory) {
                throw new Error('File system cache directory is unavailable');
            }
            const fileUri = `${cacheDirectory}${filename}`;
            await FileSystem.writeAsStringAsync(fileUri, csv);
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Export', 'CSV saved to your device cache.');
            }
        } catch (e) {
            console.error('Export failed:', e);
            Alert.alert('Error', 'Failed to export data.');
        }
    };

    const PRICE_PER_BEER = 5.00;
    const totalBill = totalBeers * PRICE_PER_BEER;

    const winner = leaderInfo || beerCounts[0];

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            {/* MVP Recap Modal */}
            <MVPModal
                visible={showRecap}
                onClose={() => setShowRecap(false)}
                winnerName={winner?.name || 'Unknown'}
                totalBeers={winner?.count || 0}
            />

            <Modal
                visible={scanning}
                animationType="slide"
                onRequestClose={() => setScanning(false)}
            >
                <QRScanner
                    onScan={handleScan}
                    onClose={() => setScanning(false)}
                />
            </Modal>

            <Modal
                visible={showStartRoundPrompt}
                transparent
                animationType="fade"
                onRequestClose={() => setShowStartRoundPrompt(false)}
            >
                <View style={styles.startRoundModal}>
                    <View style={styles.startRoundCard}>
                        <Text style={styles.startRoundTitle}>
                            {pendingAction === 'start_round' ? 'Start Round' : 'Join Group'}
                        </Text>
                        <Text style={styles.startRoundSubtitle}>
                            {pendingAction === 'start_round'
                                ? 'Enter your name to start a round:'
                                : `Enter your name to join ${pendingJoinEventName || 'this round'}:`}
                        </Text>
                        <TextInput
                            value={startRoundName}
                            onChangeText={setStartRoundName}
                            placeholder="Your name"
                            placeholderTextColor={colors.textMuted}
                            style={styles.startRoundInput}
                            autoFocus
                            autoCapitalize="words"
                            returnKeyType="done"
                            onSubmitEditing={submitNamePrompt}
                        />
                        <View style={styles.startRoundActions}>
                            <Button
                                title="Cancel"
                                variant="ghost"
                                onPress={() => {
                                    setStartRoundName('');
                                    setShowStartRoundPrompt(false);
                                }}
                                style={styles.startRoundButton}
                            />
                            <Button
                                title={promptSubmitting ? 'Please wait...' : (pendingAction === 'start_round' ? 'Start' : 'Join')}
                                onPress={submitNamePrompt}
                                disabled={promptSubmitting}
                                style={styles.startRoundButton}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* iOS Style Translucent Header Background */}
            {Platform.OS === 'ios' && (
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill as any} />
            )}

            <FlatList
                data={beerCounts}
                keyExtractor={(item) => item.userId}
                renderItem={({ item, index }) => (
                    <View style={[
                        styles.itemWrapper,
                        currentUser?.id === item.userId && styles.currentUserHighlight
                    ]}>
                        <LeaderboardItem item={item} index={index} isLeader={item.userId === leaderInfo?.userId} />
                    </View>
                )}
                contentContainerStyle={styles.listContent as any}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor={colors.primary}
                        progressViewOffset={Platform.OS === 'ios' ? 0 : 50}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        {!activeEvent ? (
                            <View style={styles.startEventBanner}>
                                <Ionicons name="sparkles" size={24} color={colors.primary} />
                                <Text style={styles.startEventText}>No active round</Text>
                                <Button
                                    title="Start a Round ($0.99)"
                                    testID={labels.home.startRound.testID}
                                    accessibilityLabel={labels.home.startRound.accessibilityLabel}
                                    onPress={async () => {
                                        if (!currentUser) {
                                            openNamePrompt('start_round');
                                            return;
                                        }
                                        if (!eventPermissions.canManageEvent) {
                                            Alert.alert('Admin Required', 'Only admins can start a round and invite others.');
                                            return;
                                        }
                                        try {
                                            await startEvent('Night Out', 'standard');
                                        } catch (_e) {
                                            Alert.alert('Error', 'Failed to start round. Please try again.');
                                        }
                                    }}
                                    style={styles.startButton}
                                />
                                <Text style={styles.trialText}>First round is always free!</Text>
                            </View>
                        ) : (
                            <View style={styles.activeEventBanner}>
                                <View style={styles.eventInfo}>
                                    <Text style={styles.activeEventName}>{activeEvent.name}</Text>
                                    <Text style={styles.activeEventTime}>Active for 24h</Text>
                                </View>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.bannerActions}
                                >
                                    <Button
                                        title="Who Pays?"
                                        testID={labels.home.whoPays.testID}
                                        accessibilityLabel={labels.home.whoPays.accessibilityLabel}
                                        onPress={handleWhoPays}
                                        icon="cash-outline"
                                        variant="ghost"
                                        style={styles.whoPaysButton}
                                    />
                                    <Button
                                        title="Export"
                                        testID={labels.home.export.testID}
                                        accessibilityLabel={labels.home.export.accessibilityLabel}
                                        onPress={handleExportData}
                                        icon="download-outline"
                                        variant="ghost"
                                        style={styles.exportButton}
                                    />
                                    <Button
                                        title="Scan"
                                        testID={labels.home.scan.testID}
                                        accessibilityLabel={labels.home.scan.accessibilityLabel}
                                        onPress={() => setScanning(true)}
                                        icon="qr-code"
                                        style={styles.scanButton}
                                    />
                                    <Button
                                        title="End"
                                        testID={labels.home.endRound.testID}
                                        accessibilityLabel={labels.home.endRound.accessibilityLabel}
                                        onPress={closeEvent}
                                        variant="ghost"
                                        disabled={!eventPermissions.canCloseEvent}
                                        style={styles.endButton}
                                    />
                                    {eventPermissions.canInvite && (
                                        <Button
                                            title="Invite"
                                            testID={labels.home.invite.testID}
                                            accessibilityLabel={labels.home.invite.accessibilityLabel}
                                            onPress={() => setShowInvite(true)}
                                            icon="person-add-outline"
                                            variant="ghost"
                                            style={styles.inviteButton}
                                        />
                                    )}
                                </ScrollView>
                            </View>
                        )}

                        <InviteModal
                            visible={showInvite}
                            onClose={() => setShowInvite(false)}
                            eventId={activeEvent?.id || ''}
                            eventName={activeEvent?.name || ''}
                        />

                        {activeEvent && rawBeers.length > 0 && (
                            <VelocityMetricCard
                                velocity={groupVelocity}
                                trendData={trendData}
                            />
                        )}

                        {gameStatsAvailable && (leaderInfo || hotStreak) && (
                            <View style={styles.gameSummaryRow}>
                                {leaderInfo && (
                                    <View style={styles.gameChip}>
                                        <Ionicons name="trophy" size={14} color={colors.primary} />
                                        <Text style={styles.gameChipText}>
                                            Leader: {leaderInfo.name} (+{leaderLead} pts)
                                        </Text>
                                    </View>
                                )}
                                {hotStreak && (
                                    <View style={styles.gameChip}>
                                        <Ionicons name="flame" size={14} color={colors.primary} />
                                        <Text style={styles.gameChipText}>
                                            Hot Streak: {hotStreak.name} x{hotStreak.streakCount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {(leaderAnnouncement || streakAnnouncement) && (
                            <View style={styles.gameBanner}>
                                <Ionicons name="sparkles" size={16} color={colors.primary} />
                                <Text style={styles.gameBannerText}>
                                    {leaderAnnouncement || streakAnnouncement}
                                </Text>
                            </View>
                        )}

                        <View style={styles.statsContainer}>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Stngeli Total</Text>
                                <Text style={styles.statValue}>{totalBeers}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Total Bill</Text>
                                <Text style={styles.statValue}>{totalBill.toFixed(2)} CHF</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />
                        <Text style={styles.largeTitle}>Leaderboard</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="beer-outline" size={64} color={colors.textMuted} />
                        <Text style={styles.emptyText}>No beers logged yet!</Text>
                        <Text style={styles.emptySubtext}>Time to start tracking? </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.lg,
        marginTop: spacing.md,
    },
    totalLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        fontWeight: '700',
    },
    totalValue: {
        fontSize: 72,
        fontWeight: '800',
        color: colors.primary,
        marginVertical: spacing.xs,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xl,
        width: '100%',
        marginTop: spacing.sm,
    },
    gameSummaryRow: {
        width: '100%',
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    gameChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.surfaceLight,
    },
    gameChipText: {
        ...typography.caption,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    gameBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceLight,
        marginTop: spacing.sm,
    },
    gameBannerText: {
        ...typography.callout,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    statBox: {
        alignItems: 'center',
    },
    statLabel: {
        ...typography.caption,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statValue: {
        ...typography.title,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    whoPaysButton: {
        height: 32,
        paddingHorizontal: spacing.sm,
    },
    exportButton: {
        height: 32,
        paddingHorizontal: spacing.sm,
    },
    divider: {
        height: 1,
        width: '30%',
        backgroundColor: colors.surfaceLight,
        marginVertical: spacing.lg,
        opacity: 0.5,
    },
    largeTitle: {
        ...typography.largeTitle,
        alignSelf: 'flex-start',
        marginBottom: spacing.xs,
    },
    itemWrapper: {
        marginBottom: spacing.sm,
    },
    currentUserHighlight: {
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 14,
        padding: 1,
    },
    startEventBanner: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        width: '100%',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    startEventText: {
        ...typography.headline,
        color: colors.textPrimary,
        marginVertical: spacing.sm,
    },
    startButton: {
        width: '100%',
        height: 50,
    },
    startRoundModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    startRoundCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.surfaceLight,
    },
    startRoundTitle: {
        ...typography.title,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    startRoundSubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    startRoundInput: {
        height: 48,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.surfaceLight,
        paddingHorizontal: spacing.md,
        color: colors.textPrimary,
        backgroundColor: colors.background,
        marginBottom: spacing.md,
    },
    startRoundActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
    },
    startRoundButton: {
        height: 40,
        paddingHorizontal: spacing.md,
    },
    trialText: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: spacing.sm,
    },
    activeEventBanner: {
        backgroundColor: colors.primary + '15',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    eventInfo: {
        flex: 1,
    },
    activeEventName: {
        ...typography.headline,
        color: colors.primary,
    },
    activeEventTime: {
        ...typography.caption,
        color: colors.primary,
        opacity: 0.8,
    },
    bannerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    scanButton: {
        height: 32,
        paddingHorizontal: spacing.sm,
    },
    inviteButton: {
        height: 32,
        paddingHorizontal: spacing.sm,
    },
    endButton: {
        height: 32,
        paddingHorizontal: spacing.sm,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xxl,
    },
    emptyText: {
        ...typography.subtitle,
        marginTop: spacing.md,
        color: colors.textPrimary,
    },
    emptySubtext: {
        ...typography.body,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
});
