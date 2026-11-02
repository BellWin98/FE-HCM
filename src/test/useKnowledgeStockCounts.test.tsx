import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: {
    getKnowledgeNoteStockCounts: vi.fn(),
  },
}));

const useKnowledgeAccess = vi.fn();
vi.mock('@/hooks/useKnowledgeAccess', () => ({
  KNOWLEDGE_NOTES_QUERY_KEY: ['knowledgeNotes'],
  useKnowledgeAccess: () => useKnowledgeAccess(),
}));

const { api } = await import('@/lib/api');
const { useKnowledgeStockCounts } = await import('@/hooks/useKnowledgeStockCounts');

const renderCounts = (symbols: string[], queryClient: QueryClient = new QueryClient()) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useKnowledgeStockCounts(symbols), { wrapper });
};

beforeEach(() => {
  useKnowledgeAccess.mockReset().mockReturnValue({ hasAccess: true, isPending: false });
  vi.mocked(api.getKnowledgeNoteStockCounts).mockReset();
});

describe('useKnowledgeStockCounts', () => {
  it('권한이 없으면 API 를 부르지 않고 {} 를 돌려준다', async () => {
    useKnowledgeAccess.mockReturnValue({ hasAccess: false, isPending: false });
    const { result } = renderCounts(['005930']);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.current).toEqual({});
    expect(api.getKnowledgeNoteStockCounts).not.toHaveBeenCalled();
  });

  it('종목이 없으면([]) API 를 부르지 않는다', async () => {
    const { result } = renderCounts([]);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.current).toEqual({});
    expect(api.getKnowledgeNoteStockCounts).not.toHaveBeenCalled();
  });

  it('실패하면 캐시에 이전 값이 있어도 {} 를 돌려준다', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['knowledgeNotes', 'stockCounts', ['005930']], { '005930': 7 }, { updatedAt: 0 });
    vi.mocked(api.getKnowledgeNoteStockCounts).mockRejectedValue(new Error('403'));

    const { result } = renderCounts(['005930'], queryClient);

    await waitFor(() => expect(api.getKnowledgeNoteStockCounts).toHaveBeenCalled());
    await waitFor(() => expect(result.current).toEqual({}));
  });

  it('키와 요청은 정렬·중복 제거된 종목 목록으로 만든다', async () => {
    const queryClient = new QueryClient();
    vi.mocked(api.getKnowledgeNoteStockCounts).mockResolvedValue({ '005930': 2, AAPL: 1 });

    const { result } = renderCounts(['AAPL', '005930', 'AAPL'], queryClient);

    await waitFor(() => expect(result.current).toEqual({ '005930': 2, AAPL: 1 }));
    expect(api.getKnowledgeNoteStockCounts).toHaveBeenCalledWith(['005930', 'AAPL']);
    expect(queryClient.getQueryData(['knowledgeNotes', 'stockCounts', ['005930', 'AAPL']])).toEqual({
      '005930': 2,
      AAPL: 1,
    });
  });
});
