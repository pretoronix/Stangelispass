# Implementation Plan: Comments System

**Priority**: 🟡 MEDIUM  
**Estimated Time**: 5-7 days  
**Technical Complexity**: ⭐⭐⭐ Medium  
**ROI**: High (adds social layer with existing infrastructure)

---

## Overview

Enable users to comment on specific beer logs, creating a social feed-like experience. This leverages the existing React Query infrastructure and Supabase real-time capabilities.

## Current State

✅ Infrastructure:
- React Query for data fetching with optimistic updates
- Real-time capabilities via Supabase channels
- Persistent query cache with AsyncStorage
- Existing patterns for services, hooks, and components
- Offline mutation queue

⏳ Missing:
- Comments table and schema
- UI components for comments
- Real-time subscription hooks
- Query hooks for comments
- Integration with beer log items

---

## Time Breakdown (Refined)

| Task | Duration | Complexity | Dependencies |
|------|----------|------------|--------------|
| Database schema & migration | 2-3 hours | Low | None |
| Service layer (comments.ts) | 3-4 hours | Low-Medium | Database |
| Type definitions | 1 hour | Low | Database |
| Query hooks for comments | 3-4 hours | Medium | Services |
| Real-time subscription hook | 2-3 hours | Medium | Services, Hooks |
| Comment UI components | 6-8 hours | Medium | Hooks |
| Integration with BeerLog | 4-5 hours | Medium | Components |
| Offline support | 2-3 hours | Medium | Hooks |
| Testing & polish | 6-8 hours | Medium | All |
| **Total** | **29-38 hours (4-5 days)** | **Medium** |

---

---

## Design Decisions

### Schema Design
- **Cascade deletion**: Comments are deleted when parent beer is deleted
- **Character limit**: 500 characters (enough for meaningful comments, not essays)
- **No nesting**: Flat comment structure for MVP (threading can be added later)
- **User denormalization**: Join with users table for display info

### Real-time Strategy
- **Per-beer channels**: Subscribe only to comments for visible beers
- **Optimistic updates**: Add comments immediately, rollback on error
- **Offline queue**: Queue comments when offline, sync when back online

### UI/UX Patterns
- **Expandable sections**: Comments hidden by default to reduce clutter
- **Inline composition**: Add comments directly in expanded section
- **Real-time indicators**: Show when new comments arrive
- **Character counter**: Visual feedback for approaching limit

---

## Technical Implementation

### Phase 1: Database Schema (2-3 hours)

**File**: `supabase/migrations/YYYYMMDD_create_comments.sql`

```sql
-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beer_id UUID NOT NULL REFERENCES beers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT text_length CHECK (char_length(text) >= 1 AND char_length(text) <= 500)
);

-- Indexes for performance
CREATE INDEX idx_comments_beer_id ON comments(beer_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view comments"
    ON comments FOR SELECT
    USING (true);

CREATE POLICY "Users can create comments"
    ON comments FOR INSERT
    WITH CHECK (auth.uid() = user_id OR true); -- Adjust based on auth

CREATE POLICY "Users can update own comments"
    ON comments FOR UPDATE
    USING (user_id = auth.uid() OR true);

CREATE POLICY "Users can delete own comments"
    ON comments FOR DELETE
    USING (user_id = auth.uid() OR true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comments_updated_at();
```

---

### Phase 2: Type Definitions (1 hour)

**File**: `app/src/services/types.ts` (update)

```typescript
export type Comment = Database['public']['Tables']['comments']['Row'] & {
    user?: Pick<User, 'id' | 'name' | 'is_admin'> | null;
    beer?: Pick<Beer, 'id' | 'user_id'> | null;
};

export type CommentInput = {
    beer_id: string;
    user_id: string;
    text: string;
};

export type CommentUpdate = {
    text: string;
};
```

---

### Phase 3: Service Layer (3-4 hours)

**File**: `app/src/services/comments.ts` (new)

