import Constants from 'expo-constants';

type FeatureFlags = {
  NOTIFICATIONS_ENABLED: boolean;
  REALTIME_ENABLED: boolean;
  OFFLINE_MODE_ENABLED: boolean;
};

const getPublicEnv = (key: string): string => {
  try {
    const v = (typeof process !== 'undefined' && process.env && (process.env as any)[key]) || '';
    if (v) return String(v);
  } catch {
    // ignore
  }

  try {
    const extra = (Constants as any)?.expoConfig?.extra || {};
    const v = extra?.[key] || '';
    if (v) return String(v);
  } catch {
    // ignore
  }

  return '';
};

const parseBool = (value: string, fallback: boolean) => {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
};

// Emergency overrides (do not require a redeploy if you can update env/config).
const NOTIFICATIONS_OVERRIDE = getPublicEnv('EXPO_PUBLIC_NOTIFICATIONS_ENABLED');

export const FEATURE_FLAGS: FeatureFlags = {
  NOTIFICATIONS_ENABLED: parseBool(NOTIFICATIONS_OVERRIDE, true),
  REALTIME_ENABLED: true,
  OFFLINE_MODE_ENABLED: true,
};

