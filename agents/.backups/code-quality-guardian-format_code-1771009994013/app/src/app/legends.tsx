import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWallOfFame, supabase } from '@/services/supabase';
import { WallOfFame } from '@/components/features/WallOfFame';
import { reportError } from '@/utils/logger';

export default function LegendsScreen() {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const data = await getWallOfFame();
            setEntries(data || []);
        } catch (e) {
            reportError(new Error('Failed to fetch Wall of Fame:', e), { scope: 'legends', action: 'replace_console' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Subscribe to wall changes
        const channel = supabase
            .channel('wall_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wall_of_fame' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Legends Gallery</Text>
                    <Text style={styles.subtitle}>Hall of Fame of Stängelispass</Text>
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <WallOfFame entries={entries} />
                )}
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
    header: {
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    title: {
        ...typography.largeTitle,
    },
    subtitle: {
        ...typography.callout,
        color: colors.textMuted,
        marginTop: 4,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
