import React, { ReactNode, useEffect } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * React Query provider configuration with persistent cache
 * Enables offline data viewing and instant app startup
 */

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
const CACHE_VERSION = 'v1'; // Increment when breaking changes to schema

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
        },
        mutations: {
            retry: 1,
        },
    },
});

const persister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: `STANGELISPASS_QUERY_CACHE_${APP_VERSION}_${CACHE_VERSION}`,
    throttleTime: 1000, // Only persist once per second
});

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    // Clear old cache versions on app start
    useEffect(() => {
        const clearOldCache = async () => {
            try {
                const keys = await AsyncStorage.getAllKeys();
                const oldCacheKeys = keys.filter(
                    key => key.startsWith('STANGELISPASS_QUERY_CACHE_') 
                        && key !== `STANGELISPASS_QUERY_CACHE_${APP_VERSION}_${CACHE_VERSION}`
                );
                
                if (oldCacheKeys.length > 0) {
                    await AsyncStorage.multiRemove(oldCacheKeys);
                    console.log('[QueryProvider] Cleared old cache versions:', oldCacheKeys.length);
                }
            } catch (error) {
                console.error('[QueryProvider] Error clearing old cache:', error);
            }
        };
        
        clearOldCache();
    }, []);

    return (
        <PersistQueryClientProvider 
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: 1000 * 60 * 60 * 24, // 24 hours
                dehydrateOptions: {
                    shouldDehydrateQuery: (query) => {
                        const queryKey = query.queryKey[0] as string;
                        
                        // Don't persist sensitive data
                        const skipPersist = [
                            'device-token',
                            'auth-session',
                        ];
                        
                        if (skipPersist.some(skip => queryKey?.includes?.(skip))) {
                            return false;
                        }
                        
                        // Only persist successful queries
                        return query.state.status === 'success';
                    },
                },
            }}
        >
            {children}
            
            {/* DevTools: web-only for best compatibility */}
            {__DEV__ && Platform.OS === 'web' && (
                <ReactQueryDevtools 
                    initialIsOpen={false}
                    position="bottom"
                />
            )}
        </PersistQueryClientProvider>
    );
}

export { queryClient };
