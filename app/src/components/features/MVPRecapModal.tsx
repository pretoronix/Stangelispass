import React, { useRef, useEffect } from "react";
import { Modal, View, Text, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { mvpRecapStyles as styles } from "@/components/features/mvp/mvpRecapStyles";
import { MVPRecapLeaderboard } from "@/components/features/mvp/MVPRecapLeaderboard";
import { MVPRecapActions } from "@/components/features/mvp/MVPRecapActions";

export interface MVPRecapData {
  eventName: string;
  winner: {
    id: string;
    name: string;
    beerCount: number;
    avatar?: string;
  };
  participants: {
    id: string;
    name: string;
    beerCount: number;
  }[];
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => null,
      );

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
          style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}
        >
          <LinearGradient
            colors={["#FFD700", "#FFA500", "#FF6B35"]}
            style={styles.card}
          >
            {/* Trophy Icon */}
            <View style={styles.trophyContainer}>
              <Ionicons name="trophy" size={80} color="#FFF" />
            </View>

            {/* Title */}
            <Text style={styles.title}>🍺 Brewmaster of the Night</Text>

            {/* Winner Info */}
            <View style={styles.winnerSection}>
              <Text style={styles.winnerName}>{eventData.winner.name}</Text>
              <Text style={styles.beerCount}>
                {eventData.winner.beerCount} beers
              </Text>
            </View>

            {/* Event Info */}
            <View style={styles.eventInfo}>
              <Text style={styles.eventName}>{eventData.eventName}</Text>
              <Text style={styles.date}>
                {eventData.endedAt.toLocaleDateString()}
              </Text>
            </View>

            {/* Leaderboard Preview */}
            <MVPRecapLeaderboard participants={eventData.participants} />

            {/* Actions */}
            <MVPRecapActions onShare={onShare} onClose={onClose} />
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}
