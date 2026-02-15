import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reportError } from '@/utils/logger';

/**
 * Device capability detection for animations
 */

export const isSimulator = () => Platform.OS !== 'web' && !Device.isDevice;

export async function hasNativeHaptics(): Promise<boolean> {
    try {
        if (Platform.OS === 'web') return false;
        return !!Device.isDevice;
    } catch (error) {
        reportError(new Error('Haptics capability check failed'), {
            scope: 'deviceInfo',
            action: 'detect_haptics',
            metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
        return false;
    }
}

export async function isLowEndDevice(): Promise<boolean> {
    try {
        // Web is assumed capable
        if (Platform.OS === 'web') return false;

        // Simulators/emulators often struggle with Lottie + heavy Reanimated
        if (isSimulator()) {
            return true;
        }

        // Check device year class (if available)
        const deviceYearClass = Device.deviceYearClass;
        if (deviceYearClass && deviceYearClass < 2020) {
            return true;
        }

        // Check total memory (if available)
        const totalMemory = Device.totalMemory;
        if (totalMemory && totalMemory < 3 * 1024 * 1024 * 1024) {
            // Less than 3GB RAM
            return true;
        }

        // Default to capable if we can't determine
        return false;
    } catch (error) {
        reportError(new Error('Device detection failed'), {
            scope: 'deviceInfo',
            action: 'detect_device',
            metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
        // On error, assume capable device
        return false;
    }
}

export async function shouldShowAnimations(): Promise<boolean> {
    try {
        // Check user preference first
        const preference = await AsyncStorage.getItem('enable_pour_animation');

        // If user explicitly disabled, respect that
        if (preference === 'false') {
            return false;
        }

        // If user explicitly enabled, show animations
        if (preference === 'true') {
            return true;
        }

        // No preference set, check device capability
        const isLowEnd = await isLowEndDevice();
        return !isLowEnd;
    } catch (error) {
        reportError(new Error('Failed to check animation preference'), {
            scope: 'deviceInfo',
            action: 'check_animation_preference',
            metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
        // Default to showing animations
        return true;
    }
}

export async function setAnimationPreference(enabled: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem('enable_pour_animation', String(enabled));
    } catch (error) {
        reportError(new Error('Failed to save animation preference'), {
            scope: 'deviceInfo',
            action: 'set_animation_preference',
            metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
    }
}
