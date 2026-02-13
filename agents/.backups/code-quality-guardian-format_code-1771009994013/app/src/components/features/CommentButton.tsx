import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommentCount } from '@/hooks/useCommentsQuery';
import { colors, spacing, typography } from '@/lib/theme';
import { labels } from '@/ui/labels';

interface CommentButtonProps {
    beerId: string;
    onPress: () => void;
    isExpanded?: boolean;
}

/**
 * Button to toggle comments visibility and show comment count
 */
export function CommentButton({ beerId, onPress, isExpanded = false }: CommentButtonProps) {
    const { data: count = 0, isLoading } = useCommentCount(beerId);
    
    return (
        <TouchableOpacity 
            onPress={onPress}
            style={styles.container}
            {...labels.comments.toggleButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <View style={styles.iconContainer}>
                <Ionicons 
                    name={isExpanded ? "chatbubbles" : "chatbubbles-outline"} 
                    size={20} 
                    color={isExpanded ? colors.primary : colors.textSecondary} 
                />
                {count > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
                    </View>
                )}
            </View>
            
            {isLoading && <ActivityIndicator size="small" color={colors.textMuted} style={styles.loader} />}
            
            {!isLoading && count > 0 && (
                <Text style={styles.countText}>
                    {count} {count === 1 ? 'comment' : 'comments'}
                </Text>
            )}
            
            {!isLoading && count === 0 && (
                <Text style={styles.countText}>Comment</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    iconContainer: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -8,
        backgroundColor: colors.primary,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        ...typography.small,
        fontSize: 10,
        color: colors.background,
        fontWeight: '700',
    },
    countText: {
        ...typography.callout,
        fontSize: 14,
        color: colors.textSecondary,
    },
    loader: {
        marginLeft: spacing.xs,
    },
});
