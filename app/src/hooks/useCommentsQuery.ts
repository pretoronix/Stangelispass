import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getComments,
  getCommentCount,
  addComment,
  updateComment,
  deleteComment,
} from "@/services/comments";
import type { CommentInput, CommentUpdate } from "@/services/types";

/**
 * React Query hooks for comments operations
 * Follows the same patterns as useBeersQuery.ts with optimistic updates
 */

export const COMMENT_QUERY_KEYS = {
  all: ["comments"] as const,
  byBeer: (beerId: string) => ["comments", beerId] as const,
  count: (beerId: string) => ["comments", "count", beerId] as const,
};

/**
 * Hook to fetch comments for a specific beer
 */
export function useComments(beerId: string, enabled = true) {
  return useQuery({
    queryKey: COMMENT_QUERY_KEYS.byBeer(beerId),
    queryFn: () => getComments(beerId),
    enabled: enabled && !!beerId,
    staleTime: 10 * 1000, // Comments are relatively fresh for 10 seconds
  });
}

/**
 * Hook to fetch comment count for a specific beer
 */
export function useCommentCount(beerId: string, enabled = true) {
  return useQuery({
    queryKey: COMMENT_QUERY_KEYS.count(beerId),
    queryFn: () => getCommentCount(beerId),
    enabled: enabled && !!beerId,
    staleTime: 30 * 1000, // Count changes less frequently
  });
}

/**
 * Mutation hook to add a new comment with optimistic updates
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CommentInput) => addComment(input),

    // Optimistic update
    onMutate: async (input) => {
      const queryKey = COMMENT_QUERY_KEYS.byBeer(input.beer_id);
      const countKey = COMMENT_QUERY_KEYS.count(input.beer_id);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: countKey });

      // Snapshot previous values
      const previousComments = queryClient.getQueryData(queryKey);
      const previousCount = queryClient.getQueryData(countKey);

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

      // Optimistically update count
      queryClient.setQueryData<number>(countKey, (old = 0) => old + 1);

      return { previousComments, previousCount };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          COMMENT_QUERY_KEYS.byBeer(variables.beer_id),
          context.previousComments,
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          COMMENT_QUERY_KEYS.count(variables.beer_id),
          context.previousCount,
        );
      }
    },

    onSuccess: (data, variables) => {
      // Invalidate to get real data with user info
      queryClient.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.byBeer(variables.beer_id),
      });
      queryClient.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.count(variables.beer_id),
      });
    },
  });
}

/**
 * Mutation hook to update an existing comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      update,
    }: {
      commentId: string;
      update: CommentUpdate;
    }) => updateComment(commentId, update),

    onSuccess: () => {
      // Invalidate all comment queries (we don't know which beer without fetching)
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.all });
    },
  });
}

/**
 * Mutation hook to delete a comment with optimistic updates
 */
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
        queryKey: COMMENT_QUERY_KEYS.all,
      });

      // Optimistically remove from all lists
      queryClient.setQueriesData<any[]>(
        { queryKey: COMMENT_QUERY_KEYS.all },
        (old = []) => old.filter((comment: any) => comment.id !== commentId),
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
