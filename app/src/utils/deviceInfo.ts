import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reportError } from '@/utils/logger';

/**
 * Device capability detection for animations
 */

export async function isLowEndDevice(): Promise<boolean> {
    try {
        // Web is assumed capable
        if (Platform.OS === 'web') return false;
        
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
        reportError(new Error('Device detection failed:', error), { scope: 'deviceInfo', action: 'replace_console' });
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
        reportError(new Error('Failed to check animation preference:', error), { scope: 'deviceInfo', action: 'replace_console' });
        // Default to showing animations
        return true;
    }
}

export async function setAnimationPreference(enabled: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem('enable_pour_animation', String(enabled));
    } catch (error) {
        reportError(new Error('Failed to save animation preference:', error), { scope: 'deviceInfo', action: 'replace_console' });
    }
}
