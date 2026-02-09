import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Alert,
    Pressable,
    Modal,
    Platform,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, addBeer, createBeerStamp } from '@/services/supabase';
import { useApp } from '@/providers/AppProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { QRGenerator } from '@/components/features/QRGenerator';
import { BADGES } from '@/services/achievements';
import { labels } from '@/ui/labels';

export default function AddBeerScreen() {
    const { currentUser, users, activeEvent, eventPermissions } = useApp();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [stampLoading, setStampLoading] = useState(false);
    const [stampId, setStampId] = useState<string | undefined>(undefined);
    const [qrMode, setQrMode] = useState<'stamp' | 'log'>('stamp');
    const [shareLoading, setShareLoading] = useState(false);
    const qrRef = useRef<any>(null);

    const handleShareQr = async () => {
        if (!selectedUser) return;
        if (Platform.OS === 'web') {
            Alert.alert('Unavailable', 'Sharing QR codes is not supported on web.');
            return;
        }
        if (!qrRef.current || typeof qrRef.current.toDataURL !== 'function') {
            Alert.alert('Unavailable', 'QR code image is not ready yet.');
            return;
        }

        setShareLoading(true);
        try {
            const base64 = await new Promise<string>((resolve) => {
                qrRef.current.toDataURL((data: string) => resolve(data));
            });
            const cacheDirectory = (FileSystem as any).cacheDirectory;
            if (!cacheDirectory) {
                Alert.alert('Unavailable', 'File system is not available on this device.');
                return;
            }
            const fileUri = `${cacheDirectory}qr-${selectedUser.id}-${Date.now()}.png`;
            await FileSystem.writeAsStringAsync(fileUri, base64, {
                encoding: 'base64',
            });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Unavailable', 'Sharing is not available on this device.');
            }
        } catch (e) {
            console.error('Failed to share QR:', e);
            Alert.alert('Error', 'Could not share QR code.');
        } finally {
            setShareLoading(false);
        }
    };

    const handleAddBeer = async () => {
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

        setLoading(true);
        try {
            const { beer, newBadges } = await addBeer(selectedUser.id, currentUser.id, activeEvent.id);
            if (!beer) {
                Alert.alert('Unavailable', 'Beer logging is unavailable until the database is ready.');
                return;
            }

            // Heavy haptic impact for viscerel logging feel
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null);

            if (newBadges.length > 0) {
                const badgeNames = newBadges.map(b => BADGES[b].name).join(', ');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
                Alert.alert(
                    '🏆 Achievement Unlocked!',
                    `You earned: ${badgeNames}\n\nAdded a beer for ${selectedUser.name}!`,
                    [{ text: 'Awesome!' }]
                );
            } else {
                Alert.alert(' Prost!', `Added a beer for ${selectedUser.name}!`);
            }

            setSelectedUser(null);
        } catch (e) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => null);
            Alert.alert('Error', 'Failed to add beer. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                <Text style={styles.title}>Who's drinking?</Text>

                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Pressable
                            style={[
                                styles.userCard,
                                selectedUser?.id === item.id && styles.selectedUserCard,
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync().catch(() => null);
                                setSelectedUser(item);
                            }}
                        >
                            <Avatar name={item.name} size={50} />
                            <Text style={[
                                styles.userName,
                                selectedUser?.id === item.id && styles.selectedText
                            ]}>
                                {item.name}
                            </Text>
                        </Pressable>
                    )}
                    {...{ contentContainerStyle: styles.listContent }}
                    numColumns={2}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No users found. Add some in Settings!</Text>
                    }
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
                                onPress={async () => {
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
                                        console.error('Failed to create stamp:', e);
                                        Alert.alert('Error', 'Could not create stamp QR.');
                                        return;
                                    } finally {
                                        setStampLoading(false);
                                    }
                                    setShowQR(true);
                                }}
                                disabled={!eventPermissions.canIssueStamps || stampLoading}
                                style={styles.actionButton}
                            />
                            <Button
                                title="User QR (Admin Log)"
                                icon="qr-code"
                                variant="secondary"
                                testID={labels.add.userQr.testID}
                                accessibilityLabel={labels.add.userQr.accessibilityLabel}
                                onPress={() => {
                                    setQrMode('log');
                                    if (!activeEvent) {
                                        Alert.alert('No Active Round', 'Start a round before sharing user QR codes.');
                                        return;
                                    }
                                    if (!selectedUser) return;
                                    setStampId(undefined);
                                    setShowQR(true);
                                }}
                                disabled={!activeEvent}
                                style={styles.actionButton}
                            />
                        </View>
                    </Card>
                )}

                <Modal
                    visible={showQR}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowQR(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            {selectedUser && (
                                <QRGenerator
                                    userId={selectedUser.id}
                                    userName={selectedUser.name}
                                    eventId={activeEvent?.id}
                                    stampId={stampId}
                                    mode={qrMode}
                                    onQrRef={(ref) => {
                                        qrRef.current = ref;
                                    }}
                                />
                            )}
                            <Button
                                title="Share QR"
                                icon="share-social"
                                variant="secondary"
                                testID={labels.add.shareQr.testID}
                                accessibilityLabel={labels.add.shareQr.accessibilityLabel}
                                onPress={handleShareQr}
                                disabled={shareLoading}
                                style={styles.modalActionButton}
                            />
                            <Button
                                title="Close"
                                variant="ghost"
                                onPress={() => {
                                    setShowQR(false);
                                    setStampId(undefined);
                                }}
                                style={styles.modalCloseButton}
                            />
                        </View>
                    </View>
                </Modal>
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
    listContent: {
        paddingBottom: spacing.xxl,
    },
    userCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        margin: spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedUserCard: {
        borderColor: colors.primary,
        backgroundColor: colors.surfaceLight,
    },
    userName: {
        ...typography.headline,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    selectedText: {
        color: colors.primary,
    },
    emptyText: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xl,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        alignItems: 'center',
    },
    modalActionButton: {
        marginTop: spacing.lg,
        width: '100%',
    },
    modalCloseButton: {
        marginTop: spacing.xl,
        width: '100%',
    },
});
