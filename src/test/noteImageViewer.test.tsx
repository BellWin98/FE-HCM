import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import NoteImageViewer from '@/components/knowledge/NoteImageViewer';

const images = Array.from({ length: 5 }, (_, i) => `https://img.test/${i}.jpg`);

// embla-carousel이 jsdom에 없는 IntersectionObserver를 요구한다.
beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
  );
});

// 닫을 때 실제 jsdom history.back() 이 popstate 를 흘려 다른 테스트로 새지 않게 항상 막아 둔다.
beforeEach(() => {
  vi.spyOn(window.history, 'back').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('NoteImageViewer', () => {
  it('startIndex로 열면 해당 위치를 표시한다', () => {
    render(<NoteImageViewer images={images} startIndex={1} open onOpenChange={() => {}} />);
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('다음 버튼과 ArrowRight로 이동한다', () => {
    render(<NoteImageViewer images={images} startIndex={1} open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }));
    expect(screen.getByText('3/5')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowRight' });
    expect(screen.getByText('4/5')).toBeInTheDocument();
  });

  it('닫기 버튼과 Esc로 onOpenChange(false)를 호출한다', () => {
    const onOpenChange = vi.fn();
    render(<NoteImageViewer images={images} startIndex={0} open onOpenChange={onOpenChange} />);
    expect(screen.getAllByRole('button', { name: '닫기' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    onOpenChange.mockClear();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('열릴 때 pushState 1회, popstate면 닫고 back은 호출하지 않는다', () => {
    const push = vi.spyOn(window.history, 'pushState');
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const onOpenChange = vi.fn();
    const { rerender } = render(<NoteImageViewer images={images} startIndex={0} open onOpenChange={onOpenChange} />);
    expect(push).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(<NoteImageViewer images={images} startIndex={0} open={false} onOpenChange={onOpenChange} />);
    expect(back).not.toHaveBeenCalled();
  });

  it('버튼으로 닫히면 history.back을 정확히 한 번 호출한다', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const onOpenChange = vi.fn();
    const { rerender } = render(<NoteImageViewer images={images} startIndex={0} open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    rerender(<NoteImageViewer images={images} startIndex={0} open={false} onOpenChange={onOpenChange} />);
    expect(back).toHaveBeenCalledTimes(1);
  });
});
