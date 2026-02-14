import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '@/services/types';
import { colors } from '@/lib/theme';
import { commentsStyles as styles } from './commentsStyles';

type CommentItemProps = {
    comment: Comment;
    canDelete: boolean;
    onDelete: (commentId: string, userName: string) => void;
};

export function CommentItem({ comment, canDelete, onDelete }: CommentItemProps) {
    return (
        <View style={styles.commentItem}>
            <View style={styles.commentHeader}>
                <View style={styles.commentUserInfo}>
                    <Text style={styles.userName}>
                        {comment.user?.name || 'Unknown User'}
                    </Text>
                    {comment.user?.is_admin && (
                        <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.timestamp}>
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </Text>
            </View>

            <Text style={styles.commentText}>{comment.text}</Text>

            {canDelete && (
                <TouchableOpacity
                    onPress={() => onDelete(comment.id, comment.user?.name || 'this user')}
                    style={styles.deleteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
            )}
        </View>
    );
}
