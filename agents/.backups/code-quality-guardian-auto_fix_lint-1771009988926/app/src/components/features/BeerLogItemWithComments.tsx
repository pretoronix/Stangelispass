import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { CommentButton } from './CommentButton';
import { CommentsList } from './CommentsList';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import type { Beer } from '@/services/types';

interface BeerLogItemWithCommentsProps {
    beer: Beer;
    currentUserId?: string;
    currentUserIsAdmin?: boolean;
    onDelete?: (beerId: string) => void;
}

/**
 * Example component showing a beer log item with expandable comments section
 * This demonstrates the integration pattern for the comments system
 */
export function BeerLogItemWithComments({ 
    beer, 
    currentUserId, 
    currentUserIsAdmin = false,
    onDelete 
}: BeerLogItemWithCommentsProps) {
    const [commentsExpanded, setCommentsExpanded] = useState(false);
    const [animation] = useState(new Animated.Value(0));
    
    const toggleComments = () => {
        const toValue = commentsExpanded ? 0 : 1;
        setCommentsExpanded(!commentsExpanded);
        
        Animated.spring(animation, {
            toValue,
            useNativeDriver: false,
            damping: 20,
            stiffness: 200,
        }).start();
    };
    
    const heightInterpolate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 400], // Max height for comments section
    });
    
    const rotateInterpolate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });
    
    const isOptimistic = beer.id.startsWith('temp-');
    const canDelete = currentUserId && (beer.user_id === currentUserId || currentUserIsAdmin);
    
    return (
        <View style={[styles.container, isOptimistic && styles.containerOptimistic]}>
            {/* Beer Log Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons name="beer" size={24} color={colors.beerAmber} />
                    <View style={styles.headerInfo}>
                        <Text style={styles.userName}>
                            {beer.user?.name || 'Unknown User'}
                        </Text>
                        <Text style={styles.timestamp}>
                            {formatDistanceToNow(new Date(beer.created_at), { addSuffix: true })}
                        </Text>
                    </View>
                </View>
                
                {canDelete && !isOptimistic && (
                    <TouchableOpacity 
                        onPress={() => onDelete?.(beer.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                )}
            </View>
            
            {/* Comments Button */}
            <CommentButton 
                beerId={beer.id}
                onPress={toggleComments}
                isExpanded={commentsExpanded}
            />
            
            {/* Expandable Comments Section */}
            <Animated.View style={{ height: heightInterpolate, overflow: 'hidden' }}>
                <View style={styles.commentsContainer}>
                    <CommentsList 
                        beerId={beer.id}
                        currentUserId={currentUserId}
                        currentUserIsAdmin={currentUserIsAdmin}
                    />
                </View>
            </Animated.View>
            
            {/* Optimistic Indicator */}
            {isOptimistic && (
                <View style={styles.optimisticIndicator}>
                    <Text style={styles.optimisticText}>⏳ Saving...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    containerOptimistic: {
        opacity: 0.7,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceLight,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },
    headerInfo: {
        flex: 1,
    },
    userName: {
        ...typography.headline,
        fontSize: 16,
    },
    timestamp: {
        ...typography.caption,
        fontSize: 13,
        color: colors.textMuted,
    },
    commentsContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    optimisticIndicator: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        backgroundColor: colors.surfaceLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    optimisticText: {
        ...typography.small,
        color: colors.success,
        fontStyle: 'italic',
    },
});
