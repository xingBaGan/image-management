import { useCallback, useRef, useEffect } from 'react';

export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(0);
  const timeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (lastRun.current && now < lastRun.current + delay) {
      // 如果在节流时间内，取消之前的延迟执行
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      
      // 设置一个新的延迟执行
      timeout.current = setTimeout(() => {
        lastRun.current = now;
        callback(...args);
      }, delay);
      return;
    }

    lastRun.current = now;
    callback(...args);
  }, [callback, delay]) as T;
} 