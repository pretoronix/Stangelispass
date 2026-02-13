import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography } from '@/lib/theme';
import { formatCost } from '@/utils/costCalculator';
import { labels } from '@/ui/labels';

interface CostSummaryCardProps {
    beerCount: number;
    pricePerBeer: number;
    eventName?: string;
}

export function CostSummaryCard({ beerCount, pricePerBeer, eventName }: CostSummaryCardProps) {
    const totalCost = beerCount * pricePerBeer;

    return (
        <Card
            style={styles.container}
            testID={labels.profile.costSummary.testID}
            accessibilityLabel={labels.profile.costSummary.accessibilityLabel}
        >
            <View style={styles.header}>
                <Text style={styles.title}>💰 Round Cost</Text>
                {eventName && <Text style={styles.eventName}>{eventName}</Text>}
            </View>

            <View style={styles.mainStat}>
                <Text
                    style={styles.totalCost}
                    testID={labels.profile.totalCost.testID}
                    accessibilityLabel={labels.profile.totalCost.accessibilityLabel}
                >
                    {formatCost(totalCost)}
                </Text>
                <Text style={styles.totalLabel}>Your Total</Text>
            </View>

            <View style={styles.breakdown}>
                <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Beers</Text>
                    <Text
                        style={styles.breakdownValue}
                        testID={labels.profile.beerCount.testID}
                        accessibilityLabel={labels.profile.beerCount.accessibilityLabel}
                    >
                        {beerCount}
                    </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Price</Text>
                    <Text
                        style={styles.breakdownValue}
                        testID={labels.profile.pricePerBeer.testID}
                        accessibilityLabel={labels.profile.pricePerBeer.accessibilityLabel}
                    >
                        {formatCost(pricePerBeer)}
                    </Text>
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.md,
    },
    header: {
        marginBottom: spacing.md,
    },
    title: {
        ...typography.headline,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    eventName: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    mainStat: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.surfaceLight,
    },
    totalCost: {
        ...typography.largeTitle,
        color: colors.primary,
        fontSize: 36,
        fontWeight: '700',
    },
    totalLabel: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: 4,
    },
    breakdown: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: spacing.md,
    },
    breakdownItem: {
        alignItems: 'center',
        flex: 1,
    },
    breakdownLabel: {
        ...typography.caption,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    breakdownValue: {
        ...typography.subtitle,
        color: colors.textPrimary,
        marginTop: 4,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        backgroundColor: colors.surfaceLight,
        marginHorizontal: spacing.sm,
    },
});
