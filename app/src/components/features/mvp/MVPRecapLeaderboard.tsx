import React from "react";
import { ScrollView, Text, View } from "react-native";
import { mvpRecapStyles as styles } from "./mvpRecapStyles";
import type { MVPRecapData } from "@/components/features/MVPRecapModal";

type MVPRecapLeaderboardProps = {
  participants: MVPRecapData["participants"];
};

export function MVPRecapLeaderboard({
  participants,
}: MVPRecapLeaderboardProps) {
  return (
    <ScrollView style={styles.leaderboardContainer}>
      <View style={styles.leaderboard}>
        {participants.slice(0, 5).map((participant, index) => (
          <View key={participant.id} style={styles.leaderboardRow}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <Text style={styles.playerName} numberOfLines={1}>
              {participant.name}
            </Text>
            <Text style={styles.playerCount}>{participant.beerCount} 🍺</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
