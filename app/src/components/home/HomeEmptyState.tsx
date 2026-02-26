import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { homeScreenStyles as styles } from "@/styles/screens/homeScreenStyles";

export function HomeEmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="beer-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyText}>No beers logged yet!</Text>
      <Text style={styles.emptySubtext}>Time to start tracking? </Text>
    </View>
  );
}
