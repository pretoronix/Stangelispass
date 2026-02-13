import React, { useEffect, useRef } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    Dimensions,
    Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

/**
 * Full Lottie-based pour animation
 * Shows when logging a beer on capable devices
 */

interface PourAnimationProps {
    visible: boolean;
    onComplete: () => void;
}

export function PourAnimation({ visible, onComplete }: PourAnimationProps) {
    const animationRef = useRef<LottieView>(null);
    const opacity = useSharedValue(0);
    
    // Fade in/out animation
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));
    
    useEffect(() => {
        if (visible) {
            // Fade in
            opacity.value = withTiming(1, {
                duration: 300,
                easing: Easing.ease,
            });
            
            // Start Lottie animation
            animationRef.current?.play();
            
            // Haptic feedback sequence
            startHapticSequence();
            
            // Auto-complete after animation duration
            const timer = setTimeout(() => {
                handleComplete();
            }, 2800); // Slightly longer than animation
            
            return () => {
                clearTimeout(timer);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);
    
    const startHapticSequence = () => {
        // Light haptic every 200ms during pour
        const hapticIntervals = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000];
        
        hapticIntervals.forEach((delay) => {
            setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }, delay);
        });
        
        // Final "success" haptic at end
        setTimeout(() => {
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            );
        }, 2500);
    };
    
    const handleComplete = () => {
        // Fade out
        opacity.value = withTiming(0, {
            duration: 300,
            easing: Easing.ease,
        }, (finished) => {
            if (finished) {
                onComplete();
            }
        });
    };
    
    if (!visible) return null;
    
    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleComplete}
        >
            <Animated.View style={[styles.container, animatedStyle]}>
                {/* Blurred background */}
                <BlurView intensity={80} style={styles.blur}>
                    <View style={styles.content}>
                        <LottieView
                            ref={animationRef}
                            source={require('@/assets/animations/beer-pour.json')}
                            style={styles.animation}
                            autoPlay={false}
                            loop={false}
                            speed={1.0}
                        />
                    </View>
                </BlurView>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    blur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: width * 0.8,
        height: height * 0.6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    animation: {
        width: '100%',
        height: '100%',
    },
});
