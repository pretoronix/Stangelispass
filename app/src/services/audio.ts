import { Platform } from 'react-native';
import { reportError } from '@/utils/logger';

const PSST_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/03/15/audio_73147814c3.mp3'; // Bottle opening sound

type AudioPlayerLike = {
    play?: () => void;
    pause?: () => void;
    seekTo?: (seconds: number) => void;
    replace?: (source: any) => void;
    release?: () => void;
};

class AudioService {
    private player: AudioPlayerLike | null = null;
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
            // Lazy require so lint/typecheck don't fail before deps are installed.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { createAudioPlayer } = require('expo-audio') as any;
            if (this.player?.release) {
                this.player.release();
            }
            this.player = createAudioPlayer({ uri: PSST_SOUND_URL });
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            reportError(new Error('Failed to load sound'), {
                scope: 'audio',
                action: 'load_sound',
                metadata: { cause: err.message },
            });
        }
    }

    async playPsst() {
        if (Platform.OS === 'web') return;
        if (this.isMuted || !this.player) return;

        try {
            if (this.player.seekTo) {
                this.player.seekTo(0);
            }
            if (this.player.play) {
                this.player.play();
            }
        } catch (e) {
            // If sound was unloaded or failed, try reloading once
            await this.loadSound();
            if (this.player?.seekTo) {
                this.player.seekTo(0);
            }
            this.player?.play?.();
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
