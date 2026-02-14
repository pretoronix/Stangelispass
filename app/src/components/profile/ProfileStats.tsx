import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography } from '@/lib/theme';

interface ProfileStatsProps {
    totalBeers: number;
    lastLogDateLabel: string;
}

export function ProfileStats({ totalBeers, lastLogDateLabel }: ProfileStatsProps) {
    return (
        <View style={styles.statsRow}>
            <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Lifetime</Text>
                <Text style={styles.statValue}>{totalBeers}</Text>
                <Text style={styles.statUnit}>Beers</Text>
            </Card>
            <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Last Log</Text>
                <Text style={styles.statValue}>{lastLogDateLabel}</Text>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    statsRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
    },
    statLabel: {
        ...typography.caption,
        color: colors.textMuted,
        textTransform: 'uppercase',
    },
    statValue: {
        ...typography.subtitle,
        color: colors.textPrimary,
        marginVertical: 4,
    },
    statUnit: {
        ...typography.caption,
        color: colors.textSecondary,
    },
});
