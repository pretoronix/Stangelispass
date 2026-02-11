import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Register the device for Expo push notifications and store the token in Supabase
export async function registerForPushNotificationsAsync(userId: string) {
  try {
    if (Platform.OS === 'web') {
      console.warn('Push notifications are not supported on web.');
      return null;
    }
    if (!Device.isDevice) {
      console.warn('Must use a physical device for push notifications.');
      return null;
    }

    // Dynamically import `expo-notifications` to avoid executing web-specific
    // initialization code (which accesses `localStorage`) at bundle time in Metro.
    const Notifications = await import('expo-notifications');

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notifications.');
      return null;
    }

    const projectId =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    const token = tokenData?.data;
    if (!token) return null;

    // Upsert token into Supabase `device_tokens` table
    const { error } = await supabase
      .from('device_tokens')
      .upsert([{ user_id: userId, token }] as any)
      .select();
    if (error) {
      if ((error as any)?.code === 'PGRST205' || (error as any)?.code === '42P01') {
        console.warn('Supabase: table `device_tokens` not found. Push token not persisted.');
      } else {
        console.warn('Failed to save push token to Supabase:', error.message || error);
      }
    }

    return token;
  } catch (err) {
    console.warn('Error registering for push notifications:', err);
    return null;
  }
}

export async function unregisterPushToken(userId: string, token: string) {
  try {
    const { error } = await supabase.from('device_tokens').delete().match({ user_id: userId, token });
    if (error) console.warn('Failed to remove push token:', error.message || error);
    return !error;
  } catch (err) {
    console.warn('Error removing push token:', err);
    return false;
  }
}
