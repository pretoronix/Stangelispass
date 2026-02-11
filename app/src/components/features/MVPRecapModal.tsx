import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';

export interface MVPRecapData {
  eventName: string;
  winner: {
    id: string;
    name: string;
    beerCount: number;
    avatar?: string;
  };
  participants: Array<{
    id: string;
    name: string;
    beerCount: number;
  }>;
  endedAt: Date;
}

interface MVPRecapModalProps {
  visible: boolean;
  onClose: () => void;
  eventData: MVPRecapData;
  onShare: () => void;
}

export function MVPRecapModal({
  visible,
  onClose,
  eventData,
  onShare,
}: MVPRecapModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => null);
      
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} style={styles.backdrop}>
        <Animated.View
          style={[
            styles.cardContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF6B35']}
            style={styles.card}
          >
            {/* Trophy Icon */}
            <View style={styles.trophyContainer}>
              <Ionicons
                name="trophy"
                size={80}
                color="#FFF"
              />
            </View>
            
            {/* Title */}
            <Text style={styles.title}>
              🍺 Brewmaster of the Night
            </Text>
            
            {/* Winner Info */}
            <View style={styles.winnerSection}>
              <Text style={styles.winnerName}>
                {eventData.winner.name}
              </Text>
              <Text style={styles.beerCount}>
                {eventData.winner.beerCount} beers
              </Text>
            </View>
            
            {/* Event Info */}
            <View style={styles.eventInfo}>
              <Text style={styles.eventName}>
                {eventData.eventName}
              </Text>
              <Text style={styles.date}>
                {eventData.endedAt.toLocaleDateString()}
              </Text>
            </View>
            
            {/* Leaderboard Preview */}
            <ScrollView style={styles.leaderboardContainer}>
              <View style={styles.leaderboard}>
                {eventData.participants.slice(0, 5).map((p, i) => (
                  <View key={p.id} style={styles.leaderboardRow}>
                    <Text style={styles.rank}>#{i + 1}</Text>
                    <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.playerCount}>
                      {p.beerCount} 🍺
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            
            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                style={styles.shareButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
                  onShare();
                }}
              >
                <Ionicons name="share-social" size={24} color="#FFF" />
                <Text style={styles.shareText}>Share</Text>
              </Pressable>
              
              <Pressable
                style={styles.closeButton}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => null);
                  onClose();
                }}
              >
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  trophyContainer: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  winnerSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    width: '100%',
  },
  winnerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  beerCount: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '600',
  },
  eventInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  eventName: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  leaderboardContainer: {
    width: '100%',
    maxHeight: 200,
  },
  leaderboard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    width: 30,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
  },
  playerCount: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  shareText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  closeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
