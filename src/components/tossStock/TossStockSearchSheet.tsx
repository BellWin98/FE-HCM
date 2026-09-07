import React, { useEffect, useRef } from 'react';
import type { TossStockSearchResult } from '@/types/tossStock';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STOCK_TEXT_MUTED } from '@/lib/stockTheme';
import { useTossStockSearch } from '@/hooks/useTossStockSearch';

interface TossStockSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (stock: TossStockSearchResult) => void;
}

/**
 * 종목 검색 시트.
 *
 * 보유하지 않은 종목을 사려면 먼저 찾을 수 있어야 한다 — 자산 화면이 보유 종목만 보여 주는 한
 * 새 종목 매수는 토스 앱으로 나가야 끝난다.
 *
 * `ui/command`(cmdk)를 쓰지 않는다. cmdk 는 정적 목록을 클라이언트에서 거르는 것이 전제라
 * 서버가 이미 순위를 매겨 준 결과를 한 번 더 걸러 버리고(그 과정에서 순서가 뒤집힌다),
 * 접근성 트리도 테스트에서 다루기 번거롭다. 평범한 입력 + listbox 가 더 정확하다.
 */
const TossStockSearchSheet: React.FC<TossStockSearchSheetProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  const { query, setQuery, results, status, reset } = useTossStockSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  // 시트를 닫으면 다음에 열었을 때 이전 질의가 남아 있지 않게 한다.
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleSelect = (stock: TossStockSearchResult): void => {
    onSelect(stock);
    onOpenChange(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent, stock: TossStockSearchResult): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(stock);
    }
  };

  const renderBody = () => {
    if (status === 'idle') {
      return (
        <p className={cn('py-10 text-center text-sm', STOCK_TEXT_MUTED)}>
          종목명이나 종목 코드를 두 글자 이상 입력해주세요.
        </p>
      );
    }
    if (status === 'loading') {
      return (
        <div className="space-y-2 py-2" aria-busy="true" aria-live="polite">
          <span className="sr-only">종목을 검색하는 중입니다.</span>
          {[0, 1, 2, 3].map((row) => (
            <div key={row} aria-hidden="true" className="h-[52px] animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      );
    }
    if (status === 'error') {
      return (
        <p className={cn('py-10 text-center text-sm', STOCK_TEXT_MUTED)} aria-live="polite">
          종목을 검색하지 못했어요. 잠시 후 다시 시도해주세요.
        </p>
      );
    }
    if (results.length === 0) {
      return (
        <p className={cn('py-10 text-center text-sm', STOCK_TEXT_MUTED)} aria-live="polite">
          검색 결과가 없습니다.
        </p>
      );
    }

    return (
      <ul role="listbox" aria-label="검색 결과" className="divide-y divide-gray-100 dark:divide-gray-800">
        {results.map((stock) => (
          <li key={`${stock.market}-${stock.symbol}`}>
            <div
              role="option"
              aria-selected={false}
              tabIndex={0}
              onClick={() => handleSelect(stock)}
              onKeyDown={(event) => handleKeyDown(event, stock)}
              className={cn(
                'flex min-h-[56px] cursor-pointer items-center justify-between gap-3 px-1 py-3',
                'hover:bg-gray-50 dark:hover:bg-gray-800/70'
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900 dark:text-gray-100">{stock.name}</p>
                <p className={cn('text-xs tabular-nums', STOCK_TEXT_MUTED)}>{stock.symbol}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {stock.securityType === 'ETF' || stock.securityType === 'ETN' ? (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {stock.securityType}
                  </span>
                ) : null}
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {stock.marketCountry}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>종목 검색</SheetTitle>
        </SheetHeader>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="종목명 또는 종목 코드"
            aria-label="종목 검색"
            className="min-h-[48px] pl-9"
          />
        </div>

        <div className="mt-2">{renderBody()}</div>
      </SheetContent>
    </Sheet>
  );
};

export default TossStockSearchSheet;
