import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWallOfFame, addToast, removeToast, getUserToasts, getToastCount } from '@/services/wallOfFame';
import * as Haptics from 'expo-haptics';
import { reportError } from '@/utils/logger';

export function useWallOfFame() {
  return useQuery({
    queryKey: ['wall-of-fame'],
    queryFn: getWallOfFame,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUserToasts(userId: string | null) {
  return useQuery({
    queryKey: ['user-toasts', userId],
    queryFn: () => (userId ? getUserToasts(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useToastCount(wallId: string) {
  return useQuery({
    queryKey: ['toast-count', wallId],
    queryFn: () => getToastCount(wallId),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useBeerClink(userId: string | null) {
  const queryClient = useQueryClient();

  const toggleToast = useMutation({
    mutationFn: async ({ wallId, isToasted }: { wallId: string; isToasted: boolean }) => {
      if (!userId) throw new Error('User not logged in');
      
      if (isToasted) {
        return removeToast(wallId, userId);
      } else {
        return addToast(wallId, userId);
      }
    },
    onMutate: async ({ wallId, isToasted }) => {
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-toasts', userId] });
      await queryClient.cancelQueries({ queryKey: ['toast-count', wallId] });

      // Snapshot previous values
      const previousToasts = queryClient.getQueryData<string[]>(['user-toasts', userId]);
      const previousCount = queryClient.getQueryData<number>(['toast-count', wallId]);

      // Optimistically update
      if (previousToasts) {
        const newToasts = isToasted
          ? previousToasts.filter(id => id !== wallId)
          : [...previousToasts, wallId];
        queryClient.setQueryData(['user-toasts', userId], newToasts);
      }

      if (typeof previousCount === 'number') {
        const newCount = isToasted ? previousCount - 1 : previousCount + 1;
        queryClient.setQueryData(['toast-count', wallId], Math.max(0, newCount));
      }

      return { previousToasts, previousCount };
    },
    onError: (error, { wallId }, context) => {
      // Revert on error
      if (context?.previousToasts) {
        queryClient.setQueryData(['user-toasts', userId], context.previousToasts);
      }
      if (typeof context?.previousCount === 'number') {
        queryClient.setQueryData(['toast-count', wallId], context.previousCount);
      }

      reportError(error as Error, {
        scope: 'useBeerClink',
        action: 'toggleToast',
        userId: userId || undefined,
      });
    },
    onSettled: (_, __, { wallId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['user-toasts', userId] });
      queryClient.invalidateQueries({ queryKey: ['toast-count', wallId] });
      queryClient.invalidateQueries({ queryKey: ['wall-of-fame'] });
    },
  });

  return {
    toggleToast: toggleToast.mutate,
    isLoading: toggleToast.isPending,
  };
}
