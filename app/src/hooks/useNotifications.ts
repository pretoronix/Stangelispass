import { useState, useEffect } from 'react';
import { registerForPushNotificationsAsync, unregisterPushToken } from '@/services/notifications';
import { reportError } from '@/utils/logger';
import { FEATURE_FLAGS } from '@/config/featureFlags';

export function useNotifications(userId: string | null) {
  const [token, setToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  
  useEffect(() => {
    if (!FEATURE_FLAGS.NOTIFICATIONS_ENABLED) {
      setToken(null);
      setIsRegistered(false);
      return;
    }
    if (!userId) {
      setToken(null);
      setIsRegistered(false);
      return;
    }
    
    let isMounted = true;
    
    async function register() {
      if (!userId) return; // Type guard
      
      try {
        const pushToken = await registerForPushNotificationsAsync(userId);
        if (isMounted) {
          setToken(pushToken);
          setIsRegistered(!!pushToken);
        }
      } catch (err) {
        reportError(err as Error, {
          scope: 'useNotifications',
          action: 'register',
          userId: userId,
        });
        if (isMounted) {
          setIsRegistered(false);
        }
      }
    }
    
    register();
    
    return () => {
      isMounted = false;
    };
  }, [userId]);
  
  const unregister = async () => {
    if (!userId || !token) return false;
    
    try {
      const success = await unregisterPushToken(userId, token);
      if (success) {
        setToken(null);
        setIsRegistered(false);
      }
      return success;
    } catch (err) {
      if (userId) {
        reportError(err as Error, {
          scope: 'useNotifications',
          action: 'unregister',
          userId,
        });
      }
      return false;
    }
  };
  
  return { 
    token, 
    isRegistered,
    unregister,
  };
}
