import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/lib/theme';
import { BACStats } from '@/services/safety';

interface SafeRideCardProps {
    stats: BACStats;
}

export const SafeRideCard: React.FC<SafeRideCardProps> = ({ stats }) => {
    const openUber = () => {
        const url = Platform.select({
            ios: 'uber://?action=setPickup&pickup=my_location',
            android: 'uber://?action=setPickup&pickup=my_location',
        });
        if (url) {
            Linking.canOpenURL(url).then(supported => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Linking.openURL('https://m.uber.com');
                }
            });
        }
    };

    const callTaxi = () => {
        Linking.openURL('tel:0800800800'); // Example taxi number
    };

    if (stats.bac === 0) return null;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <MaterialCommunityIcons
                    name={stats.canDrive ? "check-circle" : "alert-circle"}
                    size={24}
                    color={stats.canDrive ? colors.success : colors.error}
                />
                <Text style={styles.title}>Safe Ride Monitor</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{stats.bac}‰</Text>
                    <Text style={styles.statLabel}>Est. BAC</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{stats.clearInHours}h</Text>
                    <Text style={styles.statLabel}>Until 0‰</Text>
                </View>
            </View>

            {!stats.canDrive && (
                <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                        You're over the limit. Please don't drive.
                    </Text>
                </View>
            )}

            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.uberButton]} onPress={openUber}>
                    <MaterialCommunityIcons name="car" size={20} color={colors.textPrimary} />
                    <Text style={styles.buttonText}>Order Uber</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.taxiButton]} onPress={callTaxi}>
                    <MaterialCommunityIcons name="phone" size={20} color={colors.textPrimary} />
                    <Text style={styles.buttonText}>Call Taxi</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.md,
        marginVertical: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        ...typography.headline,
        marginLeft: spacing.xs,
        color: colors.textPrimary,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.md,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        ...typography.subtitle,
        color: colors.primary,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    divider: {
        width: 1,
        height: '80%',
        backgroundColor: colors.surfaceLight,
        alignSelf: 'center',
    },
    warningBox: {
        backgroundColor: colors.error + '20',
        padding: spacing.sm,
        borderRadius: 8,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.error,
    },
    warningText: {
        ...typography.body,
        color: colors.error,
        textAlign: 'center',
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        borderRadius: 12,
        gap: spacing.xs,
    },
    uberButton: {
        backgroundColor: colors.background,
    },
    taxiButton: {
        backgroundColor: colors.primary,
    },
    buttonText: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
    },
});
