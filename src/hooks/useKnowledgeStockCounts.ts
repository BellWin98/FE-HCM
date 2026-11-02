import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { KNOWLEDGE_NOTES_QUERY_KEY, useKnowledgeAccess } from '@/hooks/useKnowledgeAccess';

const EMPTY_COUNTS: Record<string, number> = {};

/**
 * 종목 코드별 메모 개수(보유 종목 배지용).
 *
 * 권한이 없거나 종목이 없으면 부르지 않고, 실패해도 화면을 막지 않도록 조용히 `{}` 를 돌려준다.
 * 키는 정렬된 symbols 라서 보유 순서가 바뀌어도 같은 캐시를 쓰며,
 * `KNOWLEDGE_NOTES_QUERY_KEY` prefix 아래라 메모 저장 시 함께 갱신된다.
 */
export const useKnowledgeStockCounts = (symbols: string[]): Record<string, number> => {
  const { hasAccess } = useKnowledgeAccess();
  const sorted = useMemo(() => [...new Set(symbols)].sort(), [symbols]);

  const { data, isError } = useQuery({
    queryKey: [...KNOWLEDGE_NOTES_QUERY_KEY, 'stockCounts', sorted],
    queryFn: () => api.getKnowledgeNoteStockCounts(sorted),
    enabled: hasAccess && sorted.length > 0,
    retry: false,
    staleTime: 30_000,
  });

  // 실패하면 캐시에 남은 이전 값이 있어도 버린다(권한을 잃었거나 다른 사용자의 값일 수 있다).
  if (isError) return EMPTY_COUNTS;
  return data ?? EMPTY_COUNTS;
};
