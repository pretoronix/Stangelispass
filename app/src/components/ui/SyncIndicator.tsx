import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useOfflineMutations } from '@/hooks/useOfflineMutations';
import { colors, spacing } from '@/lib/theme';

export function SyncIndicator() {
  const { queue, isProcessing } = useOfflineMutations();
  
  if (queue.length === 0) return null;
  
  return (
    <View style={styles.container}>
      {isProcessing ? (
        <>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.text}>
            Syncing {queue.length} change{queue.length > 1 ? 's' : ''}...
          </Text>
        </>
      ) : (
        <Text style={styles.text}>
          {queue.length} pending change{queue.length > 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: spacing.sm,
    marginVertical: spacing.xs,
  },
  text: {
    marginLeft: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
  },
});
