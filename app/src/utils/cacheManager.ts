/**
 * Cache Management Utilities
 * Provides tools to monitor and manage React Query cache
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { queryClient } from '@/providers/QueryProvider';
import { logInfo, reportError } from '@/utils/logger';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
const CACHE_VERSION = 'v1';
const CACHE_KEY = `STANGELISPASS_QUERY_CACHE_${APP_VERSION}_${CACHE_VERSION}`;

export interface CacheStats {
    sizeKB: number;
    queriesCount: number;
    lastUpdated: Date | null;
}

/**
 * Get current cache size and statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
    try {
        const data = await AsyncStorage.getItem(CACHE_KEY);
        
        if (!data) {
            return {
                sizeKB: 0,
                queriesCount: 0,
                lastUpdated: null,
            };
        }

        const sizeKB = new Blob([data]).size / 1024;
        const parsed = JSON.parse(data);
        const queriesCount = parsed.clientState?.queries?.length || 0;

        return {
            sizeKB: Math.round(sizeKB * 100) / 100,
            queriesCount,
            lastUpdated: new Date(),
        };
    } catch (error) {
        reportError(new Error('[CacheManager] Error getting cache stats'), {
            scope: 'cacheManager',
            action: 'get_cache_stats',
            metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
        return {
            sizeKB: 0,
            queriesCount: 0,
            lastUpdated: null,
        };
    }
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
    try {
        queryClient.clear();
        await AsyncStorage.removeItem(CACHE_KEY);
        logInfo('[CacheManager] Cache cleared successfully', {
            scope: 'cacheManager',
            action: 'clear_cache',
        });
    } catch (error) {
        reportError(new Error('[CacheManager] Error clearing cache'), {
            scope: 'cacheManager',
            action: 'clear_cache',
            metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
        throw error;
    }
}

/**
 * Check if cache size exceeds limit and clear if necessary
 * @param maxSizeMB - Maximum cache size in MB (default: 5)
 */
export async function checkAndClearIfOversized(maxSizeMB: number = 5): Promise<boolean> {
    try {
        const stats = await getCacheStats();
        const maxSizeKB = maxSizeMB * 1024;

        if (stats.sizeKB > maxSizeKB) {
            reportError(
                new Error(`[CacheManager] Cache size (${stats.sizeKB}KB) exceeds limit (${maxSizeKB}KB), clearing...`),
                { scope: 'cacheManager', action: 'replace_console' }
            );
            await clearCache();
            return true;
        }

        return false;
    } catch (error) {
        reportError(new Error('[CacheManager] Error checking cache size'), {
            scope: 'cacheManager',
            action: 'check_cache_size',
            metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
        return false;
    }
}

/**
 * Get all cache keys from AsyncStorage
 */
export async function getAllCacheKeys(): Promise<string[]> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        return keys.filter(key => key.startsWith('STANGELISPASS_QUERY_CACHE_'));
    } catch (error) {
        reportError(new Error('[CacheManager] Error getting cache keys'), {
            scope: 'cacheManager',
            action: 'get_cache_keys',
            metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
        return [];
    }
}

/**
 * Clear all cache versions (current and old)
 */
export async function clearAllCacheVersions(): Promise<void> {
    try {
        const cacheKeys = await getAllCacheKeys();
        if (cacheKeys.length > 0) {
            await AsyncStorage.multiRemove(cacheKeys);
            queryClient.clear();
            logInfo('[CacheManager] Cleared all cache versions', {
                scope: 'cacheManager',
                action: 'clear_all_cache_versions',
                metadata: { removedKeys: cacheKeys.length },
            });
        }
    } catch (error) {
        reportError(new Error('[CacheManager] Error clearing all cache versions'), {
            scope: 'cacheManager',
            action: 'clear_all_cache_versions',
            metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
        throw error;
    }
}
