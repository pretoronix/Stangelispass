import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { homeScreenStyles as styles } from "@/styles/screens/homeScreenStyles";
import { copy } from "@/ui/copy";

export function HomeEmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="beer-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyText}>{copy.home.empty}</Text>
      <Text style={styles.emptySubtext}>{copy.home.emptyHint} </Text>
    </View>
  );
}
