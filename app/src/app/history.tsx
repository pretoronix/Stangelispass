import React, { useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase, Beer } from "@/services/supabase";
import { useApp } from "@/providers/AppProvider";
import * as Haptics from "expo-haptics";
import { BeerLogItemWithComments } from "@/components/features/BeerLogItemWithComments";
import { reportError } from "@/utils/logger";
import { useLiveBeerLogPreference } from "@/hooks/settings";
import {
  useInfiniteBeersQuery,
  useRemoveBeer,
  BEER_QUERY_KEYS,
} from "@/hooks/query";
import { useQueryClient } from "@tanstack/react-query";

export default function HistoryScreen() {
  const { activeEvent, eventPermissions, currentUser } = useApp();
  const liveBeerLogPreference = useLiveBeerLogPreference();
  const queryClient = useQueryClient();
  const removeBeerMutation = useRemoveBeer();
  const beersQuery = useInfiniteBeersQuery(activeEvent?.id, 50);
  const beers = useMemo<Beer[]>(
    () => (beersQuery.data?.pages ?? []).flat(),
    [beersQuery.data],
  );

  useEffect(() => {
    if (!liveBeerLogPreference.enabled) return;

    const channel = supabase
      .channel("beers_history_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "beers" },
        () => {
          queryClient.invalidateQueries({
            queryKey: BEER_QUERY_KEYS.beers(activeEvent?.id),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeEvent?.id, liveBeerLogPreference.enabled, queryClient]);

  const onRefresh = useCallback(() => {
    beersQuery.refetch().catch((e) => {
      reportError(new Error("Failed to refresh beers"), {
        scope: "history",
        action: "refresh_beers",
        metadata: { cause: e instanceof Error ? e.message : String(e) },
      });
    });
  }, [beersQuery]);

  const handleRemove = async (beerId: string) => {
    if (!eventPermissions.canManageLogs) {
      Alert.alert("Not Authorized", "Only admins can remove beers.");
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => null,
      );
      await removeBeerMutation.mutateAsync(beerId);
    } catch (e) {
      Alert.alert("Error", "Failed to remove beer.");
    }
  };

  const renderItem = ({ item }: { item: Beer }) => {
    return (
      <BeerLogItemWithComments
        beer={item}
        currentUserId={currentUser?.id}
        currentUserIsAdmin={eventPermissions.canManageLogs}
        onDelete={handleRemove}
      />
    );
  };

  if (beersQuery.isLoading && !beersQuery.isRefetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <FlatList
          data={beers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent as any}
          refreshControl={
            <RefreshControl
              refreshing={beersQuery.isRefetching}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.largeTitle}>History</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="time-outline"
                size={64}
                color={colors.surfaceLight}
              />
              <Text style={styles.emptyText}>History is empty.</Text>
            </View>
          }
          onEndReached={() => {
            if (beersQuery.hasNextPage && !beersQuery.isFetchingNextPage) {
              beersQuery.fetchNextPage().catch(() => null);
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            beersQuery.isFetchingNextPage ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  largeTitle: {
    ...typography.largeTitle,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xxl,
  },
  emptyText: {
    ...typography.subtitle,
    marginTop: spacing.md,
    color: colors.textMuted,
  },
  loadingMore: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});
