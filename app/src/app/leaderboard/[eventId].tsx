import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { colors } from "@/lib/theme";
import { getBeerCountByUser, supabase } from "@/services/supabase";
import { reportError } from "@/utils/logger";
import { LeaderboardItem } from "@/components/features/LeaderboardItem";

type EventRow = {
  id: string;
  name: string;
};

export default function PublicLeaderboardScreen() {
  const params = useLocalSearchParams<{ eventId?: string }>();
  const eventId = typeof params.eventId === "string" ? params.eventId : "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        if (!eventId) {
          setError("Event not found.");
          return;
        }
        const { data, error: eventError } = await supabase
          .from("events")
          .select("id, name")
          .eq("id", eventId)
          .maybeSingle();
        if (eventError) {
          throw eventError;
        }
        if (!data) {
          setError("Event not found.");
          return;
        }

        const counts = await getBeerCountByUser(eventId);
        if (!active) return;
        setEventName((data as EventRow).name);
        setLeaderboard(counts || []);
      } catch (e) {
        reportError(e as Error, {
          scope: "public_leaderboard",
          action: "load",
        });
        if (active) {
          setError("Unable to load leaderboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [eventId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 18 }}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20 }}>
        <Text
          style={{ color: colors.textPrimary, fontSize: 26, fontWeight: "700" }}
        >
          {eventName || "Leaderboard"}
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          Total beers:{" "}
          {leaderboard.reduce((sum, row) => sum + (row.count || 0), 0)}
        </Text>
      </View>
      {leaderboard.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: colors.textMuted }}>No beers logged yet.</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.userId}
          renderItem={({ item, index }) => (
            <LeaderboardItem item={item} index={index} isLeader={index === 0} />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}
