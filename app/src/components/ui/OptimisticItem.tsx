import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * OptimisticItem component
 * Provides visual feedback for items that are being optimistically updated
 */

interface OptimisticItemProps {
    children: React.ReactNode;
    isOptimistic?: boolean;
    style?: any;
}

export function OptimisticItem({ children, isOptimistic = false, style }: OptimisticItemProps) {
    const opacity = useRef(new Animated.Value(1)).current;
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);
    
    useEffect(() => {
        if (isOptimistic) {
            // Pulse animation
            animationRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 0.6,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            );
            animationRef.current.start();
        } else {
            // Stop animation and reset opacity
            if (animationRef.current) {
                animationRef.current.stop();
            }
            opacity.setValue(1);
        }
        
        return () => {
            if (animationRef.current) {
                animationRef.current.stop();
            }
        };
    }, [isOptimistic, opacity]);
    
    return (
        <Animated.View 
            style={[
                style,
                isOptimistic && styles.optimistic,
                { opacity }
            ]}
        >
            {children}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    optimistic: {
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
});
