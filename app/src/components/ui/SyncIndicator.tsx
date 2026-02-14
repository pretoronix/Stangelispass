import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useApp } from '@/providers/AppProvider';
import { colors, spacing } from '@/lib/theme';

export function SyncIndicator() {
  const { offlineQueue, offlineQueueProcessing } = useApp();
  const queueLength = offlineQueue.length;

  if (queueLength === 0) return null;
  
  return (
    <View style={styles.container}>
      {offlineQueueProcessing ? (
        <>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.text}>
            Syncing {queueLength} change{queueLength > 1 ? 's' : ''}...
          </Text>
        </>
      ) : (
        <Text style={styles.text}>
          {queueLength} pending change{queueLength > 1 ? 's' : ''}
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
