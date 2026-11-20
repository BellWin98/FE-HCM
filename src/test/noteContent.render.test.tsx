import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NoteContent } from '@/components/knowledge/NoteContent';

const originalClipboard = navigator.clipboard;

const mockClipboard = (writeText: ReturnType<typeof vi.fn>): void => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
};

afterEach(() => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: originalClipboard });
});

describe('NoteContent', () => {
  it('코드블록은 pre>code 로, 글은 줄바꿈을 살려 그린다', () => {
    const { container } = render(<NoteContent content={'설명\n```\n  a\n  b\n```'} />);

    expect(container.querySelector('pre code')?.textContent).toBe('  a\n  b');
    expect(screen.getByText('설명')).toHaveClass('whitespace-pre-wrap');
  });

  it('등록된 언어는 색을 입힌다', () => {
    const { container } = render(<NoteContent content={'```sql\nSELECT 1\n```'} />);

    expect(container.querySelector('.hljs-keyword')).not.toBeNull();
    expect(container.querySelector('pre code')?.textContent).toBe('SELECT 1');
  });

  it('등록되지 않은 언어는 색 없이 그대로 보인다', () => {
    const { container } = render(<NoteContent content={'```kotlin\nfun main() {}\n```'} />);

    expect(container.querySelector('.hljs-keyword')).toBeNull();
    expect(container.querySelector('pre code')?.textContent).toBe('fun main() {}');
  });

  it.each(['js', ''])('코드 안의 HTML 은 실행되지 않고 글자로 보인다 (언어: "%s")', (lang) => {
    const { container } = render(<NoteContent content={`\`\`\`${lang}\n<script>alert(1)</script>\n\`\`\``} />);

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('pre code')?.textContent).toBe('<script>alert(1)</script>');
  });

  it('긴 줄은 코드블록 안에서만 가로 스크롤된다', () => {
    const { container } = render(<NoteContent content={`\`\`\`\n${'x'.repeat(300)}\n\`\`\``} />);

    expect(container.querySelector('pre')).toHaveClass('overflow-x-auto');
    expect(container.firstElementChild).toHaveClass('min-w-0');
  });

  it('코드 복사 버튼은 코드를 복사하고 복사됨을 알린다', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<NoteContent content={'```sql\nSELECT 1\n```'} />);

    await userEvent.click(screen.getByRole('button', { name: '코드 복사' }));

    expect(writeText).toHaveBeenCalledWith('SELECT 1');
    expect(await screen.findByText('복사됨')).toBeInTheDocument();
  });

  it('복사에 실패하면 복사 실패를 알린다', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    render(<NoteContent content={'```\na\n```'} />);

    await userEvent.click(screen.getByRole('button', { name: '코드 복사' }));

    await waitFor(() => expect(screen.getByText('복사 실패')).toBeInTheDocument());
  });
});