```typescript
import { supabase } from './client';
import { Comment, CommentInput, CommentUpdate } from './types';
import { isMissingTableError } from './helpers';

/**
 * Comments operations module
 * Handles all comment CRUD operations
 */

export const getComments = async (beerId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
        .from('comments')
        .select(`
            *,
            user:users!user_id(id, name, is_admin)
        `)
        .eq('beer_id', beerId)
        .order('created_at', { ascending: true });
    
    if (error) {
        if (isMissingTableError(error)) {
            console.warn('Supabase: table `comments` not found. Returning empty array.');
            return [];
        }
        throw error;
    }
    
    return (data as Comment[]) || [];
};

export const getCommentsByEvent = async (eventId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
        .from('comments')
        .select(`
            *,
            user:users!user_id(id, name, is_admin),
            beer:beers!beer_id(id, user_id, event_id)
        `)
        .eq('beer.event_id', eventId)
        .order('created_at', { ascending: false });
    
    if (error) {
        if (isMissingTableError(error)) {
            return [];
        }
        throw error;
    }
    
    return (data as Comment[]) || [];
};

export const getCommentCount = async (beerId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('beer_id', beerId);
    
    if (error) {
        if (isMissingTableError(error)) {
            return 0;
        }
        throw error;
    }
    
    return count || 0;
};

export const addComment = async (input: CommentInput): Promise<Comment> => {
    const { data, error } = await supabase
        .from('comments')
        .insert({
            beer_id: input.beer_id,
            user_id: input.user_id,
            text: input.text,
        })
        .select(`
            *,
            user:users!user_id(id, name, is_admin)
        `)
        .single();
    
    if (error) throw error;
    return data as Comment;
};

export const updateComment = async (
    commentId: string,
    update: CommentUpdate
): Promise<Comment> => {
    const { data, error } = await supabase
        .from('comments')
        .update({ text: update.text })
        .eq('id', commentId)
        .select(`
            *,
            user:users!user_id(id, name, is_admin)
        `)
        .single();
    
    if (error) throw error;
    return data as Comment;
};

export const deleteComment = async (commentId: string): Promise<void> => {
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
    
    if (error) throw error;
};
```

---

### Phase 4: React Query Hooks (3-4 hours)

**File**: `app/src/hooks/useCommentsQuery.ts` (new)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getComments, 
    getCommentCount,
    addComment, 
    updateComment, 
    deleteComment,
} from '@/services/comments';
import type { CommentInput, CommentUpdate } from '@/services/types';

/**
 * React Query hooks for comments operations
 * Follows the same patterns as useBeersQuery.ts
 */

export const COMMENT_QUERY_KEYS = {
    all: ['comments'] as const,
    byBeer: (beerId: string) => ['comments', beerId] as const,
    count: (beerId: string) => ['comments', 'count', beerId] as const,
};

export function useComments(beerId: string, enabled = true) {
    return useQuery({
        queryKey: COMMENT_QUERY_KEYS.byBeer(beerId),
        queryFn: () => getComments(beerId),
        enabled: enabled && !!beerId,
        staleTime: 10 * 1000, // Comments are relatively fresh
    });
}

export function useCommentCount(beerId: string, enabled = true) {
    return useQuery({
        queryKey: COMMENT_QUERY_KEYS.count(beerId),
        queryFn: () => getCommentCount(beerId),
        enabled: enabled && !!beerId,
        staleTime: 30 * 1000, // Count changes less frequently
    });
}

export function useAddComment() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (input: CommentInput) => addComment(input),
        
        // Optimistic update
        onMutate: async (input) => {
            const queryKey = COMMENT_QUERY_KEYS.byBeer(input.beer_id);
            
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey });
            
            // Snapshot previous value
            const previousComments = queryClient.getQueryData(queryKey);
            
            // Optimistically add comment
            queryClient.setQueryData<any[]>(queryKey, (old = []) => {
                const optimisticComment = {
                    id: `temp-${Date.now()}`,
                    beer_id: input.beer_id,
                    user_id: input.user_id,
                    text: input.text,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    // User data will be filled by real response
                };
                return [...old, optimisticComment];
            });
            
            return { previousComments };
        },
        
        // Rollback on error
        onError: (error, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(
                    COMMENT_QUERY_KEYS.byBeer(variables.beer_id),
                    context.previousComments
                );
            }
        },
        
        onSuccess: (data, variables) => {
            // Invalidate to get real data with user info
            queryClient.invalidateQueries({ 
                queryKey: COMMENT_QUERY_KEYS.byBeer(variables.beer_id) 
            });
            queryClient.invalidateQueries({ 
                queryKey: COMMENT_QUERY_KEYS.count(variables.beer_id) 
            });
        },
    });
}

