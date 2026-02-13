import { User } from '@/services/supabase';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const playHapticSelection = () => {
    if (Platform.OS === 'ios') {
        Haptics.selectionAsync().catch(() => null);
    }
};

export const playHapticSuccess = () => {
    if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    }
};

export const playHapticError = () => {
    if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => null);
    }
};

export const playHapticImpact = () => {
    if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
    }
};

export const formatCacheSizeKB = (sizeKB: number): string => {
    return sizeKB.toFixed(2);
};

export const getSubscriptionTierDisplay = (tier?: User['subscription_tier']): string => {
    return tier === 'craft' ? 'Craft (Premium)' : 'Pilsner (Free)';
};

export const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
