import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface VelocityMetricCardProps {
    velocity: number;
    trendData: { value: number, label: string }[];
}

export const VelocityMetricCard = ({ velocity, trendData }: VelocityMetricCardProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.velocityInfo}>
                    <Text style={styles.label}>Velocity (Pace)</Text>
                    <View style={styles.valueRow}>
                        <Text style={styles.value}>{velocity.toFixed(1)}</Text>
                        <Text style={styles.unit}>Beers/hr</Text>
                    </View>
                </View>
                <View style={[styles.indicator, { backgroundColor: getVelocityColor(velocity) }]}>
                    <Ionicons
                        name={velocity > 4 ? "flame" : velocity > 2 ? "speedometer" : "cafe-outline"}
                        size={16}
                        color="#FFF"
                    />
                </View>
            </View>

            {trendData.length > 1 && (
                <View style={styles.chartWrapper}>
                    <LineChart
                        data={trendData}
                        thickness={3}
                        color={colors.primary}
                        hideDataPoints
                        hideAxesAndRules
                        curved
                        width={Dimensions.get('window').width - spacing.xl * 4}
                        height={40}
                        areaChart
                        startFillColor={colors.primary}
                        endFillColor={colors.background}
                        startOpacity={0.4}
                        endOpacity={0.01}
                    />
                </View>
            )}
        </View>
    );
};

const getVelocityColor = (v: number) => {
    if (v > 5) return colors.error;
    if (v > 3) return colors.warning;
    return colors.success;
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        width: '100%',
        marginVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.surfaceLight,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    velocityInfo: {
        flex: 1,
    },
    label: {
        ...typography.caption,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        marginTop: 4,
    },
    value: {
        ...typography.title,
        color: colors.primary,
        fontWeight: '800',
    },
    unit: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    indicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartWrapper: {
        marginTop: spacing.md,
        alignItems: 'center',
    },
});
