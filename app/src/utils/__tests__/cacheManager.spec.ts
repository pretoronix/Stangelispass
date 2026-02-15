import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient } from '@/providers/QueryProvider';
import { getAllCacheKeys, clearAllCacheVersions } from '@/utils/cacheManager';
import { reportError } from '@/utils/logger';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiRemove: jest.fn(() => Promise.resolve()),
}));

describe('cacheManager (utils)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('filters cache keys by prefix', async () => {
        (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
            'STANGELISPASS_QUERY_CACHE_1.0.0_v1',
            'STANGELISPASS_QUERY_CACHE_0.9.0_v1',
            'other_key',
        ]);

        const keys = await getAllCacheKeys();

        expect(keys).toHaveLength(2);
        expect(keys.every((key) => key.startsWith('STANGELISPASS_QUERY_CACHE_'))).toBe(true);
    });

    it('clears all cache versions when keys exist', async () => {
        const clearSpy = jest.spyOn(queryClient, 'clear').mockImplementation(() => undefined);
        (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
            'STANGELISPASS_QUERY_CACHE_1.0.0_v1',
            'STANGELISPASS_QUERY_CACHE_0.9.0_v1',
        ]);

        await clearAllCacheVersions();

        expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
            'STANGELISPASS_QUERY_CACHE_1.0.0_v1',
            'STANGELISPASS_QUERY_CACHE_0.9.0_v1',
        ]);
        expect(clearSpy).toHaveBeenCalled();
    });

    it('skips clear when no cache keys exist', async () => {
        const clearSpy = jest.spyOn(queryClient, 'clear').mockImplementation(() => undefined);
        (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);

        await clearAllCacheVersions();

        expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
        expect(clearSpy).not.toHaveBeenCalled();
    });

    it('returns [] and reports when listing keys fails', async () => {
        (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValueOnce('fail');

        const keys = await getAllCacheKeys();

        expect(keys).toEqual([]);
        expect(reportError).toHaveBeenCalled();
    });
});
