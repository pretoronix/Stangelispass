import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/lib/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CacheStats } from '@/utils/cacheManager';
import { formatCacheSizeKB } from '@/utils/settings/settingsHelpers';

interface CacheManagementSectionProps {
    cacheStats: CacheStats | null;
    onClearCache: () => void;
}

export const CacheManagementSection: React.FC<CacheManagementSectionProps> = ({
    cacheStats,
    onClearCache,
}) => {
    return (
        <Card>
            {cacheStats && (
                <>
                    <View style={styles.bioRow}>
                        <Text style={styles.bioLabel}>Cache Size</Text>
                        <Text style={styles.bioValue}>
                            {formatCacheSizeKB(cacheStats.sizeKB)} KB
                        </Text>
                    </View>
                    <View style={styles.bioRow}>
                        <Text style={styles.bioLabel}>Cached Queries</Text>
                        <Text style={styles.bioValue}>
                            {cacheStats.queriesCount}
                        </Text>
                    </View>
                </>
            )}
            <Button
                title="Clear Cache"
                variant="secondary"
                onPress={onClearCache}
                icon="trash-outline"
                style={styles.clearCacheButton}
            />
            <Text style={styles.bioDisclaimer}>
                Cached data enables offline viewing and instant app startup.
            </Text>
        </Card>
    );
};

const styles = StyleSheet.create({
    bioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceLight,
    },
    bioLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    bioValue: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: 'bold',
    },
    clearCacheButton: {
        marginTop: spacing.md,
    },
    bioDisclaimer: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: spacing.sm,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
