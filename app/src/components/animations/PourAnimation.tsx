import React, { useEffect, useRef, useState } from 'react';
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
    runOnJS,
} from 'react-native-reanimated';
import { reportError } from '@/utils/logger';

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
    const isMounted = useRef(true);
    const hapticsTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
    
    // Update dimensions on change (handles rotation)
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window);
        });
        
        return () => {
            subscription?.remove();
        };
    }, []);
    
    // Fade in/out animation
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));
    
    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        
        return () => {
            isMounted.current = false;
            // Clear all timers on unmount
            hapticsTimers.current.forEach(clearTimeout);
            hapticsTimers.current = [];
            if (completionTimer.current) {
                clearTimeout(completionTimer.current);
                completionTimer.current = null;
            }
            if (playTimer.current) {
                clearTimeout(playTimer.current);
                playTimer.current = null;
            }
        };
    }, []);
    
    useEffect(() => {
        if (!visible) {
            opacity.value = 0;
            hapticsTimers.current.forEach(clearTimeout);
            hapticsTimers.current = [];
            if (completionTimer.current) {
                clearTimeout(completionTimer.current);
                completionTimer.current = null;
            }
            if (playTimer.current) {
                clearTimeout(playTimer.current);
                playTimer.current = null;
            }
            return;
        }

        try {
            // Fade in
            opacity.value = withTiming(1, {
                duration: 300,
                easing: Easing.ease,
            });
            
            // Start Lottie animation with delay to ensure mount
            playTimer.current = setTimeout(() => {
                if (isMounted.current) {
                    animationRef.current?.play();
                }
            }, 100);
            
            // Haptic feedback sequence
            startHapticSequence();
            
            // Auto-complete after animation duration
            completionTimer.current = setTimeout(() => {
                if (isMounted.current) {
                    handleComplete();
                }
            }, 2800); // Slightly longer than animation
        } catch (error) {
            reportError(error as Error, { 
                scope: 'PourAnimation', 
                action: 'init'
            });
            // Fallback: just complete immediately on error
            if (isMounted.current) {
                handleComplete();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);
    
    const startHapticSequence = () => {
        // Clear any existing timers
        hapticsTimers.current.forEach(clearTimeout);
        hapticsTimers.current = [];
        
        try {
            // Light haptic every 200ms during pour
            const hapticIntervals = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000];
            
            hapticIntervals.forEach((delay) => {
                const timer = setTimeout(() => {
                    if (isMounted.current) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
                            // Ignore haptic errors (may not be supported on simulator)
                        });
                    }
                }, delay);
                hapticsTimers.current.push(timer);
            });
            
            // Final "success" haptic at end
            const finalTimer = setTimeout(() => {
                if (isMounted.current) {
                    Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success
                    ).catch(() => {
                        // Ignore haptic errors
                    });
                }
            }, 2500);
            hapticsTimers.current.push(finalTimer);
        } catch (error) {
            reportError(error as Error, {
                scope: 'PourAnimation',
                action: 'haptics'
            });
        }
    };
    
    const handleComplete = () => {
        if (!isMounted.current) return;
        
        try {
            // Fade out
            opacity.value = withTiming(0, {
                duration: 300,
                easing: Easing.ease,
            }, (finished) => {
                if (finished && isMounted.current) {
                    runOnJS(onComplete)();
                }
            });
        } catch (error) {
            reportError(error as Error, {
                scope: 'PourAnimation',
                action: 'complete'
            });
            // Ensure onComplete is called even on error
            if (isMounted.current) {
                onComplete();
            }
        }
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
                {/* Blurred background with error boundary */}
                {Platform.OS !== 'web' ? (
                    <BlurView intensity={80} style={styles.blur} tint="dark">
                        <View style={styles.content}>
                            <LottieView
                                ref={animationRef}
                                source={require('@/assets/animations/beer-pour.json')}
                                style={[styles.animation, { 
                                    width: dimensions.width * 0.8,
                                    height: dimensions.height * 0.6,
                                }]}
                                autoPlay={false}
                                loop={false}
                                speed={1.0}
                                resizeMode="contain"
                            />
                        </View>
                    </BlurView>
                ) : (
                    // Fallback for web (no BlurView)
                    <View style={styles.blur}>
                        <View style={styles.content}>
                            <LottieView
                                ref={animationRef}
                                source={require('@/assets/animations/beer-pour.json')}
                                style={[styles.animation, {
                                    width: dimensions.width * 0.8,
                                    height: dimensions.height * 0.6,
                                }]}
                                autoPlay={false}
                                loop={false}
                                speed={1.0}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                )}
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    blur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    animation: {
        // Dimensions set dynamically in render
    },
});
