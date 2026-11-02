import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Member } from '@/types';
import type { KnowledgeNote } from '@/types/knowledgeNote';

vi.mock('@/lib/api', () => ({
  api: {
    getKnowledgeAccess: vi.fn(),
    createKnowledgeNote: vi.fn(),
    updateKnowledgeNote: vi.fn(),
    searchTossStocks: vi.fn(),
  },
}));

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
  content: '저장됨',
  images: [],
  sourceUrl: null,
  sourceText: '책',
  tags: [],
  stockSymbol: null,
  stockName: null,
  createdAt: '2026-11-02T00:00:00',
  updatedAt: null,
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
  vi.mocked(api.getKnowledgeAccess).mockReset().mockResolvedValue({ hasAccess: true });
  vi.mocked(api.createKnowledgeNote).mockReset().mockResolvedValue(savedNote);
  vi.mocked(api.updateKnowledgeNote).mockReset().mockResolvedValue(savedNote);
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe('빠른 메모 다이얼로그', () => {
  it('열리면 내용 칸에 포커스가 간다', async () => {
    await open();

    const content = await screen.findByRole('textbox', { name: '내용' });
    await waitFor(() => expect(content).toHaveFocus());
    expect(screen.getByRole('heading', { name: '빠른 메모' })).toBeInTheDocument();
  });

  it('입력 칸은 자동완성·자동 고침을 끈다', async () => {
    await open();
    await screen.findByRole('textbox', { name: '내용' });
    for (const name of ['내용', '출처 링크', '출처 텍스트', '태그']) {
      const field = screen.getByRole('textbox', { name });
      expect(field).toHaveAttribute('autocomplete', 'off');
      expect(field).toHaveAttribute('autocorrect', 'off');
      expect(field).toHaveAttribute('spellcheck', 'false');
    }
  });

  it('권한이 없으면 열리지 않는다', async () => {
    vi.mocked(api.getKnowledgeAccess).mockResolvedValue({ hasAccess: false });
    renderDialog();
    await waitFor(() => expect(api.getKnowledgeAccess).toHaveBeenCalled());
    await userEvent.click(screen.getByRole('button', { name: '열기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '빠른 메모' })).not.toBeInTheDocument();
  });

  it('분야 라디오 4개가 있고 기본은 개발이다', async () => {
    await open();

    const group = await screen.findByRole('radiogroup', { name: '분야' });
    expect(group.querySelectorAll('[role="radio"]')).toHaveLength(4);
    expect(screen.getByRole('radio', { name: '개발' })).toBeChecked();
  });

  it('출처가 둘 다 비어 있어도 내용만 있으면 출처 없이 저장한다', async () => {
    await open();
    await userEvent.type(await screen.findByRole('textbox', { name: '내용' }), '메모');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(api.createKnowledgeNote).toHaveBeenCalledWith({
        category: 'DEV',
        content: '메모',
        tags: [],
        imageUrls: [],
      })
    );
  });

  it('내용도 이미지도 없으면 요청하지 않고 "내용 또는 이미지를 입력하세요" 를 보여준다', async () => {
    await open();
    await userEvent.type(await screen.findByRole('textbox', { name: '내용' }), '   ');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('내용 또는 이미지를 입력하세요')).toBeInTheDocument();
    expect(api.createKnowledgeNote).not.toHaveBeenCalled();
  });

  it('Ctrl+Enter 로 저장하고 값은 다듬어 보낸다', async () => {
    await open();
    await userEvent.type(await screen.findByRole('textbox', { name: '내용' }), '  메모 내용  ');
    await userEvent.type(screen.getByRole('textbox', { name: '출처 텍스트' }), ' 클린 코드 ');
    await userEvent.type(screen.getByRole('textbox', { name: '태그' }), '리팩터링,  ');
    await userEvent.type(screen.getByRole('textbox', { name: '태그' }), '테스트{Enter}');
    await userEvent.keyboard('{Control>}{Enter}{/Control}');

    await waitFor(() =>
      expect(api.createKnowledgeNote).toHaveBeenCalledWith({
        category: 'DEV',
        content: '메모 내용',
        sourceText: '클린 코드',
        tags: ['리팩터링', '테스트'],
        imageUrls: [],
      })
    );
  });

  it('Meta+Enter 로도 저장한다', async () => {
    await open();
    await userEvent.type(await screen.findByRole('textbox', { name: '내용' }), '메모');
    await userEvent.type(screen.getByRole('textbox', { name: '출처 링크' }), 'https://example.com');
    await userEvent.keyboard('{Meta>}{Enter}{/Meta}');

    await waitFor(() =>
      expect(api.createKnowledgeNote).toHaveBeenCalledWith({
        category: 'DEV',
        content: '메모',
        sourceUrl: 'https://example.com',
        tags: [],
        imageUrls: [],
      })
    );
  });

  it('태그 칩을 삭제할 수 있다', async () => {
    await open();
    await userEvent.type(await screen.findByRole('textbox', { name: '태그' }), '가나{Enter}');
    await userEvent.click(screen.getByRole('button', { name: '가나 태그 삭제' }));

    expect(screen.queryByRole('button', { name: '가나 태그 삭제' })).not.toBeInTheDocument();
  });

  it('저장하면 분야·출처를 기억해 다음에 열 때 미리 채운다', async () => {
    await open();
    await userEvent.click(await screen.findByRole('radio', { name: '부동산' }));
    await userEvent.type(screen.getByRole('textbox', { name: '내용' }), '메모');
    await userEvent.type(screen.getByRole('textbox', { name: '출처 텍스트' }), '유튜브');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(JSON.parse(localStorage.getItem(CONTEXT_KEY) ?? 'null')).toEqual({
      category: 'REAL_ESTATE',
      sourceText: '유튜브',
      savedAt: expect.any(Number),
    });
    expect(toast.success).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: '열기' }));
    expect(await screen.findByRole('radio', { name: '부동산' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: '출처 텍스트' })).toHaveValue('유튜브');
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue('');
  });

  it('prefill 은 마지막 컨텍스트보다 우선한다', async () => {
    localStorage.setItem(
      CONTEXT_KEY,
      JSON.stringify({ category: 'DEV', sourceUrl: 'https://old.example.com', savedAt: Date.now() })
    );
    await open({ prefill: { category: 'ETC', sourceText: '앱 공유', content: '본문' } });

    expect(await screen.findByRole('radio', { name: '기타' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: '출처 텍스트' })).toHaveValue('앱 공유');
    expect(screen.getByRole('textbox', { name: '출처 링크' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue('본문');
  });

  it('"출처 지우기" 는 두 출처 칸을 비운다', async () => {
    await open({ prefill: { sourceUrl: 'https://a.com', sourceText: '글' } });
    await userEvent.click(await screen.findByRole('button', { name: '출처 지우기' }));

    expect(screen.getByRole('textbox', { name: '출처 링크' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: '출처 텍스트' })).toHaveValue('');
  });

  it('"출처 지우기" 는 기억한 마지막 출처도 지워 다음에 다시 채우지 않는다', async () => {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify({ category: 'DEV', sourceText: '옛 출처', savedAt: Date.now() }));
    await open();
    expect(await screen.findByRole('textbox', { name: '출처 텍스트' })).toHaveValue('옛 출처');

    await userEvent.click(screen.getByRole('button', { name: '출처 지우기' }));
    expect(localStorage.getItem(CONTEXT_KEY)).toBeNull();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: '열기' }));
    expect(await screen.findByRole('textbox', { name: '출처 텍스트' })).toHaveValue('');
  });

  it('A 를 열고 닫은 뒤(또는 닫히는 도중) B 를 열면 폼은 B 의 값으로 채워진다', async () => {
    const noteA: KnowledgeNote = { ...savedNote, id: 1, content: 'A 내용', sourceText: 'A 출처' };
    const noteB: KnowledgeNote = { ...savedNote, id: 2, content: 'B 내용', sourceText: 'B 출처' };
    let openQuickNote: ReturnType<typeof useQuickNote>['openQuickNote'] = () => {};
    const Capture = () => {
      openQuickNote = useQuickNote().openQuickNote;
      return null;
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter>
            <QuickNoteProvider>
              <OpenButton />
              <Capture />
            </QuickNoteProvider>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
    await screen.findByRole('button', { name: '열기' });
    await waitFor(() => expect(api.getKnowledgeAccess).toHaveBeenCalled());

    act(() => openQuickNote({ note: noteA }));
    expect(await screen.findByRole('textbox', { name: '내용' })).toHaveValue('A 내용');
    await userEvent.keyboard('{Escape}');
    act(() => openQuickNote({ note: noteB }));
    expect(await screen.findByRole('textbox', { name: '내용' })).toHaveValue('B 내용');

    // 닫힘 애니메이션 중처럼 폼이 아직 마운트된 채로 다른 메모를 열어도 이전 값이 남지 않는다.
    act(() => openQuickNote({ note: noteA }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue('A 내용'));
    expect(screen.getByRole('textbox', { name: '출처 텍스트' })).toHaveValue('A 출처');
  });

  it('localStorage 접근이 throw 해도 열리고 저장된다', async () => {
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key: string) {
      if (key === CONTEXT_KEY) throw new Error('blocked');
      return originalGetItem.call(this, key);
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string
    ) {
      if (key === CONTEXT_KEY) throw new Error('blocked');
      originalSetItem.call(this, key, value);
    });

    try {
      await open();
      await userEvent.type(await screen.findByRole('textbox', { name: '내용' }), '메모');
      await userEvent.type(screen.getByRole('textbox', { name: '출처 텍스트' }), '책');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      await waitFor(() => expect(api.createKnowledgeNote).toHaveBeenCalled());
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it('"종목 연결" 은 주식 분야일 때만 보이고, 주식에서 개발로 바꾸면 "종목 연결이 해제됩니다" 를 알리고 종목을 비운다', async () => {
    await open({
      prefill: { category: 'STOCK', stockSymbol: '005930', stockName: '삼성전자', sourceText: '리포트' },
    });

    expect(await screen.findByRole('button', { name: '종목 연결' })).toBeInTheDocument();
    expect(screen.getByText('삼성전자')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: '개발' }));

    expect(screen.getByText('종목 연결이 해제됩니다')).toBeInTheDocument();
    expect(screen.queryByText('삼성전자')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '종목 연결' })).not.toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: '내용' }), '메모');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(api.createKnowledgeNote).toHaveBeenCalledWith({
        category: 'DEV',
        content: '메모',
        sourceText: '리포트',
        tags: [],
        imageUrls: [],
      })
    );
  });

  it('주식 분야로 저장하면 종목 코드와 이름을 함께 보낸다', async () => {
    await open({
      prefill: { category: 'STOCK', stockSymbol: '005930', stockName: '삼성전자', content: '실적', sourceText: '리포트' },
    });
    await userEvent.click(await screen.findByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(api.createKnowledgeNote).toHaveBeenCalledWith({
        category: 'STOCK',
        content: '실적',
        sourceText: '리포트',
        tags: [],
        imageUrls: [],
        stockSymbol: '005930',
        stockName: '삼성전자',
      })
    );
  });

  it('저장이 실패하면 다이얼로그를 닫지 않고 입력을 유지하며 서버 메시지를 알린다', async () => {
    vi.mocked(api.createKnowledgeNote).mockRejectedValue(new Error('내용은 2000자 이하여야 합니다'));
    const onClosed = vi.fn();
    await open({ onClosed });
    await userEvent.type(await screen.findByRole('textbox', { name: '내용' }), '메모');
    await userEvent.type(screen.getByRole('textbox', { name: '출처 텍스트' }), '책');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('메모를 저장하지 못했습니다. 내용은 2000자 이하여야 합니다')).toHaveAttribute(
      'role',
      'alert'
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue('메모');
    expect(onClosed).not.toHaveBeenCalled();
    expect(localStorage.getItem(CONTEXT_KEY)).toBeNull();
  });

  it('note 를 넘기면 "메모 수정" 으로 열리고 updateKnowledgeNote 를 호출한다', async () => {
    const note: KnowledgeNote = {
      ...savedNote,
      id: 42,
      category: 'ETC',
      content: '원본',
      sourceText: '출처',
      tags: ['a'],
    };
    await open({ note });

    expect(await screen.findByRole('heading', { name: '메모 수정' })).toBeInTheDocument();
    const content = screen.getByRole('textbox', { name: '내용' });
    expect(content).toHaveValue('원본');
    await userEvent.type(content, ' 수정');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(api.updateKnowledgeNote).toHaveBeenCalledWith(42, {
        category: 'ETC',
        content: '원본 수정',
        sourceText: '출처',
        tags: ['a'],
        imageUrls: [],
      })
    );
    expect(api.createKnowledgeNote).not.toHaveBeenCalled();
    // 수정은 "마지막 컨텍스트" 를 덮어쓰지 않는다.
    expect(localStorage.getItem(CONTEXT_KEY)).toBeNull();
  });

  it('이미지가 있는 메모를 수정해 저장해도 이미지 목록을 그대로 보낸다', async () => {
    const note: KnowledgeNote = { ...savedNote, id: 43, content: '원본', images: ['u1', 'u2'] };
    await open({ note });

    await userEvent.click(await screen.findByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(api.updateKnowledgeNote).toHaveBeenCalledWith(
        43,
        expect.objectContaining({ imageUrls: ['u1', 'u2'] })
      )
    );
  });

  it('내용이 비어도 이미지가 있으면 content 없이 저장한다', async () => {
    const note: KnowledgeNote = { ...savedNote, id: 44, content: null, images: ['u1'] };
    await open({ note });

    await userEvent.click(await screen.findByRole('button', { name: '저장' }));

    await waitFor(() => expect(api.updateKnowledgeNote).toHaveBeenCalled());
    const [, input] = vi.mocked(api.updateKnowledgeNote).mock.calls[0];
    expect(input).not.toHaveProperty('content');
    expect(input.imageUrls).toEqual(['u1']);
  });

  it('저장 후 knowledgeNotes 쿼리 prefix 를 무효화하고 onClosed 를 부른다', async () => {
    const onClosed = vi.fn();
    const { invalidate } = await open({ onClosed });
    await userEvent.type(await screen.findByRole('textbox', { name: '내용' }), '메모');
    await userEvent.type(screen.getByRole('textbox', { name: '출처 텍스트' }), '책');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: [...KNOWLEDGE_NOTES_QUERY_KEY] })
    );
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
  });

  it('닫기만 해도 onClosed 를 부른다', async () => {
    const onClosed = vi.fn();
    await open({ onClosed });
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
  });
});

