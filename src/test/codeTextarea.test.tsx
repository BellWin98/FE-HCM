import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Member } from '@/types';
import type { KnowledgeNote } from '@/types/knowledgeNote';
import { compressImage } from '@/lib/compressImage';

vi.mock('@/lib/api', () => ({
  api: {
    getKnowledgeAccess: vi.fn(),
    createKnowledgeNote: vi.fn(),
    updateKnowledgeNote: vi.fn(),
    uploadKnowledgeNoteImages: vi.fn(),
    searchTossStocks: vi.fn(),
  },
}));

vi.mock('@/lib/compressImage', () => ({ compressImage: vi.fn(async (file: File) => file) }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { api } = await import('@/lib/api');
const { toast } = await import('sonner');
const { AuthProvider } = await import('@/contexts/AuthContext');
const { QuickNoteProvider, useQuickNote } = await import('@/contexts/QuickNoteContext');
const { KNOWLEDGE_NOTES_QUERY_KEY } = await import('@/hooks/useKnowledgeAccess');

const CONTEXT_KEY = 'hcm.knowledgeNote.lastContext';

const signIn = () => {
  const member: Member = {
    id: 1,
    email: 'admin@example.com',
    nickname: 'admin',
    profileUrl: '',
    totalWorkoutDays: 0,
    totalPenalty: 0,
    createdAt: '2026-01-01T00:00:00',
    role: 'ADMIN',
  };
  localStorage.setItem('member', JSON.stringify(member));
  localStorage.setItem('accessToken', 'token');
};

const savedNote: KnowledgeNote = {
  id: 9,
  category: 'DEV',
  title: null,
  content: '저장됨',
  images: [],
  sourceUrl: null,
  sourceText: '책',
  tags: [],
  stockSymbol: null,
  stockName: null,
  createdAt: '2026-11-02T00:00:00',
  updatedAt: null,
  visibility: 'PUBLIC',
  author: { id: 1, nickname: 'user', profileUrl: null },
  editable: true,
};

const OpenButton = ({ options }: { options?: Parameters<ReturnType<typeof useQuickNote>['openQuickNote']>[0] }) => {
  const { openQuickNote } = useQuickNote();
  return <button onClick={() => openQuickNote(options)}>열기</button>;
};

const renderDialog = (options?: Parameters<ReturnType<typeof useQuickNote>['openQuickNote']>[0]) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const view = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          <QuickNoteProvider>
            <OpenButton options={options} />
          </QuickNoteProvider>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
  return { ...view, invalidate };
};

const open = async (options?: Parameters<typeof renderDialog>[0]) => {
  const view = renderDialog(options);
  await userEvent.click(await screen.findByRole('button', { name: '열기' }));
  return view;
};

beforeEach(() => {
  localStorage.clear();
  signIn();
  vi.mocked(api.getKnowledgeAccess).mockReset().mockResolvedValue({ hasAccess: true, canRead: true, canWrite: true, isAdmin: false });
  vi.mocked(api.createKnowledgeNote).mockReset().mockResolvedValue(savedNote);
  vi.mocked(api.updateKnowledgeNote).mockReset().mockResolvedValue(savedNote);
  vi.mocked(api.uploadKnowledgeNoteImages)
    .mockReset()
    .mockImplementation(async (files: File[]) => files.map((file) => `https://cdn/${file.name}`));
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
  let previewCount = 0;
  URL.createObjectURL = vi.fn(() => `blob:preview-${++previewCount}`);
  URL.revokeObjectURL = vi.fn();
});


const contentBox = async (): Promise<HTMLTextAreaElement> => {
  await open();
  const textarea = (await screen.findByRole('textbox', { name: '내용' })) as HTMLTextAreaElement;
  await waitFor(() => expect(textarea).toHaveFocus());
  return textarea;
};

const setValue = (textarea: HTMLTextAreaElement, value: string, start = value.length, end = start): void => {
  fireEvent.change(textarea, { target: { value } });
  textarea.setSelectionRange(start, end);
};

const lineBreak = (textarea: HTMLTextAreaElement, init: Partial<InputEventInit> = {}): InputEvent => {
  const event = new InputEvent('beforeinput', {
    inputType: 'insertLineBreak',
    bubbles: true,
    cancelable: true,
    ...init,
  });
  fireEvent(textarea, event);
  return event;
};

describe('메모 내용 칸 코드 편집', () => {
  it('Enter 는 윗줄 들여쓰기를 이어 간다', async () => {
    const textarea = await contentBox();
    setValue(textarea, '  a');

    const event = lineBreak(textarea);

    expect(event.defaultPrevented).toBe(true);
    expect(textarea.value).toBe('  a\n  ');
  });

  it('insertParagraph 도 같은 줄바꿈으로 처리한다', async () => {
    const textarea = await contentBox();
    setValue(textarea, 'if (a) {');

    lineBreak(textarea, { inputType: 'insertParagraph' });

    expect(textarea.value).toBe('if (a) {\n  ');
  });

  it('한글 조합 중의 Enter 는 건드리지 않는다', async () => {
    const textarea = await contentBox();
    setValue(textarea, '  가');

    const event = lineBreak(textarea, { isComposing: true });

    expect(event.defaultPrevented).toBe(false);
    expect(textarea.value).toBe('  가');
  });

  it('Tab 은 들여쓰고 Shift+Tab 은 내어쓰며 포커스는 남는다', async () => {
    const textarea = await contentBox();
    setValue(textarea, 'a');

    fireEvent.keyDown(textarea, { key: 'Tab' });
    expect(textarea.value).toBe('  a');
    expect(textarea).toHaveFocus();

    fireEvent.keyDown(textarea, { key: 'Tab', shiftKey: true });
    expect(textarea.value).toBe('a');
    expect(textarea).toHaveFocus();
  });

  it('Esc 다음 Tab 은 들여쓰지 않고 기본 동작(칸 이동)에 맡긴다', async () => {
    const textarea = await contentBox();
    setValue(textarea, 'a');

    fireEvent.keyDown(textarea, { key: 'Escape' });
    const notPrevented = fireEvent.keyDown(textarea, { key: 'Tab' });

    expect(notPrevented).toBe(true);
    expect(textarea.value).toBe('a');
  });

  it('Esc 다음 Shift+Tab 도 내어쓰지 않고 칸 이동에 맡긴다', async () => {
    const textarea = await contentBox();
    setValue(textarea, '  a');

    await userEvent.keyboard('{Escape}{Shift>}{Tab}{/Shift}');

    expect(textarea.value).toBe('  a');
  });

  it('취소할 수 없는 줄바꿈 입력은 브라우저에 맡기고 따로 넣지 않는다', async () => {
    const textarea = await contentBox();
    setValue(textarea, '  a');

    lineBreak(textarea, { cancelable: false });

    expect(textarea.value).toBe('  a');
  });

  it('Esc 뒤에 다른 키를 누르면 Tab 은 다시 들여쓴다', async () => {
    const textarea = await contentBox();
    setValue(textarea, 'a');

    fireEvent.keyDown(textarea, { key: 'Escape' });
    fireEvent.keyDown(textarea, { key: 'b' });
    fireEvent.keyDown(textarea, { key: 'Tab' });

    expect(textarea.value).toBe('  a');
  });

  it('내용 칸에서 Esc 를 눌러도 다이얼로그가 닫히지 않는다', async () => {
    const textarea = await contentBox();
    setValue(textarea, '쓰던 메모');

    fireEvent.keyDown(textarea, { key: 'Escape' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(textarea.value).toBe('쓰던 메모');
  });

  it('내용 칸에서 Esc 를 두 번 누르면 다이얼로그가 닫힌다', async () => {
    const textarea = await contentBox();

    fireEvent.keyDown(textarea, { key: 'Escape' });
    fireEvent.keyDown(textarea, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('코드블록 넣기 버튼은 펜스를 넣고 포커스를 유지한다', async () => {
    const textarea = await contentBox();

    await userEvent.click(screen.getByRole('button', { name: '코드블록 넣기' }));

    expect(textarea.value).toBe('```\n\n```');
    expect(textarea).toHaveFocus();
    expect(textarea.selectionStart).toBe(4);
  });

  it('들여쓰기·내어쓰기 버튼은 커서가 있는 줄을 옮긴다', async () => {
    const textarea = await contentBox();
    setValue(textarea, 'a');

    await userEvent.click(screen.getByRole('button', { name: '들여쓰기' }));
    expect(textarea.value).toBe('  a');
    expect(textarea).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: '내어쓰기' }));
    expect(textarea.value).toBe('a');
  });

  it('편집 결과가 저장 내용에 반영된다', async () => {
    const textarea = await contentBox();
    setValue(textarea, 'SELECT *');
    lineBreak(textarea);
    fireEvent.change(textarea, { target: { value: `${textarea.value}FROM t` } });
    textarea.setSelectionRange(0, 0);
    fireEvent.keyDown(textarea, { key: 'Tab' });

    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(api.createKnowledgeNote).toHaveBeenCalledWith(expect.objectContaining({ content: 'SELECT *\nFROM t' }))
    );
  });
});
