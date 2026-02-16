import { supabase } from "./client";
import { Comment, CommentInput, CommentUpdate } from "./types";
import { isMissingTableError } from "./helpers";
import { logExpected, reportError } from "@/utils/logger";

/**
 * Comments operations module
 * Handles all comment CRUD operations for beer logs
 */

/**
 * Get all comments for a specific beer
 */
export const getComments = async (beerId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
            *,
            user:users!user_id(id, name, is_admin)
        `,
    )
    .eq("beer_id", beerId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      logExpected(
        "table `comments` not found. Returning empty array.",
        "comments",
      );
      return [];
    }
    throw error;
  }

  return (data as Comment[]) || [];
};

/**
 * Get all comments for beers in a specific event
 */
export const getCommentsByEvent = async (
  eventId: string,
): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
            *,
            user:users!user_id(id, name, is_admin),
            beer:beers!beer_id(id, user_id, event_id)
        `,
    )
    .eq("beer.event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }

  return (data as Comment[]) || [];
};

/**
 * Get comment count for a specific beer
 */
export const getCommentCount = async (beerId: string): Promise<number> => {
  const { count, error } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("beer_id", beerId);

  if (error) {
    if (isMissingTableError(error)) {
      return 0;
    }
    throw error;
  }

  return count || 0;
};

/**
 * Add a new comment to a beer
 */
export const addComment = async (input: CommentInput): Promise<Comment> => {
  // Validate input
  if (!input.beer_id || !input.user_id || !input.text?.trim()) {
    throw new Error("beer_id, user_id, and text are required");
  }

  if (input.text.length > 500) {
    throw new Error("Comment text must be 500 characters or less");
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      beer_id: input.beer_id,
      user_id: input.user_id,
      text: input.text.trim(),
    })
    .select(
      `
            *,
            user:users!user_id(id, name, is_admin)
        `,
    )
    .single();

  if (error) throw error;
  return data as Comment;
};

/**
 * Update an existing comment
 */
export const updateComment = async (
  commentId: string,
  update: CommentUpdate,
): Promise<Comment> => {
  if (!update.text?.trim()) {
    throw new Error("Comment text cannot be empty");
  }

  if (update.text.length > 500) {
    throw new Error("Comment text must be 500 characters or less");
  }

  const { data, error } = await supabase
    .from("comments")
    .update({ text: update.text.trim() })
    .eq("id", commentId)
    .select(
      `
            *,
            user:users!user_id(id, name, is_admin)
        `,
    )
    .single();

  if (error) throw error;
  return data as Comment;
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
};
