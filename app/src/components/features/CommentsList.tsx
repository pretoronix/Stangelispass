import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useComments, useAddComment, useDeleteComment } from '@/hooks/useCommentsQuery';
import { useRealtimeComments } from '@/hooks/useRealtimeComments';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import type { Comment } from '@/services/types';

interface CommentsListProps {
    beerId: string;
    currentUserId?: string;
    currentUserIsAdmin?: boolean;
}

export function CommentsList({ beerId, currentUserId, currentUserIsAdmin = false }: CommentsListProps) {
    const { data: comments = [], isLoading, error } = useComments(beerId);
    const addCommentMutation = useAddComment();
    const deleteCommentMutation = useDeleteComment();
    
    const [newCommentText, setNewCommentText] = useState('');
    
    // Real-time updates
    useRealtimeComments(beerId, true);
    
    const handleSubmit = useCallback(() => {
        if (!newCommentText.trim() || !currentUserId) return;
        
        const trimmedText = newCommentText.trim();
        
        if (trimmedText.length > 500) {
            Alert.alert('Comment too long', 'Comments must be 500 characters or less.');
            return;
        }
        
        addCommentMutation.mutate(
            {
                beer_id: beerId,
                user_id: currentUserId,
                text: trimmedText,
            },
            {
                onSuccess: () => {
                    setNewCommentText('');
                },
                onError: (error) => {
                    Alert.alert('Error', 'Failed to add comment. Please try again.');
                    console.error('[CommentsList] Error adding comment:', error);
                },
            }
        );
    }, [newCommentText, beerId, currentUserId, addCommentMutation]);
    
    const handleDelete = useCallback((commentId: string, userName: string) => {
        Alert.alert(
            'Delete Comment',
            `Are you sure you want to delete this comment by ${userName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteCommentMutation.mutate(commentId, {
                            onError: (error) => {
                                Alert.alert('Error', 'Failed to delete comment. Please try again.');
                                console.error('[CommentsList] Error deleting comment:', error);
                            },
                        });
                    },
                },
            ]
        );
    }, [deleteCommentMutation]);
    
    const canDeleteComment = useCallback((comment: Comment) => {
        if (!currentUserId) return false;
        return comment.user_id === currentUserId || currentUserIsAdmin;
    }, [currentUserId, currentUserIsAdmin]);
    
    const renderComment = useCallback(({ item }: { item: Comment }) => {
        const isOwnComment = item.user_id === currentUserId;
        const canDelete = canDeleteComment(item);
        
        return (
            <View style={styles.commentItem}>
                <View style={styles.commentHeader}>
                    <View style={styles.commentUserInfo}>
                        <Text style={styles.userName}>
                            {item.user?.name || 'Unknown User'}
                        </Text>
                        {item.user?.is_admin && (
                            <View style={styles.adminBadge}>
                                <Text style={styles.adminBadgeText}>Admin</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.timestamp}>
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </Text>
                </View>
                
                <Text style={styles.commentText}>{item.text}</Text>
                
                {canDelete && (
                    <TouchableOpacity 
                        onPress={() => handleDelete(item.id, item.user?.name || 'this user')}
                        style={styles.deleteButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                )}
            </View>
        );
    }, [currentUserId, canDeleteComment, handleDelete]);
    
    const renderEmpty = useCallback(() => {
        if (isLoading) {
            return (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.emptyText}>Loading comments...</Text>
                </View>
            );
        }
        
        if (error) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
                    <Text style={styles.emptyText}>Failed to load comments</Text>
                </View>
            );
        }
        
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>No comments yet</Text>
                <Text style={styles.emptySubtext}>Be the first to comment!</Text>
            </View>
        );
    }, [isLoading, error]);
    
    const characterCount = newCommentText.length;
    const isNearLimit = characterCount > 400;
    const isOverLimit = characterCount > 500;
    const canSubmit = newCommentText.trim().length > 0 && !isOverLimit && currentUserId;
    
    return (
        <View style={styles.container}>
            <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={renderComment}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
            
            {currentUserId && (
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[
                                styles.input,
                                isOverLimit && styles.inputError,
                            ]}
                            placeholder="Add a comment..."
                            placeholderTextColor={colors.textMuted}
                            value={newCommentText}
                            onChangeText={setNewCommentText}
                            maxLength={550} // Allow slightly over for warning
                            multiline
                            textAlignVertical="top"
                            editable={!addCommentMutation.isPending}
                        />
                        {isNearLimit && (
                            <Text 
                                style={[
                                    styles.characterCount,
                                    isOverLimit && styles.characterCountError,
                                ]}
                            >
                                {characterCount}/500
                            </Text>
                        )}
                    </View>
                    
                    <TouchableOpacity 
                        onPress={handleSubmit}
                        disabled={!canSubmit || addCommentMutation.isPending}
                        style={[
                            styles.sendButton,
                            (!canSubmit || addCommentMutation.isPending) && styles.sendButtonDisabled,
                        ]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        {addCommentMutation.isPending ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Ionicons 
                                name="send" 
                                size={20} 
                                color={canSubmit ? colors.primary : colors.textMuted} 
                            />
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        flexGrow: 1,
    },
    commentItem: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceLight,
        position: 'relative',
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    commentUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    userName: {
        ...typography.headline,
        fontSize: 15,
    },
    adminBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    adminBadgeText: {
        ...typography.small,
        fontSize: 10,
        color: colors.background,
        fontWeight: '600',
    },
    timestamp: {
        ...typography.small,
        color: colors.textMuted,
    },
    commentText: {
        ...typography.body,
        fontSize: 15,
        lineHeight: 20,
    },
    deleteButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        padding: spacing.xs,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxl,
        gap: spacing.sm,
    },
    emptyText: {
        ...typography.callout,
        color: colors.textMuted,
        textAlign: 'center',
    },
    emptySubtext: {
        ...typography.caption,
        color: colors.textMuted,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceLight,
        alignItems: 'flex-end',
        gap: spacing.sm,
        backgroundColor: colors.surface,
    },
    inputWrapper: {
        flex: 1,
        position: 'relative',
    },
    input: {
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        ...typography.body,
        fontSize: 15,
        maxHeight: 100,
        minHeight: 40,
    },
    inputError: {
        borderWidth: 1,
        borderColor: colors.error,
    },
    characterCount: {
        position: 'absolute',
        right: spacing.sm,
        bottom: spacing.xs,
        ...typography.small,
        fontSize: 10,
        color: colors.warning,
    },
    characterCountError: {
        color: colors.error,
        fontWeight: '600',
    },
    sendButton: {
        padding: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
        width: 36,
        height: 36,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
