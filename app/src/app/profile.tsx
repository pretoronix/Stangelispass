import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';
import { getBeersByUser, getUserAchievements, Achievement } from '@/services/supabase';
import { calculateBAC, formatBAC, getBACEffect } from '@/utils/bacCalculator';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BadgeIcon } from '@/components/features/BadgeIcon';
import { CostSummaryCard } from '@/components/features/CostSummaryCard';

export default function ProfileScreen() {
    const { currentUser, activeEvent } = useApp();
    const [beers, setBeers] = useState<any[]>([]);
    const [roundBeers, setRoundBeers] = useState<any[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        try {
            const [userBeers, userAchievements] = await Promise.all([
                getBeersByUser(currentUser.id),
                getUserAchievements(currentUser.id)
            ]);
            setBeers(userBeers);
            
            // Filter beers for current round (activeEvent)
            const currentRoundBeers = activeEvent
                ? userBeers.filter(b => b.event_id === activeEvent.id)
                : [];
            setRoundBeers(currentRoundBeers);
            
            setAchievements(userAchievements);
        } catch (e) {
            console.error('Failed to fetch profile data:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser, activeEvent]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (!currentUser) {
        return (
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={[styles.centered, { backgroundColor: colors.background }]}>
                    <Text style={styles.textMuted}>Please select a user in Settings first.</Text>
                    <Pressable onPress={() => router.push('/settings')} style={styles.btn}>
                        <Text style={styles.btnText}>Go to Settings</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const currentBAC = calculateBAC(
        currentUser.weight_kg || 80,
        currentUser.gender || 'neutral',
        beers.map(b => b.created_at)
    );

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.navBar}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.primary} />
                    </Pressable>
                    <Text style={styles.navTitle}>Trophy Case</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                >
                    {/* Profile Header */}
                    <View style={styles.profileHeader}>
                        <Avatar name={currentUser.name} size={100} />
                        <Text style={styles.profileName}>{currentUser.name}</Text>
                        <Text style={styles.profileTag}>
                            {currentUser.subscription_tier === 'craft' ? '💎 Craft Member' : '🍺 Pilsner Member'}
                        </Text>
                    </View>

                    {/* Cost Summary - Current Round */}
                    {activeEvent && roundBeers.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Current Round Spending</Text>
                            <CostSummaryCard
                                beerCount={roundBeers.length}
                                pricePerBeer={activeEvent.beer_price ?? 5.00}
                                eventName={activeEvent.name}
                            />
                        </View>
                    )}

                    {/* BAC Meter */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Soberness Estimator</Text>
                        <Card style={styles.bacCard}>
                            <View style={styles.bacHeader}>
                                <Text style={styles.bacValue}>{formatBAC(currentBAC)}</Text>
                                <Text style={styles.bacState}>{getBACEffect(currentBAC)}</Text>
                            </View>

                            <View style={styles.meterContainer}>
                                <View style={[styles.meterFill, { width: `${Math.min(100, currentBAC * 500)}%`, backgroundColor: getBACColor(currentBAC) }]} />
                            </View>

                            <View style={styles.bacFooter}>
                                <Text style={styles.bacDisclaimer}>
                                    Estimation based on {beers.length} beers. Strictly for entertainment. Never drive after drinking.
                                </Text>
                            </View>
                        </Card>
                    </View>

                    {/* Achievements */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Unlocked Badges ({achievements.length})</Text>
                        <View style={styles.badgeGrid}>
                            {achievements.length > 0 ? (
                                achievements.map((ach) => (
                                    <View key={ach.id} style={styles.badgeItem}>
                                        <BadgeIcon type={ach.badge_type} size={60} />
                                        <Text style={styles.badgeName}>{ach.badge_type.replace(/_/g, ' ')}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No badges yet. Start drinking! 🍻</Text>
                            )}
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Consumption Stats</Text>
                        <View style={styles.statsRow}>
                            <Card style={styles.statCard}>
                                <Text style={styles.statLabel}>Lifetime</Text>
                                <Text style={styles.statValue}>{beers.length}</Text>
                                <Text style={styles.statUnit}>Beers</Text>
                            </Card>
                            <Card style={styles.statCard}>
                                <Text style={styles.statLabel}>Last Log</Text>
                                <Text style={styles.statValue}>
                                    {beers.length > 0 ? new Date(beers[beers.length - 1].created_at).toLocaleDateString() : 'N/A'}
                                </Text>
                            </Card>
                        </View>
                    </View>

                    <View style={{ height: spacing.xxl }} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const getBACColor = (bac: number) => {
    if (bac <= 0.02) return colors.success;
    if (bac <= 0.05) return '#FFCC00'; // Yellow
    if (bac <= 0.08) return '#FF9500'; // Orange
    return colors.error;
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    textMuted: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    btn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    btnText: {
        ...typography.headline,
        color: '#FFFFFF',
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.sm,
        height: 44,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navTitle: {
        ...typography.headline,
        fontSize: 17,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    profileName: {
        ...typography.title,
        marginTop: spacing.sm,
    },
    profileTag: {
        ...typography.headline,
        color: colors.primary,
        fontWeight: '600',
        marginTop: 4,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionLabel: {
        ...typography.small,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.sm,
    },
    bacCard: {
        padding: spacing.md,
        alignItems: 'center',
    },
    bacHeader: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    bacValue: {
        ...typography.largeTitle,
        color: colors.primary,
        fontSize: 40,
    },
    bacState: {
        ...typography.headline,
        color: colors.textPrimary,
    },
    meterContainer: {
        width: '100%',
        height: 12,
        backgroundColor: colors.surfaceLight,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    meterFill: {
        height: '100%',
        borderRadius: 6,
    },
    bacFooter: {
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: colors.surfaceLight,
        paddingTop: spacing.sm,
    },
    bacDisclaimer: {
        ...typography.caption,
        color: colors.textMuted,
        textAlign: 'center',
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    badgeItem: {
        width: '30%',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    badgeName: {
        ...typography.caption,
        textAlign: 'center',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    emptyText: {
        ...typography.body,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
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
