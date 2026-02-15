import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { labels } from '@/ui/labels';
import type { User } from '@/services/supabase';

interface SelectedUserCardProps {
    user: User;
    loading: boolean;
    canIssueStamps: boolean;
    hasActiveEvent: boolean;
    onAddBeer: () => void;
    onStampQr: () => void;
    onUserQr: () => void;
}

export function SelectedUserCard({
    user,
    loading,
    canIssueStamps,
    hasActiveEvent,
    onAddBeer,
    onStampQr,
    onUserQr,
}: SelectedUserCardProps) {
    return (
        <Card style={styles.selectedCard}>
            <View style={styles.cardHeader}>
                <Avatar name={user.name} size={60} />
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{user.name}</Text>
                    <Text style={styles.cardSubtitle}>Ready for a beer? </Text>
                </View>
            </View>
            <View style={styles.buttonContainer}>
                <Button
                    title="Add 1 Beer!"
                    icon="beer"
                    variant="primary"
                    onPress={onAddBeer}
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
                    onPress={onStampQr}
                    disabled={!canIssueStamps}
                    style={styles.actionButton}
                />
                <Button
                    title="User QR (Admin Log)"
                    icon="qr-code"
                    variant="secondary"
                    testID={labels.add.userQr.testID}
                    accessibilityLabel={labels.add.userQr.accessibilityLabel}
                    onPress={onUserQr}
                    disabled={!hasActiveEvent}
                    style={styles.actionButton}
                />
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
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
