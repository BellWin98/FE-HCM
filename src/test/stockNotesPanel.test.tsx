import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type { KnowledgeNote } from '@/types/knowledgeNote';

vi.mock('@/lib/api', () => ({
  api: {
    searchKnowledgeNotes: vi.fn(),
  },
}));

const useKnowledgeAccess = vi.fn();
vi.mock('@/hooks/useKnowledgeAccess', () => ({
  KNOWLEDGE_NOTES_QUERY_KEY: ['knowledgeNotes'],
  useKnowledgeAccess: () => useKnowledgeAccess(),
}));

const openQuickNote = vi.fn();
vi.mock('@/contexts/QuickNoteContext', () => ({
  useQuickNote: () => ({ openQuickNote }),
}));

const { api } = await import('@/lib/api');
const { StockNotesPanel } = await import('@/components/knowledge/StockNotesPanel');

const note = (id: number, content: string | null, images: string[] = []): KnowledgeNote => ({
  id,
  category: 'STOCK',
  content,
  images,
  sourceUrl: null,
  sourceText: null,
  tags: [],
  stockSymbol: '005930',
  stockName: '삼성전자',
  createdAt: '2026-11-02T09:00:00',
  updatedAt: null,
});

const page = (content: KnowledgeNote[]) => ({
  content,
  last: true,
  totalPages: 1,
  totalElements: content.length,
  number: 0,
  size: 20,
});

const renderPanel = (symbol: string | null = '005930') =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <StockNotesPanel symbol={symbol} stockName="삼성전자" />
    </QueryClientProvider>
  );

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

beforeEach(() => {
  useKnowledgeAccess.mockReset().mockReturnValue({ hasAccess: true, isPending: false });
  vi.mocked(api.searchKnowledgeNotes).mockReset();
  openQuickNote.mockReset();
});

describe('종목 메모 패널', () => {
  it('hasAccess=false 면 아무것도 그리지 않고 API 를 부르지 않는다', async () => {
    useKnowledgeAccess.mockReturnValue({ hasAccess: false, isPending: false });
    const { container } = renderPanel();

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(container).toBeEmptyDOMElement();
    expect(api.searchKnowledgeNotes).not.toHaveBeenCalled();
  });

  it('종목이 없으면 조회하지 않는다', async () => {
    const { container } = renderPanel(null);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(container).toBeEmptyDOMElement();
    expect(api.searchKnowledgeNotes).not.toHaveBeenCalled();
  });

  it('메모가 있으면 "이 종목 메모 2건" 과 최신 메모 미리보기를 보여준다', async () => {
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(
      page([note(2, '최신 메모 내용'), note(1, '오래된 메모 내용')])
    );
    renderPanel();

    const region = await screen.findByRole('region', { name: '이 종목 메모' });
    expect(region).toHaveTextContent('이 종목 메모 2건');
    expect(region).toHaveTextContent('최신 메모 내용');
    expect(region).not.toHaveTextContent('오래된 메모 내용');
    expect(api.searchKnowledgeNotes).toHaveBeenCalledWith({ stockSymbol: '005930', size: 20 });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '메모 펼치기' }));
    expect(region).toHaveTextContent('오래된 메모 내용');
    await user.click(screen.getByRole('button', { name: '메모 접기' }));
    expect(region).not.toHaveTextContent('오래된 메모 내용');
  });

  it('메모가 0건이면 쓰기 버튼만 보인다', async () => {
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(page([]));
    renderPanel();

    expect(await screen.findByRole('button', { name: '이 종목 메모 쓰기' })).toBeInTheDocument();
    expect(screen.queryByText(/이 종목 메모 \d+건/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '메모 펼치기' })).not.toBeInTheDocument();
  });

  it('조회가 실패해도 오류를 드러내지 않는다', async () => {
    vi.mocked(api.searchKnowledgeNotes).mockRejectedValue(new Error('boom'));
    const { container } = renderPanel();

    await waitFor(() => expect(api.searchKnowledgeNotes).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('재조회가 실패하면 캐시에 이전(다른 사용자) 데이터가 남아 있어도 그리지 않는다', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['knowledgeNotes', 'stock', '005930'], page([note(1, '이전 사용자 메모')]), {
      updatedAt: 0,
    });
    vi.mocked(api.searchKnowledgeNotes).mockRejectedValue(new Error('403'));
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <StockNotesPanel symbol="005930" stockName="삼성전자" />
      </QueryClientProvider>
    );

    await waitFor(() => expect(api.searchKnowledgeNotes).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(screen.queryByText('이전 사용자 메모')).not.toBeInTheDocument();
  });

  it('메모가 1건이어도 긴 메모를 끝까지 볼 수 있게 펼치기/접기 버튼이 있다', async () => {
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(page([note(1, '아주 긴 메모 '.repeat(40))]));
    renderPanel();

    const user = userEvent.setup();
    const content = await screen.findByText(/아주 긴 메모/);
    expect(content).toHaveClass('line-clamp-2');
    await user.click(screen.getByRole('button', { name: '메모 펼치기' }));
    expect(screen.getByText(/아주 긴 메모/)).not.toHaveClass('line-clamp-2');
    expect(screen.getByRole('button', { name: '메모 접기' })).toBeInTheDocument();
  });

  it('"이 종목 메모 쓰기" 는 STOCK + 종목이 채워진 빠른 메모를 연다', async () => {
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(page([note(1, '메모')]));
    renderPanel();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: '이 종목 메모 쓰기' }));

    expect(openQuickNote).toHaveBeenCalledWith({
      prefill: { category: 'STOCK', stockSymbol: '005930', stockName: '삼성전자' },
    });
  });

  it('이미지 메모에는 작은 썸네일이 보이고, 내용이 null 인 메모도 목록에 나온다', async () => {
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(
      page([note(1, null, ['https://img.test/0.jpg', 'https://img.test/1.jpg'])])
    );
    const { container } = renderPanel();

    const thumb = await screen.findByRole('button', { name: '이미지 1/2 크게 보기' });
    expect(thumb).toHaveClass('h-10', 'w-10');
    expect(screen.getByRole('region', { name: '이 종목 메모' })).toHaveTextContent('이 종목 메모 1건');
    expect(container.querySelector('p.whitespace-pre-wrap')).toBeNull();
  });

  it('시트 안에서 썸네일로 뷰어를 열고 닫아도 시트의 onOpenChange 는 호출되지 않는다', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(page([note(1, '메모', ['https://img.test/0.jpg'])]));
    const onOpenChange = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Sheet open onOpenChange={onOpenChange}>
          <SheetContent>
            <SheetTitle>주문</SheetTitle>
            <SheetDescription>주문 시트</SheetDescription>
            <StockNotesPanel symbol="005930" stockName="삼성전자" />
          </SheetContent>
        </Sheet>
      </QueryClientProvider>
    );
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: '이미지 1/1 크게 보기' }));
    expect(await screen.findByText('1/1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '닫기' }));

    await waitFor(() => expect(screen.queryByText('1/1')).not.toBeInTheDocument());
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('region', { name: '이 종목 메모' })).toBeInTheDocument();
    back.mockRestore();
  });
});
