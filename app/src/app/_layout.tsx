import "../polyfills";
import { useEffect } from "react";
import { Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

SplashScreen.preventAutoHideAsync();
import { AppProvider } from "@/providers/AppProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { useNotificationHandler } from "@/hooks/useNotificationHandler";
import { useApp } from "@/providers/AppProvider";
import { queryClient } from "@/providers/QueryProvider";
import { getBeers, getBeerCountByEventMembers } from "@/services/beers";
import {
  getEventMembers,
  getEventGameStats,
  getEventLeaderState,
} from "@/services/events";
import { BEER_QUERY_KEYS, EVENT_QUERY_KEYS } from "@/hooks/query";
import { logInfo, reportError } from "@/utils/logger";

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <QueryProvider>
          <AppProvider>
            <RootLayoutContent />
          </AppProvider>
        </QueryProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

function RootLayoutContent() {
  useNotificationHandler();
  const { activeEvent } = useApp();

  useEffect(() => {
    if (!activeEvent?.id) return;
    const eventId = activeEvent.id;
    const pageSize = 50;

    const prefetch = async () => {
      try {
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: BEER_QUERY_KEYS.beers(eventId),
            queryFn: () => getBeers(eventId),
          }),
          queryClient.prefetchQuery({
            queryKey: BEER_QUERY_KEYS.beersInfinite(eventId, pageSize),
            queryFn: () => getBeers(eventId, { limit: pageSize }),
          }),
          queryClient.prefetchQuery({
            queryKey: BEER_QUERY_KEYS.beerCounts(eventId),
            queryFn: () => getBeerCountByEventMembers(eventId),
          }),
          queryClient.prefetchQuery({
            queryKey: EVENT_QUERY_KEYS.eventMembers(eventId),
            queryFn: () => getEventMembers(eventId),
          }),
          queryClient.prefetchQuery({
            queryKey: EVENT_QUERY_KEYS.eventGameStats(eventId),
            queryFn: () => getEventGameStats(eventId),
          }),
          queryClient.prefetchQuery({
            queryKey: EVENT_QUERY_KEYS.eventLeaderState(eventId),
            queryFn: () => getEventLeaderState(eventId),
          }),
        ]);

        if (__DEV__) {
          logInfo("[Prefetch] Warmed event queries", {
            scope: "prefetch",
            action: "warm_cache",
            metadata: { eventId },
          });
        }
      } catch (e) {
        reportError(new Error("Prefetch failed"), {
          scope: "prefetch",
          action: "warm_cache",
          metadata: { cause: e instanceof Error ? e.message : String(e) },
        });
      }
    };

    prefetch().catch(() => null);
  }, [activeEvent?.id]);

  return (
    <>
      <OfflineBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.surfaceLight,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Add",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="beer" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="legends"
          options={{
            title: "Legends",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trophy" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
