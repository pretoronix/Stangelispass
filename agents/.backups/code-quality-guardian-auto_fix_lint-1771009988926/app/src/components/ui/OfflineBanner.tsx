import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export function OfflineBanner() {
  const { isOnline, isReconnecting } = useNetworkStatus();
  const [slideAnim] = React.useState(new Animated.Value(-50));
  
  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: !isOnline ? 0 : -50,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, slideAnim]);
  
  if (isOnline && !isReconnecting) return null;
  
  return (
    <Animated.View 
      style={[
        styles.banner,
        isReconnecting && styles.reconnecting,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <Ionicons 
        name={isReconnecting ? 'cloud-done' : 'cloud-offline'} 
        size={20} 
        color="#fff" 
      />
      <Text style={styles.text}>
        {isReconnecting ? '✓ Back online' : '📶 Offline - viewing cached data'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  reconnecting: {
    backgroundColor: '#51cf66',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
