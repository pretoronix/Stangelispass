import '../polyfills';
import { Tabs } from 'expo-router';
import { AppProvider } from '@/providers/AppProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';
import { useNotificationHandler } from '@/hooks/useNotificationHandler';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AppErrorBoundary>
                <QueryProvider>
                    <AppProvider>
                        <RootLayoutContent />
                    </AppProvider>
                </QueryProvider>
            </AppErrorBoundary>
        </SafeAreaProvider>
    );
}

function RootLayoutContent() {
    useNotificationHandler();

    return (
        <>
            <OfflineBanner />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textMuted,
                    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.surfaceLight },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
                    }}
                />
                <Tabs.Screen
                    name="add"
                    options={{
                        title: 'Add',
                        tabBarIcon: ({ color, size }) => <Ionicons name="beer" color={color} size={size} />,
                    }}
                />
                <Tabs.Screen
                    name="history"
                    options={{
                        title: 'History',
                        tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} />,
                    }}
                />
                <Tabs.Screen
                    name="legends"
                    options={{
                        title: 'Legends',
                        tabBarIcon: ({ color, size }) => <Ionicons name="trophy" color={color} size={size} />,
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: 'Settings',
                        tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        href: null,
                    }}
                />
            </Tabs>
        </>
    );
}
