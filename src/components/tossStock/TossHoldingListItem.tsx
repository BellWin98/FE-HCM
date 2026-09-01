import React, { useState, useMemo } from 'react';
import type { TossHolding, TossTrade } from '@/types/tossStock';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { STOCK_TEXT_MUTED, STOCK_BORDER, STOCK_SEGMENT_ACTIVE } from '@/lib/stockTheme';
import { formatPercentage, getProfitLossColor, getInitials } from '@/lib/stockFormat';
import { formatMoney, formatQuantity } from '@/lib/tossFormat';

export type TossDisplayMode = 'currentPrice' | 'marketValue';

const parseLocalDate = (value: string): Date => {
  if (!value) return new Date(NaN);
  const parts = value.split(/[-/T]/);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) || 1;
  const day = parseInt(parts[2], 10) || 1;
  if (isNaN(year)) return new Date(NaN);
  return new Date(year, month - 1, day);
};

const isDateValid = (date: Date): boolean => !isNaN(date.getTime());

const formatDateSafe = (date: Date, formatStr: string, fallback: string): string => {
  if (!isDateValid(date)) return fallback;
  try {
    return format(date, formatStr, { locale: ko });
  } catch {
    return fallback;
  }
};

interface TossHoldingListItemProps {
  holding: TossHolding;
  displayMode: TossDisplayMode;
  isMobile: boolean;
  trades?: TossTrade[];
}

/**
 * 보유 종목 한 줄. 한투 화면(StockHoldingListItem)의 디자인을 따르되 토스 데이터 구조에 맞춘다.
 * 가장 큰 차이는 통화다 — 모든 금액을 종목의 거래통화로 포맷해야 달러 종목이 원화로 표시되지 않는다.
 */
