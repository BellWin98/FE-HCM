import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const note = (id: number, content: string): KnowledgeNote => ({
  id,
  category: 'STOCK',
  content,
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

  it('"이 종목 메모 쓰기" 는 STOCK + 종목이 채워진 빠른 메모를 연다', async () => {
    vi.mocked(api.searchKnowledgeNotes).mockResolvedValue(page([note(1, '메모')]));
    renderPanel();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: '이 종목 메모 쓰기' }));

    expect(openQuickNote).toHaveBeenCalledWith({
      prefill: { category: 'STOCK', stockSymbol: '005930', stockName: '삼성전자' },
    });
  });
});
