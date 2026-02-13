import { useApp } from '@/providers/AppProvider';

export const useUsers = () => {
    const { users, loading, refreshUsers } = useApp();
    return { users, loading, refreshUsers };
};
