import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, Beer, getBeers, removeBeer } from '@/services/supabase';
import { useApp } from '@/providers/AppProvider';
import * as Haptics from 'expo-haptics';
import { BeerLogItemWithComments } from '@/components/features/BeerLogItemWithComments';
import { reportError } from '@/utils/logger';

export default function HistoryScreen() {
    const { activeEvent, eventPermissions, currentUser } = useApp();
    const [beers, setBeers] = useState<Beer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const data = await getBeers(activeEvent?.id);
            setBeers(data ?? []);
        } catch (e) {
            reportError(new Error('Failed to fetch beers:', e), { scope: 'history', action: 'replace_console' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeEvent?.id]);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('beers_history_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'beers' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const handleRemove = async (beerId: string) => {
        if (!eventPermissions.canManageLogs) {
            Alert.alert('Not Authorized', 'Only admins can remove beers.');
            return;
        }

        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
            await removeBeer(beerId);
        } catch (e) {
            Alert.alert('Error', 'Failed to remove beer.');
        }
    };

    const renderItem = ({ item }: { item: Beer }) => {
        return (
            <BeerLogItemWithComments
                beer={item}
                currentUserId={currentUser?.id}
                currentUserIsAdmin={eventPermissions.canManageLogs}
                onDelete={handleRemove}
            />
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                <FlatList
                    data={beers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent as any}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                        />
                    }
                    ListHeaderComponent={
                        <View style={styles.header}>
                            <Text style={styles.largeTitle}>History</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="time-outline" size={64} color={colors.surfaceLight} />
                            <Text style={styles.emptyText}>History is empty.</Text>
                        </View>
                    }
                />
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
    },
    centered: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    largeTitle: {
        ...typography.largeTitle,
    },
    listContent: {
        padding: spacing.md,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xxl,
    },
    emptyText: {
        ...typography.subtitle,
        marginTop: spacing.md,
        color: colors.textMuted,
    },
});
