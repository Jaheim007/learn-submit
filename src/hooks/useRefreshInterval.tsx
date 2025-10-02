import { useEffect, useState, useCallback } from 'react';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface UseRefreshIntervalReturn {
  lastRefreshTime: Date;
  refresh: () => void;
}

export function useRefreshInterval(
  onRefresh: () => void | Promise<void>
): UseRefreshIntervalReturn {
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  const refresh = useCallback(async () => {
    await onRefresh();
    setLastRefreshTime(new Date());
  }, [onRefresh]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      refresh();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [refresh]);

  return { lastRefreshTime, refresh };
}
