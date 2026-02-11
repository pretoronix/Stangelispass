// Environment/setup helpers that must run before modules are imported in tests.
// This file is referenced by `jest.config.js` under `setupFiles`.

// Ensure `process.env` exists and set defaults used by the app
let _env = (typeof process !== 'undefined' && process.env) ? process.env : {};
_env.EXPO_PUBLIC_SUPABASE_URL = _env.EXPO_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
_env.EXPO_PUBLIC_SUPABASE_ANON_KEY = _env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
if (typeof process === 'undefined') {
    global.process = { env: _env };
} else {
    process.env = _env;
}

// Mock react-native-reanimated early to avoid native requirement during transforms
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => { };
    return Reanimated;
});

// Mock Expo Haptics
jest.mock('expo-haptics', () => ({
    selectionAsync: jest.fn(),
    notificationAsync: jest.fn(),
    impactAsync: jest.fn(),
    NotificationFeedbackType: { Success: 'success', Error: 'error' },
    ImpactFeedbackStyle: { Light: 'light' },
}));

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

// Mock Expo Constants
jest.mock('expo-constants', () => ({
    expoConfig: {
        extra: {
            supabaseUrl: 'https://test.supabase.co',
            supabaseAnonKey: 'test-key',
        },
    },
}));

// Mock Supabase client for unit tests
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        auth: {
            getSession: jest.fn(),
            onAuthStateChange: jest.fn(),
        },
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockReturnThis(),
        })),
        channel: jest.fn(() => ({
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockReturnThis(),
        })),
        removeChannel: jest.fn(),
    })),
}));
