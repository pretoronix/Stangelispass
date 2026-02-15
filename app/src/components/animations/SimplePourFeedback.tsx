import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
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

    useEffect(() => {
        if (visible) {
            // Haptic feedback
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            ).catch(() => {
                // Ignore haptic errors
            });

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

            // Auto-dismiss after animation
            const timer = setTimeout(() => {
                opacity.value = withTiming(0, { duration: 300 }, (finished) => {
                    if (finished) {
                        onComplete();
                    }
                });
            }, 1200);

            return () => clearTimeout(timer);
        } else {
            scale.value = 0;
            opacity.value = 0;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    if (!visible) return null;

    return (
        <View style={[styles.overlay, { backgroundColor: colors.background + 'B3' }]}>
            <Animated.View style={[styles.content, animatedStyle, { backgroundColor: colors.surfaceLight + '1A' }]}>
                <Ionicons name="beer" size={80} color={colors.primary} />
                <Text style={[styles.text, { color: colors.textPrimary }]}>Beer Logged! 🍺</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    content: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 40,
        paddingVertical: 30,
        borderRadius: 20,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
    },
});
