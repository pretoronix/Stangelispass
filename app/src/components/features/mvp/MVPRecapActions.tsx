import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { mvpRecapStyles as styles } from "./mvpRecapStyles";

type MVPRecapActionsProps = {
  onShare: () => void;
  onClose: () => void;
};

export function MVPRecapActions({ onShare, onClose }: MVPRecapActionsProps) {
  return (
    <View style={styles.actions}>
      <Pressable
        style={styles.shareButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
            () => null,
          );
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
  );
}
