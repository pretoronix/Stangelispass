import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

/**
 * Hook to handle incoming notifications (foreground and tapped)
 * 
 * Behavior:
 * - Foreground: Shows Alert with notification content
 * - Tapped: Navigates to home screen
 * 
 * Usage:
 * Call once at app root level (_layout.tsx)
 */
export const useNotificationHandler = () => {
    const router = useRouter();
    const notificationListener = useRef<any>(null);
    const responseListener = useRef<any>(null);

    useEffect(() => {
        // Configure how notifications are presented when app is in foreground
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        // Handle notifications received while app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            const { title, body } = notification.request.content;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);

            // Show alert for foreground notifications
            Alert.alert(
                title || 'Notification',
                body || '',
                [
                    {
                        text: 'OK',
                        style: 'default',
                    },
                ],
                { cancelable: true }
            );
        });

        // Handle notification taps (when user taps notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            
            // Navigate based on notification type
            if (data?.type === 'admin_broadcast') {
                // Navigate to home screen for broadcasts
                router.push('/');
            } else if (data?.type === 'new_round') {
                router.push('/');
            } else if (data?.type === 'leader_change') {
                // Navigate to home screen for leader changes
                router.push('/');
            } else if (data?.type === 'milestone') {
                // Navigate to history screen for milestones
                router.push('/history');
            } else {
                // Default: navigate to home
                router.push('/');
            }
        });

        return () => {
            // Cleanup listeners on unmount
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, [router]);
};
