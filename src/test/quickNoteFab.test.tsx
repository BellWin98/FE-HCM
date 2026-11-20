import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuickNoteFab } from '@/components/knowledge/QuickNoteFab';

/**
 * 빠른 메모 FAB 는 왼쪽 아래 화면을 가릴 수 있어서, 사용자가 끌어서 원하는 자리로 옮길 수 있다.
 * - 조금 움직인 것(손떨림)은 탭으로 본다.
 * - 끌어서 옮긴 직후의 click 은 메모를 열지 않는다.
 * - 옮긴 자리는 기억해서 다시 그릴 때도 그 자리에 둔다.
 */

const STORAGE_KEY = 'quickNoteFabPosition';

const fab = (): HTMLElement => screen.getByRole('button', { name: '빠른 메모' });

const drag = (el: HTMLElement, from: [number, number], to: [number, number]): void => {
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: from[0], clientY: from[1] });
  fireEvent.pointerMove(el, { pointerId: 1, clientX: to[0], clientY: to[1] });
  fireEvent.pointerUp(el, { pointerId: 1, clientX: to[0], clientY: to[1] });
};

describe('QuickNoteFab 드래그', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  });

  it('끌지 않고 누르면 메모를 연다', () => {
    const onClick = vi.fn();
    render(<QuickNoteFab onClick={onClick} />);

    fireEvent.pointerDown(fab(), { pointerId: 1, button: 0, clientX: 40, clientY: 740 });
    fireEvent.pointerUp(fab(), { pointerId: 1, clientX: 42, clientY: 741 });
    fireEvent.click(fab());

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('끌어서 옮기면 그 자리로 이동하고, 직후의 click 으로는 메모를 열지 않는다', () => {
    const onClick = vi.fn();
    render(<QuickNoteFab onClick={onClick} />);

    // 버튼 왼쪽 위 기준 (0,0) 에서 잡았다고 보면, 잡은 지점과 버튼 모서리의 차이(오프셋)가 유지돼야 한다.
    drag(fab(), [40, 740], [240, 300]);
    fireEvent.click(fab());

    expect(onClick).not.toHaveBeenCalled();
    expect(fab().style.left).not.toBe('');
    expect(fab().style.top).not.toBe('');

    // 다음 탭은 다시 정상적으로 메모를 연다.
    fireEvent.pointerDown(fab(), { pointerId: 1, button: 0, clientX: 240, clientY: 300 });
    fireEvent.pointerUp(fab(), { pointerId: 1, clientX: 240, clientY: 300 });
    fireEvent.click(fab());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('화면 밖으로 끌어도 화면 안에 붙잡아 둔다', () => {
    render(<QuickNoteFab onClick={vi.fn()} />);

    drag(fab(), [40, 740], [-500, -500]);

    expect(parseFloat(fab().style.left)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(fab().style.top)).toBeGreaterThanOrEqual(0);

    drag(fab(), [0, 0], [5000, 5000]);

    expect(parseFloat(fab().style.left)).toBeLessThanOrEqual(400);
    expect(parseFloat(fab().style.top)).toBeLessThanOrEqual(800);
  });

  describe('헤더(sticky z-50) 뒤로 숨지 않게', () => {
    const HEADER_BOTTOM = 64;
    let header: HTMLElement;

    beforeEach(() => {
      header = document.createElement('header');
      header.getBoundingClientRect = () => ({ bottom: HEADER_BOTTOM }) as DOMRect;
      document.body.appendChild(header);
      return () => header.remove();
    });

    it('헤더 위로 끌어 올려도 헤더 아래에 멈춘다', () => {
      render(<QuickNoteFab onClick={vi.fn()} />);

      drag(fab(), [40, 740], [40, 10]);

      expect(parseFloat(fab().style.top)).toBeGreaterThanOrEqual(HEADER_BOTTOM);
    });

    it('예전에 헤더 아래로 저장된 자리는 헤더 밑으로 내려서 그린다', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: 20, top: 10 }));

      render(<QuickNoteFab onClick={vi.fn()} />);

      expect(parseFloat(fab().style.top)).toBeGreaterThanOrEqual(HEADER_BOTTOM);
    });
  });

  it('옮긴 자리를 기억해 다시 그릴 때도 그 자리에 둔다', () => {
    const { unmount } = render(<QuickNoteFab onClick={vi.fn()} />);
    drag(fab(), [40, 740], [240, 300]);
    const { left, top } = fab().style;
    expect(left).not.toBe('');
    unmount();

    render(<QuickNoteFab onClick={vi.fn()} />);

    expect(fab().style.left).toBe(left);
    expect(fab().style.top).toBe(top);
  });

  it('저장된 값이 깨져 있으면 기본 자리에 둔다', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');

    render(<QuickNoteFab onClick={vi.fn()} />);

    expect(fab().style.left).toBe('');
    expect(fab().style.top).toBe('');
  });
});
