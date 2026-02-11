import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface WallOfFameItem {
    id: string;
    total_stängeli: number;
    created_at: string;
    winner: {
        name: string;
    };
    event: {
        name: string;
    };
}

interface WallOfFameProps {
    entries: any[];
}

export function WallOfFame({ entries }: WallOfFameProps) {
    if (entries.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="ribbon-outline" size={64} color={colors.surfaceLight} />
                <Text style={styles.emptyText}>The hall of legends is still waiting...</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <Card style={styles.legendCard}>
                    <View style={styles.medalContainer}>
                        <Ionicons name="medal" size={40} color={colors.primary} />
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.eventName}>{item.event?.name || 'Epic Night'}</Text>
                        <View style={styles.winnerRow}>
                            <Avatar name={item.winner?.name || '?'} size={32} />
                            <Text style={styles.winnerName}>{item.winner?.name}</Text>
                        </View>
                        <Text style={styles.dateText}>
                            {format(new Date(item.created_at), 'MMMM d, yyyy')}
                        </Text>
                    </View>

                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreValue}>{item.total_stängeli}</Text>
                        <Text style={styles.scoreLabel}>BEERS</Text>
                    </View>
                </Card>
            )}
            {...{ contentContainerStyle: styles.listContent }}
        />
    );
}

const styles = StyleSheet.create({
    listContent: {
        padding: spacing.md,
    },
    legendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: colors.surfaceLight,
        borderColor: colors.primary + '30',
        borderWidth: 1,
    },
    medalContainer: {
        marginRight: spacing.md,
    },
    content: {
        flex: 1,
    },
    eventName: {
        ...typography.headline,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    winnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: 4,
    },
    winnerName: {
        ...typography.body,
        fontWeight: '700',
        color: colors.primary,
    },
    dateText: {
        ...typography.caption,
        color: colors.textMuted,
    },
    scoreContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        minWidth: 60,
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.primary,
    },
    scoreLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: colors.textMuted,
        letterSpacing: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
    },
    emptyText: {
        ...typography.subtitle,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.md,
    },
});
