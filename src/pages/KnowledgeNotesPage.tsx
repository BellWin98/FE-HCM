import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ADMIN_DEFAULT_SCOPES, KnowledgeScopeFilter } from '@/components/knowledge/KnowledgeScopeFilter';
import { KnowledgeNoteCard } from '@/components/knowledge/KnowledgeNoteCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickNote } from '@/contexts/QuickNoteContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { KNOWLEDGE_NOTES_QUERY_KEY, useKnowledgeAccess } from '@/hooks/useKnowledgeAccess';
import { api } from '@/lib/api';
import {
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_CATEGORY_LABELS,
  type KnowledgeCategory,
  type KnowledgeNote,
  type KnowledgeNoteScope,
} from '@/types/knowledgeNote';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const KnowledgeNotesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { openQuickNote } = useQuickNote();
  const { member } = useAuth();
  const { canWrite, isAdmin, isPending: isAccessPending } = useKnowledgeAccess();

  const [keywordInput, setKeywordInput] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState<KnowledgeCategory | undefined>();
  const keyword = useDebouncedValue(keywordInput.trim(), SEARCH_DEBOUNCE_MS);

  // 사용자가 필터를 건드리기 전에는 권한 조회 결과(관리자 여부)로 기본값을 정한다.
  // 필터 모양이 권한에 따라 달라지므로, 선택값은 설정 당시의 모드와 함께 보관해 모드가 바뀌면 무시한다.
  const mode = isAdmin ? 'admin' : canWrite ? 'writer' : 'none';
  const [userScopes, setUserScopes] = useState<{ mode: string; value: KnowledgeNoteScope[] } | null>(null);
  const activeUserScopes = userScopes?.mode === mode ? userScopes.value : null;
  const scopes = activeUserScopes ?? (isAdmin ? ADMIN_DEFAULT_SCOPES : []);
  const handleScopesChange = (value: KnowledgeNoteScope[]): void => setUserScopes({ mode, value });

  const stockSymbol = searchParams.get('stockSymbol') ?? undefined;
  const stockName = searchParams.get('stockName') ?? stockSymbol;

  const { data, isPending, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [...KNOWLEDGE_NOTES_QUERY_KEY, 'list', { keyword, category, stockSymbol, scopes }],
    queryFn: ({ pageParam }) =>
      api.searchKnowledgeNotes({
        keyword: keyword || undefined,
        category,
        stockSymbol,
        scopes,
        page: pageParam,
        size: PAGE_SIZE,
      }),
    // 관리자 기본 범위가 정해지기 전에 불필요한 요청이 나가지 않게 권한 조회를 기다린다.
    enabled: !isAccessPending,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
  });

  const deleteMutation = useMutation({
    mutationFn: (note: KnowledgeNote) => api.deleteKnowledgeNote(note.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_NOTES_QUERY_KEY });
    },
  });

  const clearStockFilter = (): void => {
    const next = new URLSearchParams(searchParams);
    next.delete('stockSymbol');
    next.delete('stockName');
    setSearchParams(next, { replace: true });
  };

  // 보유 종목 배지와 같은 필터(?stockSymbol=&stockName=)로 거른다.
  const handleStockClick = (note: KnowledgeNote): void => {
    if (!note.stockSymbol) return;
    const next = new URLSearchParams(searchParams);
    next.set('stockSymbol', note.stockSymbol);
    next.set('stockName', note.stockName ?? note.stockSymbol);
    setSearchParams(next, { replace: true });
  };

  const notes = data?.pages.flatMap((p) => p.content) ?? [];

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">지식 메모</h1>

        <Input
          type="search"
          aria-label="메모 검색"
          placeholder="메모 검색"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={category === undefined ? 'default' : 'outline'}
            aria-pressed={category === undefined}
            onClick={() => setCategory(undefined)}
          >
            전체
          </Button>
          {KNOWLEDGE_CATEGORIES.map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={category === c ? 'default' : 'outline'}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {KNOWLEDGE_CATEGORY_LABELS[c]}
            </Button>
          ))}
        </div>

        <KnowledgeScopeFilter isAdmin={isAdmin} canWrite={canWrite} value={scopes} onChange={handleScopesChange} />

        {stockSymbol && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            aria-label={`${stockName} 필터 해제`}
            onClick={clearStockFilter}
          >
            {stockName}
            <X className="ml-1 h-3 w-3" aria-hidden="true" />
          </Button>
        )}

        {deleteMutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            메모를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
        )}

        {isPending ? (
          <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red-500">메모를 불러오지 못했습니다.</p>
        ) : notes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">메모가 없습니다</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <KnowledgeNoteCard
                key={note.id}
                note={note}
                currentMemberId={member?.id}
                onEdit={(n) => openQuickNote({ note: n })}
                onDelete={(n) => deleteMutation.mutate(n)}
                onTagClick={setKeywordInput}
                onStockClick={handleStockClick}
              />
            ))}
            {hasNextPage && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                더보기
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default KnowledgeNotesPage;
