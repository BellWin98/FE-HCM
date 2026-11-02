import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useQuickNote } from '@/contexts/QuickNoteContext';
import { api } from '@/lib/api';
import { KNOWLEDGE_NOTES_QUERY_KEY, useKnowledgeAccess } from '@/hooks/useKnowledgeAccess';
import { cn } from '@/lib/utils';
import { STOCK_BORDER } from '@/lib/stockTheme';
import NoteImageStrip from '@/components/knowledge/NoteImageStrip';
import NoteImageViewer from '@/components/knowledge/NoteImageViewer';

interface StockNotesPanelProps {
  symbol: string | null;
  stockName: string;
}

const StockNotesPanelBody = ({ symbol, stockName }: { symbol: string; stockName: string }) => {
  const { openQuickNote } = useQuickNote();
  const [expanded, setExpanded] = useState(false);
  // 뷰어는 목록이 접히거나 바뀌어도 유지되도록 패널 단위로 한 벌만 둔다.
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // 메모는 보조 정보다 — 느리거나 실패해도 주문 화면은 그대로 쓸 수 있어야 하므로 오류는 삼킨다.
  const { data, isError } = useQuery({
    queryKey: [...KNOWLEDGE_NOTES_QUERY_KEY, 'stock', symbol],
    queryFn: () => api.searchKnowledgeNotes({ stockSymbol: symbol, size: 20 }),
    retry: false,
    staleTime: 30_000,
  });

  // 불러오는 중이거나 실패했으면 아무것도 그리지 않는다(자리만 차지하지 않게).
  // 실패 시 캐시에 남은 이전 데이터(권한을 잃기 전·다른 사용자)도 보여주지 않는다.
  if (!data || isError) return null;

  const notes = data.content;
  const total = data.totalElements ?? notes.length;

  const writeButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() =>
        openQuickNote({ prefill: { category: 'STOCK', stockSymbol: symbol, stockName } })
      }
    >
      이 종목 메모 쓰기
    </Button>
  );

  if (notes.length === 0) {
    return (
      <section aria-label="이 종목 메모" className={cn('rounded-lg border px-3 py-1', STOCK_BORDER)}>
        {writeButton}
      </section>
    );
  }

  const shown = expanded ? notes : notes.slice(0, 1);

  return (
    <section aria-label="이 종목 메모" className={cn('space-y-2 rounded-lg border p-3', STOCK_BORDER)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">이 종목 메모 {total}건</h3>
        {/* 메모가 1건이어도 긴 내용은 줄임 처리되므로 항상 펼칠 수 있어야 한다. */}
        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '메모 접기' : '메모 펼치기'}
        </Button>
      </div>
      <ul className="space-y-2">
        {shown.map((note) => (
          <li key={note.id} className="text-sm">
            {note.content && (
              <p className={cn('whitespace-pre-wrap break-words', !expanded && 'line-clamp-2')}>
                {note.content}
              </p>
            )}
            <NoteImageStrip
              images={note.images}
              size="sm"
              onOpen={(index) => {
                setViewer({ images: note.images, index });
                setViewerOpen(true);
              }}
            />
            <span className="text-xs text-muted-foreground">{note.createdAt.slice(0, 10)}</span>
          </li>
        ))}
      </ul>
      {writeButton}
      {viewer && (
        <NoteImageViewer
          images={viewer.images}
          startIndex={viewer.index}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      )}
    </section>
  );
};

/**
 * 주문·정정 시트에 끼우는 종목 메모 패널. 권한이 없거나 종목이 없으면 아무것도 그리지 않고 API 도 부르지 않는다.
 * 빠른 메모 다이얼로그는 Provider 가 시트 바깥에서 그리므로 여기서는 열기만 요청한다.
 */
export const StockNotesPanel = ({ symbol, stockName }: StockNotesPanelProps) => {
  const { hasAccess } = useKnowledgeAccess();
  if (!hasAccess || !symbol) return null;
  return <StockNotesPanelBody symbol={symbol} stockName={stockName} />;
};
