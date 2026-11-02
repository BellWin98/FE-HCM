import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import NoteImageStrip from '@/components/knowledge/NoteImageStrip';

const urls = (n: number): string[] => Array.from({ length: n }, (_, i) => `https://img.test/${i}.jpg`);

describe('NoteImageStrip', () => {
  it('3장이면 썸네일 버튼 3개를 보여준다', () => {
    render(<NoteImageStrip images={urls(3)} onOpen={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: '이미지 2/3 크게 보기' })).toBeInTheDocument();
  });

  it('5장이면 버튼 4개, 마지막은 +2이고 누르면 onOpen(3)', () => {
    const onOpen = vi.fn();
    render(<NoteImageStrip images={urls(5)} onOpen={onOpen} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    expect(buttons[3]).toHaveTextContent('+2');
    fireEvent.click(buttons[3]);
    expect(onOpen).toHaveBeenCalledWith(3);
  });

  it('클릭이 부모로 전파되지 않는다', () => {
    const onParentClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <NoteImageStrip images={urls(2)} onOpen={() => {}} />
      </div>
    );
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('0장이면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<NoteImageStrip images={[]} onOpen={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
