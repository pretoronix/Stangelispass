import React, { useState, useCallback } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { useComments, useAddComment, useDeleteComment } from '@/hooks/useCommentsQuery';
import { useRealtimeComments } from '@/hooks/useRealtimeComments';
import type { Comment } from '@/services/types';
import { reportError } from '@/utils/logger';
import { CommentItem } from '@/components/features/comments/CommentItem';
import { CommentComposer } from '@/components/features/comments/CommentComposer';
import { CommentsEmptyState } from '@/components/features/comments/CommentsEmptyState';
import { commentsStyles as styles } from '@/components/features/comments/commentsStyles';

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
                    reportError(new Error('[CommentsList] Error adding comment:', error), { scope: 'CommentsList', action: 'replace_console' });
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
                                reportError(new Error('[CommentsList] Error deleting comment:', error), { scope: 'CommentsList', action: 'replace_console' });
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
        const canDelete = canDeleteComment(item);
        return <CommentItem comment={item} canDelete={canDelete} onDelete={handleDelete} />;
    }, [currentUserId, canDeleteComment, handleDelete]);
    
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
                ListEmptyComponent={<CommentsEmptyState isLoading={isLoading} error={error} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
            
            {currentUserId && (
                <CommentComposer
                    value={newCommentText}
                    onChangeText={setNewCommentText}
                    onSubmit={handleSubmit}
                    canSubmit={!!canSubmit}
                    isPending={addCommentMutation.isPending}
                    isNearLimit={isNearLimit}
                    isOverLimit={isOverLimit}
                    characterCount={characterCount}
                />
            )}
        </View>
    );
}
