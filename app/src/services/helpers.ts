/**
 * Helper utilities for Supabase operations
 */

export const isMissingTableError = (error: any): boolean => {
  return error?.code === "PGRST205" || error?.code === "42P01";
};
