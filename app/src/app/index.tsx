import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Platform,
    Alert,
    Modal,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';
import { useBeers } from '@/hooks/useBeers';
import { LeaderboardItem } from '@/components/features/LeaderboardItem';
import { useApp } from '@/providers/AppProvider';
import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/Button';
import { MVPModal } from '@/components/features/MVPModal';
import { QRScanner } from '@/components/features/QRScanner';
import { calculateVelocity, prepareTrendData } from '@/utils/statsCalculator';
import { VelocityMetricCard } from '@/components/features/VelocityMetricCard';
import { InviteModal } from '@/components/features/InviteModal';
import { BroadcastModal } from '@/components/notifications/BroadcastModal';
import { Confetti } from '@/components/animations/Confetti';
import { labels } from '@/ui/labels';

// Extracted hooks
import { useLeaderboardAnnouncements } from '@/hooks/home/useLeaderboardAnnouncements';
import { useScanHandler } from '@/hooks/home/useScanHandler';
import { useEventActions } from '@/hooks/home/useEventActions';
import { useExportData } from '@/hooks/home/useExportData';

// Extracted components
import { StartRoundPrompt } from '@/components/home/StartRoundPrompt';

// Extracted utilities
import { selectRandomPayer, calculateBill } from '@/utils/home/homeHelpers';

// Extracted styles
import { homeScreenStyles as styles } from '@/styles/screens/homeScreenStyles';

export default function HomeScreen() {
    const { beerCounts, rawBeers, totalBeers, leaderInfo, leaderLead, hotStreak, gameStatsAvailable, loading, refreshing, refresh } = useBeers();
    const { currentUser, setCurrentUser, activeEvent, startEvent, closeEvent, showRecap, setShowRecap, eventPermissions } = useApp();
    
    const [scanning, setScanning] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [showBroadcast, setShowBroadcast] = useState(false);

    // Custom hooks for business logic
    const { leaderAnnouncement, streakAnnouncement, showConfetti, setShowConfetti } = useLeaderboardAnnouncements({
        activeEventId: activeEvent?.id,
        leaderInfo: leaderInfo ?? undefined,
        beerCounts,
        currentUserId: currentUser?.id,
    });

    const eventActions = useEventActions(setCurrentUser, startEvent as any, refresh);
    const { handleExportData } = useExportData();
    const { handleScan } = useScanHandler(
        currentUser,
        activeEvent,
        eventPermissions,
        eventActions.openNamePrompt,
        setScanning,
        refresh
    );

    // Calculate metrics
    const groupVelocity = calculateVelocity(
        rawBeers.map(b => b.created_at),
        activeEvent?.created_at
    );
    const trendData = prepareTrendData(rawBeers.map(b => b.created_at));
    const beerPriceFromEvent = activeEvent?.beer_price ?? 5.00;
    const totalBill = calculateBill(totalBeers, beerPriceFromEvent);
    const winner = leaderInfo ?? beerCounts[0];

    // Event handlers
    const handleWhoPays = () => selectRandomPayer(beerCounts);

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

            {/* QR Scanner Modal */}
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

            {/* Start Round / Join Event Prompt */}
            <StartRoundPrompt
                visible={eventActions.showStartRoundPrompt}
                pendingAction={eventActions.pendingAction}
                startRoundName={eventActions.startRoundName}
                setStartRoundName={eventActions.setStartRoundName}
                beerPrice={eventActions.beerPrice}
                setBeerPrice={eventActions.setBeerPrice}
                pendingJoinEventName={eventActions.pendingJoinEventName}
                promptSubmitting={eventActions.promptSubmitting}
                onSubmit={eventActions.submitNamePrompt}
                onCancel={() => {
                    eventActions.setStartRoundName('');
                    eventActions.setBeerPrice('5.00');
                    eventActions.setShowStartRoundPrompt(false);
                }}
            />

            {/* iOS Style Translucent Header Background */}
            {Platform.OS === 'ios' && (
                <BlurView intensity={80} tint="dark" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as any} />
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
                                            eventActions.openNamePrompt('start_round');
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
                                        onPress={() => handleExportData(activeEvent)}
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
                                    {eventPermissions.canManageEvent && (
                                        <Button
                                            title="Notify All"
                                            testID="home.notify_all"
                                            accessibilityLabel="Broadcast notification to all members"
                                            onPress={() => setShowBroadcast(true)}
                                            icon="megaphone-outline"
                                            variant="ghost"
                                            style={styles.broadcastButton}
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

                        {activeEvent && currentUser && (
                            <BroadcastModal
                                visible={showBroadcast}
                                onClose={() => setShowBroadcast(false)}
                                eventId={activeEvent.id}
                                senderId={currentUser.id}
                                eventName={activeEvent.name}
                            />
                        )}

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

            {/* 🎉 Confetti Animation for leader changes & achievements */}
            <Confetti
                trigger={showConfetti}
                count={150}
                origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
                explosionSpeed={350}
                fallSpeed={2500}
                onAnimationEnd={() => setShowConfetti(false)}
            />
        </SafeAreaView>
    );
}
