import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { commentsStyles as styles } from "./commentsStyles";
import { copy } from "@/ui/copy";

type CommentsEmptyStateProps = {
  isLoading: boolean;
  error: unknown;
};

export function CommentsEmptyState({
  isLoading,
  error,
}: CommentsEmptyStateProps) {
  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.emptyText}>{copy.common.commentsLoading}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
        <Text style={styles.emptyText}>{copy.common.commentsLoadFailed}</Text>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={32} color={colors.textMuted} />
      <Text style={styles.emptyText}>{copy.common.commentsEmpty}</Text>
      <Text style={styles.emptySubtext}>{copy.common.commentsBeFirst}</Text>
    </View>
  );
}
