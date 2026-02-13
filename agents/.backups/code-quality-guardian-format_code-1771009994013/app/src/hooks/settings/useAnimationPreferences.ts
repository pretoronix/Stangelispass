import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { setAnimationPreference } from '@/utils/deviceInfo';
import { audioService } from '@/services/audio';

export const useAnimationPreferences = () => {
    const [pourAnimationEnabled, setPourAnimationEnabled] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem('enable_pour_animation').then(value => {
            setPourAnimationEnabled(value !== 'false');
        });
    }, []);

    const togglePourAnimation = useCallback(async (value: boolean) => {
        setPourAnimationEnabled(value);
        await setAnimationPreference(value);
        if (value) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }, []);

    const toggleAudioMuted = useCallback((val: boolean) => {
        audioService.setMuted(!val);
        if (val) audioService.playPsst();
    }, []);

    const isAudioEnabled = useCallback(() => {
        return !audioService.getMuted();
    }, []);

    return {
        pourAnimationEnabled,
        togglePourAnimation,
        toggleAudioMuted,
        isAudioEnabled,
    };
};