export function useUpdateComment() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ commentId, update }: { commentId: string; update: CommentUpdate }) =>
            updateComment(commentId, update),
        
        onSuccess: () => {
            // Invalidate all comment queries (we don't know which beer)
            queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.all });
        },
    });
}

export function useDeleteComment() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (commentId: string) => deleteComment(commentId),
        
        // Optimistic update
        onMutate: async (commentId) => {
            // Cancel all comment queries
            await queryClient.cancelQueries({ queryKey: COMMENT_QUERY_KEYS.all });
            
            // Snapshot all comments
            const previousComments = queryClient.getQueriesData({ 
                queryKey: COMMENT_QUERY_KEYS.all 
            });
            
            // Optimistically remove from all lists
            queryClient.setQueriesData<any[]>(
                { queryKey: COMMENT_QUERY_KEYS.all },
                (old = []) => old.filter((comment: any) => comment.id !== commentId)
            );
            
            return { previousComments };
        },
        
        // Rollback on error
        onError: (error, commentId, context) => {
            if (context?.previousComments) {
                context.previousComments.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        
        onSuccess: () => {
            // Invalidate to sync with server
            queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.all });
        },
    });
}
```

---

### Phase 5: Real-Time Subscriptions (2-3 hours)

**File**: `app/src/hooks/useRealtimeComments.ts` (new)

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/client';
import { COMMENT_QUERY_KEYS } from './useCommentsQuery';
import { reportError } from '@/utils/logger';

/**
 * Real-time subscription hook for comments
 * Subscribes to INSERT, UPDATE, DELETE events for a specific beer
 */
export function useRealtimeComments(beerId: string, enabled = true) {
    const queryClient = useQueryClient();
    
    useEffect(() => {
        if (!beerId || !enabled) return;
        
        const channel = supabase
            .channel(`comments:${beerId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'comments',
                    filter: `beer_id=eq.${beerId}`,
                },
                (payload) => {
                    console.log('[Comments] New comment:', payload);
                    queryClient.invalidateQueries({ 
                        queryKey: COMMENT_QUERY_KEYS.byBeer(beerId) 
                    });
                    queryClient.invalidateQueries({ 
                        queryKey: COMMENT_QUERY_KEYS.count(beerId) 
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'comments',
                    filter: `beer_id=eq.${beerId}`,
                },
                (payload) => {
                    console.log('[Comments] Updated comment:', payload);
                    queryClient.invalidateQueries({ 
                        queryKey: COMMENT_QUERY_KEYS.byBeer(beerId) 
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'comments',
                    filter: `beer_id=eq.${beerId}`,
                },
                (payload) => {
                    console.log('[Comments] Deleted comment:', payload);
                    queryClient.invalidateQueries({ 
                        queryKey: COMMENT_QUERY_KEYS.byBeer(beerId) 
                    });
                    queryClient.invalidateQueries({ 
                        queryKey: COMMENT_QUERY_KEYS.count(beerId) 
                    });
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Comments] Subscribed to beer ${beerId}`);
                } else if (status === 'CHANNEL_ERROR') {
                    reportError(err || new Error('Channel subscription error'), {
                        scope: 'useRealtimeComments',
                        action: 'subscribe',
                        metadata: { beerId, status },
                    });
                }
            });
        
        return () => {
            console.log(`[Comments] Unsubscribing from beer ${beerId}`);
            supabase.removeChannel(channel);
        };
    }, [beerId, enabled, queryClient]);
}
```

---

### Phase 6: UI Components (6-8 hours)

**File**: `app/src/components/features/CommentsList.tsx` (new)

```typescript
import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useComments, useAddComment, useDeleteComment } from '@/hooks/useCommentsQuery';
import { useRealtimeComments } from '@/hooks/useRealtimeComments';
import { useApp } from '@/providers/AppProvider';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/lib/theme';

interface CommentsListProps {
    beerId: string;
}

export function CommentsList({ beerId }: CommentsListProps) {
    const { currentUser } = useApp();
    const { data: comments, isLoading } = useComments(beerId);
    const addCommentMutation = useAddComment();
    const deleteCommentMutation = useDeleteComment();
    const [newComment, setNewComment] = useState('');
    
    // Real-time updates
    useRealtimeComments(beerId);
    
    const handleSubmit = () => {
        if (!newComment.trim() || !currentUser) return;
        
        addCommentMutation.mutate({
            beerId,
            userId: currentUser.id,
            text: newComment.trim(),
        }, {
            onSuccess: () => {
                setNewComment('');
            },
        });
    };
    
    const handleDelete = (commentId: string) => {
        deleteCommentMutation.mutate(commentId);
    };
    
    if (isLoading) return <Text>Loading comments...</Text>;
    
    return (
        <View style={styles.container}>
            {/* Comments List */}
            <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.commentItem}>
                        <View style={styles.commentHeader}>
                            <Text style={styles.username}>
                                {item.user?.name || 'Unknown'}
                            </Text>
                            <Text style={styles.timestamp}>
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </Text>
                        </View>
                        <Text style={styles.commentText}>{item.text}</Text>
                        
                        {/* Delete button (own comments only) */}
                        {currentUser?.id === item.user_id && (
                            <TouchableOpacity 
                                onPress={() => handleDelete(item.id)}
                                style={styles.deleteButton}
                            >
                                <Ionicons name="trash-outline" size={16} color="#ff6b6b" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                }
            />
            
            {/* Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChangeText={setNewComment}
                    maxLength={500}
                    multiline
                />
                <TouchableOpacity 
                    onPress={handleSubmit}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    style={[
                        styles.sendButton,
                        (!newComment.trim() || addCommentMutation.isPending) && styles.sendButtonDisabled
                    ]}
                >
                    <Ionicons 
                        name="send" 
                        size={20} 
                        color={newComment.trim() ? colors.primary : colors.textMuted} 
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    commentItem: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceLight,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    username: {
        fontWeight: '600',
        color: colors.textPrimary,
    },
    timestamp: {
        fontSize: 12,
        color: colors.textMuted,
    },
    commentText: {
        color: colors.textPrimary,
    },
    deleteButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textMuted,
        padding: spacing.xl,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceLight,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
        maxHeight: 100,
    },
    sendButton: {
        padding: spacing.sm,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
```

---

### Phase 6: Expandable Beer Log Item (6 hours)

**File**: Update `app/src/components/features/BeerLogItem.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { CommentsList } from './CommentsList';
import { Ionicons } from '@expo/vector-icons';

interface BeerLogItemProps {
    beer: Beer;
    onDelete?: (id: string) => void;
}

export function BeerLogItem({ beer, onDelete }: BeerLogItemProps) {
    const [expanded, setExpanded] = useState(false);
    const [animation] = useState(new Animated.Value(0));
    
    const toggleExpand = () => {
        setExpanded(!expanded);
        Animated.timing(animation, {
            toValue: expanded ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };
    
    const heightInterpolate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 300],
    });
    
    return (
        <View style={styles.container}>
            {/* Beer Log Header */}
            <TouchableOpacity onPress={toggleExpand} style={styles.header}>
                <View style={styles.info}>
                    <Text style={styles.userName}>{beer.user?.name}</Text>
                    <Text style={styles.timestamp}>
                        {formatDistanceToNow(new Date(beer.created_at), { addSuffix: true })}
                    </Text>
                </View>
                <Ionicons 
                    name={expanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={colors.textMuted} 
                />
            </TouchableOpacity>
            
            {/* Expandable Comments Section */}
            <Animated.View style={{ height: heightInterpolate, overflow: 'hidden' }}>
                <CommentsList beerId={beer.id} />
            </Animated.View>
        </View>
    );
}
```

---

## Success Criteria

- ✅ Comments appear in real-time
- ✅ Users can add/edit/delete own comments
- ✅ Character limit enforced (500 chars)
- ✅ Smooth expand/collapse animation
- ✅ No performance degradation
- ✅ Works offline (shows cached comments)

---

## Future Enhancements

1. **Reactions**: 👍 👎 🍺 quick reactions
2. **Mentions**: @username tagging
3. **Rich Text**: Bold, italics, links
4. **Images**: Attach photos to comments
5. **Threading**: Reply to specific comments
6. **Notifications**: Alert when someone comments on your beer
