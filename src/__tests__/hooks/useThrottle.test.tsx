import { jest } from '@jest/globals'; 
import { renderHook, act } from '@testing-library/react';
import { useThrottle } from '@/hooks/useThrottle';

describe('useThrottle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('应该立即执行第一次调用', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useThrottle(callback, 1000));

    act(() => {
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('应该在延迟时间内节流调用', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useThrottle(callback, 1000));

    // 第一次调用
    act(() => {
      result.current();
    });

    // 立即进行第二次调用
    act(() => {
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    // 快进1000ms
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('应该只执行最后一次延迟调用', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useThrottle(callback, 1000));

    // 第一次调用
    act(() => {
      result.current();
    });

    // 多次快速调用
    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    // 快进1000ms
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('应该在组件卸载时清理定时器', () => {
    const callback = jest.fn();
    const { result, unmount } = renderHook(() => useThrottle(callback, 1000));

    act(() => {
      result.current();
      result.current(); // 这个会被节流
    });

    unmount();

    // 快进1000ms
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
}); 