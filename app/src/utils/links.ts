import * as Linking from "expo-linking";
import Constants from "expo-constants";

export const getLeaderboardLinks = (eventId: string) => {
  const path = `leaderboard/${eventId}`;
  const nativeUrl = Linking.createURL(path);
  const webBase =
    (Constants as any)?.expoConfig?.extra?.webUrl ||
    (Constants as any)?.expoConfig?.extra?.EXPO_PUBLIC_WEB_URL ||
    process.env.EXPO_PUBLIC_WEB_URL ||
    null;

  const webUrl = webBase
    ? `${String(webBase).replace(/\/$/, "")}/${path}`
    : Linking.createURL(path);

  return { nativeUrl, webUrl };
};
