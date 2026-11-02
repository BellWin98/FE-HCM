import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset';

class FakeVisualViewport extends EventTarget {
  height = 800;
  offsetTop = 0;
}

describe('useVisualViewportInset', () => {
  const originalViewport = window.visualViewport;
  const originalInnerHeight = window.innerHeight;
  let viewport: FakeVisualViewport;

  beforeEach(() => {
    viewport = new FakeVisualViewport();
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  });

  afterEach(() => {
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: originalViewport });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
  });

  it('키보드가 올라오면 가려진 아래 높이와 보이는 높이를 돌려준다', () => {
    const { result } = renderHook(() => useVisualViewportInset(true));
    expect(result.current).toEqual({ bottom: 0, height: 800 });

    act(() => {
      viewport.height = 450;
      viewport.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toEqual({ bottom: 350, height: 450 });
  });

  it('보이는 영역이 위로 밀려 있으면 그만큼 가려진 높이에서 뺀다', () => {
    const { result } = renderHook(() => useVisualViewportInset(true));

    act(() => {
      viewport.height = 450;
      viewport.offsetTop = 100;
      viewport.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toEqual({ bottom: 250, height: 450 });
  });

  it('꺼져 있으면 아무 값도 주지 않는다', () => {
    const { result } = renderHook(() => useVisualViewportInset(false));
    expect(result.current).toEqual({ bottom: 0, height: null });
  });
});
