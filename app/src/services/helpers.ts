/**
 * Helper utilities for Supabase operations
 */

export const isMissingTableError = (error: any): boolean => {
  return error?.code === "PGRST205" || error?.code === "42P01";
};

export const isMissingColumnError = (error: any): boolean => {
  // Postgres undefined_column
  if (error?.code === "42703") return true;
  const message = String(error?.message || "");
  return message.includes("column") && message.includes("does not exist");
};
