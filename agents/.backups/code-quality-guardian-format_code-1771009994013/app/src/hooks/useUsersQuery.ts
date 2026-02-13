import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, addUser, updateUser, User } from '@/services/users';

/**
 * React Query hooks for user operations
 */

export const QUERY_KEYS = {
    users: ['users'] as const,
    user: (id: string) => ['users', id] as const,
};

export function useUsers() {
    return useQuery({
        queryKey: QUERY_KEYS.users,
        queryFn: getUsers,
        staleTime: 30 * 1000, // Consider data fresh for 30s
    });
}

export function useAddUser() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ name, isAdmin }: { name: string; isAdmin?: boolean }) =>
            addUser(name, isAdmin),
        onSuccess: () => {
            // Invalidate and refetch users
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ userId, updates }: { userId: string; updates: Partial<User> }) =>
            updateUser(userId, updates),
        onSuccess: (data, variables) => {
            // Invalidate user list
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
            // Invalidate specific user
            if (variables.userId) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(variables.userId) });
            }
        },
    });
}
