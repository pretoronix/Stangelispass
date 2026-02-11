import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Pressable,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, Beer, getBeers, removeBeer } from '@/services/supabase';
import { useApp } from '@/providers/AppProvider';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

export default function HistoryScreen() {
    const { activeEvent, eventPermissions } = useApp();
    const [beers, setBeers] = useState<Beer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const data = await getBeers(activeEvent?.id);
            setBeers(data ?? []);
        } catch (e) {
            console.error('Failed to fetch beers:', e);
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

    const handleRemove = (beer: Beer) => {
        if (!eventPermissions.canManageLogs) {
            Alert.alert('Not Authorized', 'Only admins can remove beers.');
            return;
        }

        Alert.alert(
            'Remove Beer',
            `Remove this beer for ${beer.user?.name || 'Unknown'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
                            await removeBeer(beer.id);
                        } catch (e) {
                            Alert.alert('Error', 'Failed to remove beer.');
                        }
                    },
                },
            ]
        );
    };

    const renderRightActions = (beer: Beer) => {
        if (!eventPermissions.canManageLogs) return null;
        return (
            <Pressable
                style={styles.deleteAction}
                onPress={() => handleRemove(beer)}
            >
                <Ionicons name="trash" size={24} color="#FFFFFF" />
                <Text style={styles.deleteActionText}>Delete</Text>
            </Pressable>
        );
    };

    const renderBeerCard = (item: Beer) => (
        <Card style={styles.beerCard}>
            <Avatar name={item.user?.name || '?'} size={40} />
            <View style={styles.beerInfo}>
                <Text style={styles.beerText}>
                    <Text style={styles.bold}>{item.user?.name || 'Unknown'}</Text> got a beer!
                </Text>
                <Text style={styles.beerTime}>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </Text>
            </View>
            {!eventPermissions.canManageLogs && (
                <Ionicons name="beer" size={18} color={colors.primary} style={{ opacity: 0.3 }} />
            )}
            {eventPermissions.canManageLogs && (
                <Ionicons name="chevron-back" size={16} color={colors.textMuted} style={{ opacity: 0.5 }} />
            )}
        </Card>
    );

    const renderItem = ({ item }: { item: Beer }) => {
        // Swipe actions are not reliable on web, so we keep the list readable and stable there.
        if (Platform.OS === 'web') return renderBeerCard(item);

        return (
            <Swipeable
                renderRightActions={() => renderRightActions(item)}
                onSwipeableWillOpen={() => {
                    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
                }}
            >
                {renderBeerCard(item)}
            </Swipeable>
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
        <GestureHandlerRootView style={{ flex: 1 }}>
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
        </GestureHandlerRootView>
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
    beerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: 12,
    },
    beerInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    beerText: {
        ...typography.body,
    },
    bold: {
        fontWeight: 'bold',
    },
    beerTime: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: 2,
    },
    deleteAction: {
        backgroundColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: 56,
        borderRadius: 12,
        marginLeft: spacing.sm,
    },
    deleteActionText: {
        ...typography.small,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginTop: 4,
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
