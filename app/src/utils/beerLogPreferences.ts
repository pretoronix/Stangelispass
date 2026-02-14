import AsyncStorage from '@react-native-async-storage/async-storage';
import { reportError } from '@/utils/logger';

const LIVE_BEER_LOG_KEY = 'enable_live_beer_log_updates';

export async function getLiveBeerLogPreference(): Promise<boolean> {
    try {
        const stored = await AsyncStorage.getItem(LIVE_BEER_LOG_KEY);
        if (stored === null) return false;
        return stored === 'true';
    } catch (error) {
        reportError(new Error('Failed to load live beer log preference'), {
            scope: 'beer_log_pref',
            action: 'load',
            metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
        return false;
    }
}

export async function setLiveBeerLogPreference(enabled: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem(LIVE_BEER_LOG_KEY, enabled ? 'true' : 'false');
    } catch (error) {
        reportError(new Error('Failed to save live beer log preference'), {
            scope: 'beer_log_pref',
            action: 'save',
            metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
    }
}