describe('빠른 메모 — 열 때', () => {
  it('30분이 지난 마지막 출처는 채우지 않고 분야만 이어 간다', async () => {
    localStorage.setItem(
      CONTEXT_KEY,
      JSON.stringify({ category: 'ETC', sourceText: '어제 본 영상', savedAt: Date.now() - 31 * 60 * 1000 })
    );
    await open();

    expect(await screen.findByRole('radio', { name: '기타' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: '출처 텍스트' })).toHaveValue('');
    expect(screen.queryByText('지난 메모의 출처')).not.toBeInTheDocument();
  });

  it('저장 시각이 없는 예전 기록의 출처도 채우지 않는다', async () => {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify({ category: 'ETC', sourceText: '옛 출처' }));
    await open();

    expect(await screen.findByRole('radio', { name: '기타' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: '출처 텍스트' })).toHaveValue('');
  });

  it('마지막 출처를 채웠으면 "지난 메모의 출처" 라고 알리고, 지우면 안내도 사라진다', async () => {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify({ category: 'DEV', sourceText: '책', savedAt: Date.now() }));
    await open();

    expect(await screen.findByText('지난 메모의 출처')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '출처 지우기' }));
    expect(screen.queryByText('지난 메모의 출처')).not.toBeInTheDocument();
  });

  it('prefill 로 받은 출처에는 "지난 메모의 출처" 안내를 띄우지 않는다', async () => {
    await open({ prefill: { sourceText: '앱 공유' } });

    expect(await screen.findByRole('textbox', { name: '출처 텍스트' })).toHaveValue('앱 공유');
    expect(screen.queryByText('지난 메모의 출처')).not.toBeInTheDocument();
  });

  it('내용 칸이 분야 선택보다 먼저 나온다', async () => {
    await open();
    const content = await screen.findByRole('textbox', { name: '내용' });
    const category = screen.getByRole('radiogroup', { name: '분야' });

    expect(content.compareDocumentPosition(category) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('FAB 은 다이얼로그를 연다고 알린다', async () => {
    renderDialog();

    expect(await screen.findByRole('button', { name: '빠른 메모' })).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('FAB 을 연달아 눌러도 쓰던 내용이 사라지지 않는다', async () => {
    renderDialog();
    const fab = await screen.findByRole('button', { name: '빠른 메모' });
    fireEvent.click(fab);
    await userEvent.type(await screen.findByRole('textbox', { name: '내용' }), '쓰던 메모');

    fireEvent.click(fab);

    expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue('쓰던 메모');
  });
});

describe('빠른 메모 — 모바일', () => {
  class FakeVisualViewport extends EventTarget {
    height = 800;
    offsetTop = 0;
  }
  const originalViewport = window.visualViewport;
  const originalInnerHeight = window.innerHeight;
  const originalInnerWidth = window.innerWidth;
  let viewport: FakeVisualViewport;

  const showKeyboard = (): void => {
    act(() => {
      viewport.height = 450;
      viewport.dispatchEvent(new Event('resize'));
    });
  };

  beforeEach(() => {
    viewport = new FakeVisualViewport();
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
  });

  afterEach(() => {
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: originalViewport });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
  });

  it('키보드에 맞춰 위치가 바뀔 때 튀지 않도록 bottom 을 전환하고 열림 애니메이션을 줄인다', async () => {
    await open();
    const sheet = await screen.findByRole('dialog');

    expect(sheet.className).toContain('transition-[bottom]');
    expect(sheet.className).toContain('data-[state=open]:duration-300');
    expect(sheet.className).not.toContain('data-[state=open]:duration-500');
  });

  it('키보드가 없으면 홈 인디케이터만큼 아래 여백을 두고, 키보드가 올라오면 뺀다', async () => {
    await open();
    const sheet = await screen.findByRole('dialog');
    expect(sheet.className).toContain('pb-safe');

    showKeyboard();
    expect(sheet.className).not.toContain('pb-safe');
  });

  it('키보드가 올라와 있으면 FAB 을 숨긴다', async () => {
    renderDialog();
    expect(await screen.findByRole('button', { name: '빠른 메모' })).toBeInTheDocument();

    showKeyboard();
    expect(screen.queryByRole('button', { name: '빠른 메모' })).not.toBeInTheDocument();

    act(() => {
      viewport.height = 800;
      viewport.dispatchEvent(new Event('resize'));
    });
    expect(screen.getByRole('button', { name: '빠른 메모' })).toBeInTheDocument();
  });
});

describe('useQuickNote — Provider 밖', () => {
  it('Provider 없이 호출해도 throw 하지 않고 아무 일도 하지 않는다', async () => {
    render(<OpenButton />);

    await userEvent.click(screen.getByRole('button', { name: '열기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
