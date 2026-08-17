import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import {
  getCacheStats,
  clearCache,
  type CacheStats,
} from "@/utils/cacheManager";
import { copy } from "@/ui/copy";

export const useCacheManagement = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);

  useEffect(() => {
    getCacheStats().then(setCacheStats);
  }, []);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      copy.settings.alerts.clearCacheTitle,
      copy.settings.alerts.clearCacheHint,
      [
        { text: copy.common.cancel, style: "cancel" },
        {
          text: copy.common.clear,
          style: "destructive",
          onPress: async () => {
            try {
              await clearCache();
              const stats = await getCacheStats();
              setCacheStats(stats);
              Alert.alert(copy.common.success, copy.settings.alerts.cacheCleared);
            } catch (error) {
              Alert.alert(copy.common.error, copy.settings.alerts.cacheClearFailed);
            }
          },
        },
      ],
    );
  }, []);

  return {
    cacheStats,
    handleClearCache,
  };
};
