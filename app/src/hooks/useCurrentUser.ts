import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/services/types';

const CURRENT_USER_KEY = 'stangelispass_current_user';

/**
 * Hook to manage current user persistence
 * Handles secure storage across web and native platforms
 */
export function useCurrentUser() {
    const [currentUser, setCurrentUserState] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user from storage on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                let savedUser = null;
                if (Platform.OS === 'web') {
                    if (typeof window !== 'undefined') {
                        savedUser = window.localStorage.getItem(CURRENT_USER_KEY);
                    }
                } else {
                    savedUser = await SecureStore.getItemAsync(CURRENT_USER_KEY);
                }

                if (savedUser) {
                    try {
                        setCurrentUserState(JSON.parse(savedUser));
                    } catch (parseError) {
                        console.error('Invalid saved user payload:', parseError);
                        // Clean up invalid data
                        if (Platform.OS === 'web') {
                            if (typeof window !== 'undefined') {
                                window.localStorage.removeItem(CURRENT_USER_KEY);
                            }
                        } else {
                            await SecureStore.deleteItemAsync(CURRENT_USER_KEY);
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load current user:', e);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    // Save user to storage
    const setCurrentUser = useCallback(async (user: User | null) => {
        try {
            setCurrentUserState(user);
            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined') {
                    if (user) {
                        window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
                    } else {
                        window.localStorage.removeItem(CURRENT_USER_KEY);
                    }
                }
                return;
            }
            if (user) {
                await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(user));
            } else {
                await SecureStore.deleteItemAsync(CURRENT_USER_KEY);
            }
        } catch (e) {
            console.error('Failed to save current user:', e);
            throw e;
        }
    }, []);

    return {
        currentUser,
        setCurrentUser,
        loading,
        isAdmin: currentUser?.is_admin || false,
    };
}
