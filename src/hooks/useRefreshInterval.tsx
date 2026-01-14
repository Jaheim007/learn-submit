import { useState, useCallback } from 'react';

interface UseRefreshIntervalReturn {
  lastRefreshTime: Date;
  refresh: () => void;
}

/**
 * Hook for manual refresh functionality.
 * No automatic refresh - users can click the refresh button when needed.
 */
export function useRefreshInterval(
  onRefresh: () => void | Promise<void>
): UseRefreshIntervalReturn {
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  const refresh = useCallback(async () => {
    await onRefresh();
    setLastRefreshTime(new Date());
  }, [onRefresh]);

  return { lastRefreshTime, refresh };
}
