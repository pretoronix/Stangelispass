import { useState, useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const wasOnlineRef = useRef(true);

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then((state) => {
      const online =
        state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
      wasOnlineRef.current = online;
      onlineManager.setOnline(online);
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online =
        state.isConnected === true && state.isInternetReachable !== false;

      // Detect reconnection
      if (!wasOnlineRef.current && online) {
        setIsReconnecting(true);
        setTimeout(() => setIsReconnecting(false), 3000);
      }

      setIsOnline(online);
      wasOnlineRef.current = online;
      onlineManager.setOnline(online);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, isReconnecting };
}
