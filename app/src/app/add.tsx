import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, addBeer, createBeerStamp } from '@/services/supabase';
import { useApp } from '@/providers/AppProvider';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SyncIndicator } from '@/components/ui/SyncIndicator';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BADGES } from '@/services/achievements';
import { labels } from '@/ui/labels';
import { PourAnimation } from '@/components/animations/PourAnimation';
import { SimplePourFeedback } from '@/components/animations/SimplePourFeedback';
import { shouldShowAnimations } from '@/utils/deviceInfo';
import { reportError } from '@/utils/logger';
import { AddUserGrid } from '@/components/add/AddUserGrid';
import { AddQrModal } from '@/components/add/AddQrModal';
import { Avatar } from '@/components/ui/Avatar';

export default function AddBeerScreen() {
    const { currentUser, users, activeEvent, eventPermissions, addOfflineMutation } = useApp();
    const { isOnline } = useNetworkStatus();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [stampLoading, setStampLoading] = useState(false);
    const [stampId, setStampId] = useState<string | undefined>(undefined);
    const [qrMode, setQrMode] = useState<'stamp' | 'log'>('stamp');
    const [shareLoading, setShareLoading] = useState(false);
    const qrRef = useRef<any>(null);
    const [showAnimation, setShowAnimation] = useState(false);
    const [useFullAnimation, setUseFullAnimation] = useState(true);
    
    // Check device capability on mount
    useEffect(() => {
        shouldShowAnimations().then(setUseFullAnimation);
    }, []);

    const openQrModal = useCallback(() => setShowQR(true), []);
    const closeQrModal = useCallback(() => {
        setShowQR(false);
        setStampId(undefined);
    }, []);

    const validateShareQr = useCallback(() => {
        if (!selectedUser) return false;
        if (Platform.OS === 'web') {
            Alert.alert('Unavailable', 'Sharing QR codes is not supported on web.');
            return false;
        }
        if (!qrRef.current || typeof qrRef.current.toDataURL !== 'function') {
            Alert.alert('Unavailable', 'QR code image is not ready yet.');
            return false;
        }
        return true;
    }, [selectedUser]);

    const buildQrImageUri = useCallback(async (userId: string) => {
        const base64 = await new Promise<string>((resolve) => {
            qrRef.current.toDataURL((data: string) => resolve(data));
        });
        const cacheDirectory = (FileSystem as any).cacheDirectory;
        if (!cacheDirectory) {
            Alert.alert('Unavailable', 'File system is not available on this device.');
            return null;
        }
        const fileUri = `${cacheDirectory}qr-${userId}-${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });
        return fileUri;
    }, []);

    const handleShareQr = useCallback(async () => {
        if (!validateShareQr() || !selectedUser) return;
        setShareLoading(true);
        try {
            const fileUri = await buildQrImageUri(selectedUser.id);
            if (!fileUri) return;
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Unavailable', 'Sharing is not available on this device.');
            }
        } catch (e) {
            reportError(new Error('Failed to share QR:', e), { scope: 'add', action: 'replace_console' });
            Alert.alert('Error', 'Could not share QR code.');
        } finally {
            setShareLoading(false);
        }
    }, [buildQrImageUri, selectedUser, validateShareQr]);

    const handleAddBeer = useCallback(async () => {
        if (!selectedUser || !currentUser) return;

        if (!activeEvent) {
            Alert.alert('No Active Round', 'Please start a round from the Home screen before logging beers. ');
            return;
        }

        // Allow regular users to add beers for themselves, but only admins can add for others
        if (!eventPermissions.canManageLogs && selectedUser.id !== currentUser.id) {
            Alert.alert('Not Authorized', 'Only admins can add beers for other users.');
            return;
        }

        const mutationPayload = {
            userId: selectedUser.id,
            addedBy: currentUser.id,
            eventId: activeEvent.id,
        };

        setLoading(true);

        // Show animation immediately (optimistic)
        setShowAnimation(true);

        try {
            if (!isOnline) {
                await addOfflineMutation({
                    type: 'addBeer',
                    data: mutationPayload,
                });
                Alert.alert('Queued', 'Beer will be logged when you reconnect.');
                setSelectedUser(null);
                return;
            }

            const { beer, newBadges } = await addBeer(
                mutationPayload.userId,
                mutationPayload.addedBy,
                mutationPayload.eventId
            );
            if (!beer) {
                setShowAnimation(false);
                Alert.alert('Unavailable', 'Beer logging is unavailable until the database is ready.');
                return;
            }

            // Animation will handle haptics, no manual haptic needed
            
            // After animation completes, show achievements if any
            if (newBadges.length > 0) {
                const badgeNames = newBadges.map(b => BADGES[b].name).join(', ');
                // Delay alert until after animation
                setTimeout(() => {
                    Alert.alert(
                        '🏆 Achievement Unlocked!',
                        `You earned: ${badgeNames}\n\nAdded a beer for ${selectedUser.name}!`,
                        [{ text: 'Awesome!' }]
                    );
                }, 500);
            }

            setSelectedUser(null);
        } catch (e) {
            setShowAnimation(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => null);
            Alert.alert('Error', 'Failed to add beer. Please try again.');
            reportError(e as Error, { scope: 'add', action: 'replace_console' });
        } finally {
            setLoading(false);
        }
    }, [activeEvent, addOfflineMutation, currentUser, eventPermissions.canManageLogs, isOnline, selectedUser]);

    const handleAnimationComplete = useCallback(() => {
        setShowAnimation(false);
    }, []);

    const handleSelectUser = useCallback((user: User) => {
        Haptics.selectionAsync().catch(() => null);
        setSelectedUser(user);
    }, []);

    const handleStampQr = useCallback(async () => {
        setQrMode('stamp');
        if (!eventPermissions.canIssueStamps) {
            Alert.alert('Not Authorized', 'Only admins can issue stamp QR codes.');
            return;
        }
        if (!activeEvent) {
            Alert.alert('No Active Round', 'Start a round before issuing stamp QR codes.');
            return;
        }
        if (!selectedUser || !currentUser) return;
        setStampLoading(true);
        try {
            const result = await createBeerStamp(selectedUser.id, activeEvent.id, currentUser.id);
            if (result.fallbackLegacy) {
                Alert.alert(
                    'Legacy QR',
                    'Stamp table is not available yet. A legacy QR will be generated (not one-time).'
                );
                setStampId(undefined);
            } else if (!result.stamp) {
                Alert.alert('Unavailable', 'Stamp issuance is unavailable until the database is ready.');
                return;
            } else {
                setStampId(result.stamp.id);
            }
        } catch (e) {
            reportError(new Error('Failed to create stamp:', e), { scope: 'add', action: 'replace_console' });
            Alert.alert('Error', 'Could not create stamp QR.');
            return;
        } finally {
            setStampLoading(false);
        }
        openQrModal();
    }, [activeEvent, currentUser, eventPermissions.canIssueStamps, openQrModal, selectedUser]);

    const handleUserQr = useCallback(() => {
        setQrMode('log');
        if (!activeEvent) {
            Alert.alert('No Active Round', 'Start a round before sharing user QR codes.');
            return;
        }
        if (!selectedUser) return;
        setStampId(undefined);
        openQrModal();
    }, [activeEvent, openQrModal, selectedUser]);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                <Text style={styles.title}>Who's drinking?</Text>
                <SyncIndicator />
                {!isOnline && (
                    <Text style={styles.offlineWarning}>
                        Offline - changes will sync when you reconnect.
                    </Text>
                )}

                <AddUserGrid
                    users={users}
                    selectedUserId={selectedUser?.id}
                    onSelectUser={handleSelectUser}
                />

                {selectedUser && (
                    <Card style={styles.selectedCard}>
                        <View style={styles.cardHeader}>
                            <Avatar name={selectedUser.name} size={60} />
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle}>{selectedUser.name}</Text>
                                <Text style={styles.cardSubtitle}>Ready for a beer? </Text>
                            </View>
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Add 1 Beer!"
                                icon="beer"
                                variant="primary"
                                onPress={handleAddBeer}
                                testID={labels.add.addBeer.testID}
                                accessibilityLabel={labels.add.addBeer.accessibilityLabel}
                                disabled={loading}
                                style={styles.actionButton}
                            />
                            <Button
                                title="Stamp QR (+1)"
                                icon="qr-code"
                                variant="ghost"
                                testID={labels.add.stampQr.testID}
                                accessibilityLabel={labels.add.stampQr.accessibilityLabel}
                                onPress={handleStampQr}
                                disabled={!eventPermissions.canIssueStamps || stampLoading}
                                style={styles.actionButton}
                            />
                            <Button
                                title="User QR (Admin Log)"
                                icon="qr-code"
                                variant="secondary"
                                testID={labels.add.userQr.testID}
                                accessibilityLabel={labels.add.userQr.accessibilityLabel}
                                onPress={handleUserQr}
                                disabled={!activeEvent}
                                style={styles.actionButton}
                            />
                        </View>
                    </Card>
                )}

                <AddQrModal
                    visible={showQR}
                    onClose={closeQrModal}
                    selectedUser={selectedUser}
                    eventId={activeEvent?.id}
                    stampId={stampId}
                    mode={qrMode}
                    onShareQr={handleShareQr}
                    shareLoading={shareLoading}
                    onQrRef={(ref) => {
                        qrRef.current = ref;
                    }}
                />
                
                {/* Pour Animation */}
                {useFullAnimation ? (
                    <PourAnimation
                        visible={showAnimation}
                        onComplete={handleAnimationComplete}
                    />
                ) : (
                    <SimplePourFeedback
                        visible={showAnimation}
                        onComplete={handleAnimationComplete}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        padding: spacing.md,
    },
    title: {
        ...typography.largeTitle,
        marginBottom: spacing.lg,
        marginTop: spacing.sm,
    },
    offlineWarning: {
        ...typography.caption,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    selectedCard: {
        position: 'absolute',
        bottom: spacing.md,
        left: spacing.md,
        right: spacing.md,
        padding: spacing.lg,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    cardInfo: {
        marginLeft: spacing.md,
    },
    cardTitle: {
        ...typography.title,
        color: colors.textPrimary,
    },
    cardSubtitle: {
        ...typography.body,
        color: colors.textMuted,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
    },
});