const TossHoldingListItem: React.FC<TossHoldingListItemProps> = ({
  holding,
  displayMode,
  isMobile,
  trades = [],
}) => {
  const [expanded, setExpanded] = useState(false);
  const [tradeSortOrder, setTradeSortOrder] = useState<'desc' | 'asc'>('desc');

  const currency = holding.currency;
  const money = (amount: number): string => formatMoney(amount, currency);
  const textMuted = STOCK_TEXT_MUTED;

  const tradesGrouped = useMemo(() => {
    const sorted = [...trades].sort((a, b) => {
      const dateCompare =
        tradeSortOrder === 'desc'
          ? b.tradeDate.localeCompare(a.tradeDate)
          : a.tradeDate.localeCompare(b.tradeDate);
      if (dateCompare !== 0) return dateCompare;
      // 같은 날짜면 매수를 먼저 보여준다.
      if (a.tradeType === 'BUY' && b.tradeType === 'SELL') return -1;
      if (a.tradeType === 'SELL' && b.tradeType === 'BUY') return 1;
      return 0;
    });

    const byDate: Record<string, TossTrade[]> = {};
    for (const trade of sorted) {
      byDate[trade.tradeDate] = byDate[trade.tradeDate] ?? [];
      byDate[trade.tradeDate].push(trade);
    }
    return Object.entries(byDate).sort(([a], [b]) =>
      tradeSortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b)
    );
  }, [trades, tradeSortOrder]);

  const handleToggle = () => setExpanded((current) => !current);
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  const dailyRate = holding.dailyProfitLossRate;
  const dailyRateDisplay = `${dailyRate >= 0 ? '+' : ''}${dailyRate.toFixed(1)}%`;

  const detailSection = (
    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-5">
      <div>
        <p className={cn('text-xs', textMuted)}>1주 평균금액</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
          {money(holding.averagePurchasePrice)}
        </p>
        <p className={cn('text-xs mt-1 flex items-center gap-1', textMuted)}>
          <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          수수료·세금 포함
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className={cn('text-sm', textMuted)}>보유 수량</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatQuantity(holding.quantity)}주
          </span>
        </div>
        <div className="flex justify-between items-start">
          <span className={cn('text-sm', textMuted)}>총 금액</span>
          <div className="text-right">
            <p className="font-medium text-gray-900 dark:text-gray-100">{money(holding.marketValue)}</p>
            <p className={cn('text-sm', getProfitLossColor(holding.profitLoss))}>
              {holding.profitLoss >= 0 ? '+' : ''}
              {money(holding.profitLoss)} ({formatPercentage(holding.profitLossRate)})
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className={cn('text-sm', textMuted)}>투자 원금</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {money(holding.purchaseAmount)}
          </span>
        </div>
        <div className="flex justify-between items-start">
          <span className={cn('text-sm', textMuted)}>비용 공제 후 손익</span>
          <div className="text-right">
            <p className={cn('font-medium', getProfitLossColor(holding.profitLossAfterCost))}>
              {holding.profitLossAfterCost >= 0 ? '+' : ''}
              {money(holding.profitLossAfterCost)} ({formatPercentage(holding.profitLossRateAfterCost)})
            </p>
            <p className={cn('text-xs mt-0.5', textMuted)}>
              수수료 {money(holding.commission)} · 세금 {money(holding.tax)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className={cn('text-sm font-medium', textMuted)}>거래 내역</p>
          <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
            <button
              type="button"
              className={cn('px-2.5 py-1 min-w-[60px]', tradeSortOrder === 'desc' ? STOCK_SEGMENT_ACTIVE : textMuted)}
              onClick={() => setTradeSortOrder('desc')}
            >
              최신순
            </button>
            <button
              type="button"
              className={cn('px-2.5 py-1 min-w-[60px]', tradeSortOrder === 'asc' ? STOCK_SEGMENT_ACTIVE : textMuted)}
              onClick={() => setTradeSortOrder('asc')}
            >
              오래된순
            </button>
          </div>
        </div>
        <div className={cn('space-y-4', isMobile && 'max-h-[280px] overflow-y-auto scrollbar-hide')}>
          {tradesGrouped.length === 0 ? (
            <p className={cn('py-6 text-center text-sm', textMuted)}>거래 내역이 없습니다.</p>
          ) : (
            tradesGrouped.map(([dateStr, dayTrades]) => {
              const date = parseLocalDate(dateStr);
              return (
                <div key={dateStr} className="space-y-2">
                  {dayTrades.map((trade, index) => (
                    <div
                      key={`${dateStr}-${trade.tradeType}-${index}`}
                      className="flex items-center justify-between py-2 min-h-[44px]"
                    >
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
                          {index === 0 ? formatDateSafe(date, 'M.d', dateStr) : ''}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-medium truncate',
                            trade.tradeType === 'SELL'
                              ? 'text-blue-500 dark:text-blue-400'
                              : 'text-gray-900 dark:text-gray-100'
                          )}
                        >
                          {trade.tradeType === 'BUY' ? '구매' : '판매'} {formatQuantity(trade.quantity)}주
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0 ml-2">
                        주당 {formatMoney(trade.price, trade.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const header = (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-start gap-2.5 p-4 min-h-[56px]',
        isMobile
          ? 'active:bg-gray-50 dark:active:bg-gray-800/70'
          : 'items-center hover:bg-gray-50 dark:hover:bg-gray-800/70 cursor-pointer'
      )}
    >
      <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
        {getInitials(holding.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900 dark:text-gray-100 break-words leading-snug">
            {holding.name}
          </span>
          {holding.marketCountry === 'US' && (
            <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              USD
            </span>
          )}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
          {displayMode === 'currentPrice'
            ? `내 평균 ${money(holding.averagePurchasePrice)}`
            : `${formatQuantity(holding.quantity)}주`}
        </div>
      </div>
      <div className="text-right shrink-0 tabular-nums">
        {displayMode === 'currentPrice' ? (
          <>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap leading-snug">
              {money(holding.lastPrice)}
            </div>
            <div className={cn('text-xs font-medium whitespace-nowrap mt-0.5', getProfitLossColor(dailyRate))}>
              {dailyRateDisplay}
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap leading-snug">
              {money(holding.marketValue)}
            </div>
            <div className={cn('text-xs font-medium whitespace-nowrap mt-0.5', getProfitLossColor(holding.profitLoss))}>
              {holding.profitLoss >= 0 ? '+' : ''}
              {money(holding.profitLoss)} ({formatPercentage(holding.profitLossRate)})
            </div>
          </>
        )}
      </div>
      {expanded ? (
        <ChevronUp className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
      )}
    </div>
  );

  return (
    <div className={cn('rounded-lg border bg-white dark:bg-gray-800/50', STOCK_BORDER)}>
      {header}
      {expanded && detailSection}
    </div>
  );
};

export default TossHoldingListItem;
