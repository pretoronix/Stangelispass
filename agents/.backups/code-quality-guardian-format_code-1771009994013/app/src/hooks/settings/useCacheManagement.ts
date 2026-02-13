import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getCacheStats, clearCache, type CacheStats } from '@/utils/cacheManager';

export const useCacheManagement = () => {
    const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);

    useEffect(() => {
        getCacheStats().then(setCacheStats);
    }, []);

    const handleClearCache = useCallback(() => {
        Alert.alert(
            'Clear Cache',
            'This will remove all cached data. The app will reload fresh data from the server.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearCache();
                            const stats = await getCacheStats();
                            setCacheStats(stats);
                            Alert.alert('Success', 'Cache cleared successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear cache');
                        }
                    },
                },
            ]
        );
    }, []);

    return {
        cacheStats,
        handleClearCache,
    };
};
