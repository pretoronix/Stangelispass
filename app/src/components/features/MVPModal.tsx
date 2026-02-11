import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    Dimensions,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface MVPModalProps {
    visible: boolean;
    onClose: () => void;
    winnerName: string;
    totalBeers: number;
}

export function MVPModal({ visible, onClose, winnerName, totalBeers }: MVPModalProps) {
    const handleShare = async () => {
        Haptics.selectionAsync();
        try {
            await Share.share({
                message: `🍻 Stängelispass MVP: ${winnerName} just crushed ${totalBeers} Stängeli! A new legend is born. #Stångelispass`,
            });
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.card}>
                        <View style={styles.trophyContainer}>
                            <Ionicons name="trophy" size={80} color="#FFD700" />
                        </View>

                        <Text style={styles.label}>BREWMASTER OF THE NIGHT</Text>

                        <View style={styles.avatarWrapper}>
                            <Avatar name={winnerName} size={100} />
                        </View>

                        <Text style={styles.winnerName}>{winnerName}</Text>

                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{totalBeers}</Text>
                                <Text style={styles.statLabel}>STÄNGELI</Text>
                            </View>
                        </View>

                        <Text style={styles.congratsText}>
                            Legends never die. They just get another round. 🍻
                        </Text>
                    </View>

                    <View style={styles.actions}>
                        <Button
                            title="Save to Camera Roll & Close"
                            onPress={handleShare}
                            variant="primary"
                        />
                        <Pressable onPress={onClose} style={styles.closeLink}>
                            <Text style={styles.closeText}>Close without saving</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: 30,
        padding: spacing.xl,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
        overflow: 'hidden',
    },
    trophyContainer: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: spacing.lg,
    },
    avatarWrapper: {
        padding: 4,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: colors.primary,
        marginBottom: spacing.md,
    },
    winnerName: {
        ...typography.largeTitle,
        color: colors.textPrimary,
        fontWeight: '800',
        textAlign: 'center',
    },
    statsRow: {
        marginTop: spacing.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        backgroundColor: colors.primary + '20',
        borderRadius: borderRadius.lg,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 48,
        fontWeight: '900',
        color: colors.primary,
    },
    statLabel: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: 'bold',
    },
    congratsText: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xl,
        fontStyle: 'italic',
    },
    actions: {
        width: '100%',
        marginTop: spacing.xl,
        gap: spacing.md,
    },
    closeLink: {
        alignItems: 'center',
        padding: spacing.sm,
    },
    closeText: {
        ...typography.callout,
        color: colors.textMuted,
    }
});
