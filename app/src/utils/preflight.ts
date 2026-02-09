import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logWarn } from '@/utils/logger';

type SupabaseConfig = {
    url?: string;
    anonKey?: string;
};

const resolveSupabaseConfig = (input?: SupabaseConfig) => {
    const hasInput = Boolean(input && ('url' in input || 'anonKey' in input));
    let url = input?.url || '';
    let anonKey = input?.anonKey || '';

    if (hasInput) return { url, anonKey };

    try {
        if (typeof process !== 'undefined' && process.env) {
            url = url || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
            anonKey = anonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
        }
    } catch (_e) {
        // ignore
    }

    try {
        const extras = (Constants && (Constants as any).expoConfig && (Constants as any).expoConfig.extra) || {};
        url = url || extras.supabaseUrl || extras.EXPO_PUBLIC_SUPABASE_URL || '';
        anonKey = anonKey || extras.supabaseAnonKey || extras.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    } catch (_e) {
        // ignore
    }

    return { url, anonKey };
};

export const assertSupabaseConfigured = (input?: SupabaseConfig) => {
    const { url, anonKey } = resolveSupabaseConfig(input);
    const ok = Boolean(url && anonKey);
    if (!ok) {
        if (process.env.NODE_ENV === 'production') {
            const error = new Error('preflight:supabase_config');
            (error as any).scope = 'preflight';
            (error as any).action = 'supabase_config';
            throw error;
        }
        logWarn('Supabase config missing', {
            scope: 'preflight',
            action: 'supabase_config',
            metadata: { urlPresent: Boolean(url), anonKeyPresent: Boolean(anonKey) },
        });
    }
    return ok;
};

const warnedFeatures = new Set<string>();

export const warnIfWebUnsupported = (feature: string) => {
    if (Platform.OS === 'web') {
        if (!warnedFeatures.has(feature)) {
            warnedFeatures.add(feature);
            logWarn('Web feature guard', {
                scope: 'preflight',
                action: 'web_unsupported',
                metadata: { feature },
            });
        }
        return false;
    }
    return true;
};
