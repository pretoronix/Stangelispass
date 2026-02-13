import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { reportError } from '@/utils/logger';

const PSST_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/03/15/audio_73147814c3.mp3'; // Bottle opening sound

class AudioService {
    private sound: Audio.Sound | null = null;
    private isMuted: boolean = false;

    constructor() {
        // Initial setup (skip on web to avoid Audio API errors)
        if (Platform.OS !== 'web') {
            this.loadSound();
        }
    }

    async loadSound() {
        if (Platform.OS === 'web') return;
        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: PSST_SOUND_URL },
                { shouldPlay: false }
            );
            this.sound = sound;
        } catch (e) {
            reportError(new Error('Failed to load sound:', e), { scope: 'audio', action: 'replace_console', level: 'warn' });
        }
    }

    async playPsst() {
        if (Platform.OS === 'web') return;
        if (this.isMuted || !this.sound) return;

        try {
            await this.sound.replayAsync();
        } catch (e) {
            // If sound was unloaded or failed, try reloading once
            await this.loadSound();
            await this.sound?.replayAsync();
        }
    }

    setMuted(muted: boolean) {
        this.isMuted = muted;
    }

    getMuted() {
        return this.isMuted;
    }
}

export const audioService = new AudioService();
