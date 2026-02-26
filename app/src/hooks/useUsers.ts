import { useApp } from "@/providers/AppProvider";

/**
 * @deprecated Use React Query hooks from `useUsersQuery`.
 * This hook remains for backward compatibility only.
 */
export const useUsers = () => {
  const { users, loading, refreshUsers } = useApp();
  return { users, loading, refreshUsers };
};
