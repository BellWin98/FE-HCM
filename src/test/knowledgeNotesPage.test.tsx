import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeNote } from '@/types/knowledgeNote';

vi.mock('@/lib/api', () => ({
  api: {
    searchKnowledgeNotes: vi.fn(),
    deleteKnowledgeNote: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
const openQuickNote = vi.fn();
vi.mock('@/contexts/QuickNoteContext', () => ({
  useQuickNote: () => ({ openQuickNote }),
}));

const { api } = await import('@/lib/api');
const { toast } = await import('sonner');
const { default: KnowledgeNotesPage } = await import('@/pages/KnowledgeNotesPage');

const makeNote = (over: Partial<KnowledgeNote> = {}): KnowledgeNote => ({
  id: 1,
  category: 'DEV',
  content: '첫 메모',
  images: [],
  sourceUrl: null,
  sourceText: null,
  tags: [],
  stockSymbol: null,
  stockName: null,
  createdAt: '2026-11-02T00:00:00',
  updatedAt: null,
  ...over,
});

const page = (content: KnowledgeNote[], last = true, number = 0) => ({
  content,
  last,
  totalPages: last ? number + 1 : number + 2,
  number,
  size: 20,
});

const renderPage = (url = '/notes') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <KnowledgeNotesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const lastCall = () => vi.mocked(api.searchKnowledgeNotes).mock.calls.at(-1)?.[0];

// embla-carousel(이미지 뷰어)이 jsdom 에 없는 IntersectionObserver 를 요구한다.
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

describe('KnowledgeNotesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(page([makeNote()]));
    vi.mocked(api.deleteKnowledgeNote).mockResolvedValue(undefined);
  });

  it('검색어 입력 300ms 뒤 keyword 로 조회한다', async () => {
    renderPage();
    await screen.findByText('첫 메모');
    vi.mocked(api.searchKnowledgeNotes).mockClear();

    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByRole('searchbox', { name: '메모 검색' }), '리액트');
    expect(api.searchKnowledgeNotes).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    vi.useRealTimers();

    await waitFor(() => expect(lastCall()).toMatchObject({ keyword: '리액트', page: 0, size: 20 }));
  });

  it('분야 버튼을 누르면 category 로 조회한다', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('첫 메모');
    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: '주식' }));

    await waitFor(() => expect(lastCall()).toMatchObject({ category: 'STOCK' }));
    expect(screen.getByRole('button', { name: '주식' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('?stockSymbol=005930&stockName=삼성전자 로 들어오면 종목 필터 칩이 보이고 해제할 수 있다', async () => {
    const user = userEvent.setup();
    renderPage('/notes?stockSymbol=005930&stockName=삼성전자');

    await waitFor(() => expect(lastCall()).toMatchObject({ stockSymbol: '005930' }));
    const chip = screen.getByRole('button', { name: '삼성전자 필터 해제' });

    await user.click(chip);

    expect(screen.queryByRole('button', { name: '삼성전자 필터 해제' })).not.toBeInTheDocument();
    await waitFor(() => expect(lastCall()?.stockSymbol).toBeUndefined());
  });

  it('태그를 누르면 그 태그로 검색한다', async () => {
    const user = userEvent.setup();
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(page([makeNote({ tags: ['react'] })]));
    renderPage();

    await user.click(await screen.findByRole('button', { name: '#react' }));

    expect(screen.getByRole('searchbox', { name: '메모 검색' })).toHaveValue('react');
    await waitFor(() => expect(lastCall()).toMatchObject({ keyword: 'react' }), { timeout: 2000 });
  });

  it('http(s) 출처만 새 탭 링크(rel="noopener noreferrer")로 그리고, 그 외 값은 텍스트로 그린다', async () => {
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(
      page([
        makeNote({ id: 1, content: 'a', sourceUrl: 'HTTPS://example.com/x', sourceText: null }),
        makeNote({ id: 2, content: 'b', sourceUrl: null, sourceText: 'javascript:alert(1)' }),
        makeNote({ id: 3, content: 'c', sourceUrl: null, sourceText: '책 제목' }),
      ])
    );
    renderPage();

    const link = await screen.findByRole('link', { name: 'HTTPS://example.com/x' });
    expect(link).toHaveAttribute('href', 'HTTPS://example.com/x');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('javascript:alert(1)').closest('a')).toBeNull();
    expect(screen.getByText('책 제목').closest('a')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('출처 링크와 텍스트가 둘 다 있으면 텍스트를 링크 이름으로 쓰고, 링크가 http(s) 가 아니면 둘 다 텍스트로 보인다', async () => {
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(
      page([
        makeNote({ id: 1, content: 'a', sourceUrl: 'https://youtu.be/abc', sourceText: '유튜브 강의 제목' }),
        makeNote({ id: 2, content: 'b', sourceUrl: 'ftp://files/x', sourceText: '사내 자료' }),
      ])
    );
    renderPage();

    const link = await screen.findByRole('link', { name: '유튜브 강의 제목' });
    expect(link).toHaveAttribute('href', 'https://youtu.be/abc');
    expect(screen.getByText('사내 자료').closest('a')).toBeNull();
    expect(screen.getByText('ftp://files/x').closest('a')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('카드의 종목 배지를 누르면 그 종목으로 거른다', async () => {
    const user = userEvent.setup();
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(
      page([makeNote({ category: 'STOCK', stockSymbol: '005930', stockName: '삼성전자' })])
    );
    renderPage();

    await user.click(await screen.findByRole('button', { name: '삼성전자 메모만 보기' }));

    await waitFor(() => expect(lastCall()).toMatchObject({ stockSymbol: '005930' }));
    expect(screen.getByRole('button', { name: '삼성전자 필터 해제' })).toBeInTheDocument();
  });

  it('긴 내용은 줄여서 보이고 "내용 더보기"/"내용 접기" 로 펼치고 접는다', async () => {
    const user = userEvent.setup();
    const long = ['1줄', '2줄', '3줄', '4줄', '5줄', '6줄'].join('\n');
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(
      page([makeNote({ id: 1, content: long }), makeNote({ id: 2, content: '짧은 메모' })])
    );
    renderPage();

    const content = await screen.findByText(/1줄/);
    expect(content).toHaveClass('line-clamp-4');
    expect(screen.getAllByRole('button', { name: '내용 더보기' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: '내용 더보기' }));
    expect(screen.getByText(/1줄/)).not.toHaveClass('line-clamp-4');
    await user.click(screen.getByRole('button', { name: '내용 접기' }));
    expect(screen.getByText(/1줄/)).toHaveClass('line-clamp-4');
    expect(screen.getByText('짧은 메모')).not.toHaveClass('line-clamp-4');
  });

  it('삭제는 확인 후에만 deleteKnowledgeNote 를 호출한다', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('첫 메모');

    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(api.deleteKnowledgeNote).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(api.deleteKnowledgeNote).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('삭제에 실패하면 토스트 대신 화면에 알린다', async () => {
    const user = userEvent.setup();
    vi.mocked(api.deleteKnowledgeNote).mockRejectedValue(new Error('fail'));
    renderPage();
    await screen.findByText('첫 메모');

    await user.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('메모를 삭제하지 못했습니다.');
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('수정을 누르면 openQuickNote({ note }) 를 호출한다', async () => {
    const user = userEvent.setup();
    const note = makeNote();
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(page([note]));
    renderPage();

    await user.click(await screen.findByRole('button', { name: '수정' }));

    expect(openQuickNote).toHaveBeenCalledWith({ note });
  });

  it('last=false 면 더보기로 다음 페이지를 붙인다', async () => {
    const user = userEvent.setup();
    vi.mocked(api.searchKnowledgeNotes)
      .mockResolvedValueOnce(page([makeNote({ id: 1, content: '첫 페이지' })], false, 0))
      .mockResolvedValueOnce(page([makeNote({ id: 2, content: '둘째 페이지' })], true, 1));
    renderPage();

    await screen.findByText('첫 페이지');
    await user.click(screen.getByRole('button', { name: '더보기' }));

    await screen.findByText('둘째 페이지');
    expect(screen.getByText('첫 페이지')).toBeInTheDocument();
    expect(lastCall()).toMatchObject({ page: 1 });
    expect(screen.queryByRole('button', { name: '더보기' })).not.toBeInTheDocument();
  });

  it('결과가 없으면 빈 상태를 보인다', async () => {
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(page([]));
    renderPage();
    expect(await screen.findByText('메모가 없습니다')).toBeInTheDocument();
  });

  it('이미지가 있는 메모는 썸네일을 보이고 누르면 뷰어가 열린다', async () => {
    const user = userEvent.setup();
    vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const images = ['https://img.test/0.jpg', 'https://img.test/1.jpg', 'https://img.test/2.jpg'];
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(page([makeNote({ images })]));
    renderPage();

    await user.click(await screen.findByRole('button', { name: '이미지 1/3 크게 보기' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('내용이 null 이고 이미지만 있는 메모는 썸네일만 보이고 "내용 더보기" 는 없다', async () => {
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(
      page([makeNote({ content: null, images: ['https://img.test/0.jpg'] })])
    );
    const { container } = renderPage();

    expect(await screen.findByRole('button', { name: '이미지 1/1 크게 보기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '내용 더보기' })).not.toBeInTheDocument();
    expect(container.querySelector('p.whitespace-pre-wrap')).toBeNull();
  });
});
