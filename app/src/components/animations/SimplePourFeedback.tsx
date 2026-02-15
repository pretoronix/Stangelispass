import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import { hasNativeHaptics, isSimulator } from '@/utils/deviceInfo';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';

/**
 * Simple fallback animation for low-end devices
 * Shows a quick beer icon with success message
 */

interface SimplePourFeedbackProps {
    visible: boolean;
    onComplete: () => void;
}

export function SimplePourFeedback({ visible, onComplete }: SimplePourFeedbackProps) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const [hapticsEnabled, setHapticsEnabled] = useState(false);
    const shouldAnimate = !isSimulator();

    useEffect(() => {
        let cancelled = false;
        hasNativeHaptics().then((enabled) => {
            if (!cancelled) {
                setHapticsEnabled(enabled);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (visible) {
            // Haptic feedback
            if (hapticsEnabled) {
                Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                ).catch(() => {
                    // Ignore haptic errors
                });
            }

            if (shouldAnimate) {
                // Scale and fade in animation
                scale.value = withSequence(
                    withTiming(1.2, {
                        duration: 300,
                        easing: Easing.out(Easing.back(1.5)),
                    }),
                    withTiming(1.0, {
                        duration: 200,
                        easing: Easing.inOut(Easing.ease),
                    })
                );

                opacity.value = withTiming(1, { duration: 200 });
            } else {
                scale.value = 1;
                opacity.value = 1;
            }

            // Auto-dismiss after animation
            const timer = setTimeout(() => {
                if (shouldAnimate) {
                    opacity.value = withTiming(0, { duration: 300 }, (finished) => {
                        if (finished) {
                            onComplete();
                        }
                    });
                } else {
                    onComplete();
                }
            }, shouldAnimate ? 1200 : 300);

            return () => clearTimeout(timer);
        } else {
            scale.value = 0;
            opacity.value = 0;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, hapticsEnabled, shouldAnimate]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.content, animatedStyle]}>
                <Ionicons name="beer" size={80} color={colors.primary} />
                <Text style={styles.text}>Beer Logged!</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: `${colors.background}B3`,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    content: {
        alignItems: 'center',
        backgroundColor: `${colors.surfaceLight}1A`,
        paddingHorizontal: 40,
        paddingVertical: 30,
        borderRadius: 20,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
        color: colors.textPrimary,
    },
});
