import React, { useState, useMemo } from 'react';
import { StockHolding, TradingProfitLoss } from '@/types';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
const formatPercentage = (rate: number) =>
  `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`;

const getProfitLossColor = (amount: number) => {
  if (amount > 0) return 'text-red-500 dark:text-red-400';
  if (amount < 0) return 'text-blue-500 dark:text-blue-400';
  return 'text-gray-400 dark:text-gray-500';
};

const getInitials = (stockName: string) => {
  if (!stockName || stockName.length === 0) return '?';
  const chars = stockName.replace(/\s/g, '').slice(0, 2);
  return chars.toUpperCase();
};

const parseLocalDate = (value: string): Date => {
  if (!value || typeof value !== 'string') return new Date(NaN);
  const parts = value.split(/[-/T]/);
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 1;
  const d = parseInt(parts[2], 10) || 1;
  if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date(NaN);
  return new Date(y, m - 1, d);
};

const isDateValid = (date: Date) => !isNaN(date.getTime());

const formatDateSafe = (date: Date, formatStr: string, fallback: string): string => {
  if (!date || !isDateValid(date)) return fallback;
  try {
    return format(date, formatStr, { locale: ko });
  } catch {
    return fallback;
  }
};

export type DisplayMode = 'currentPrice' | 'marketValue';

interface StockHoldingListItemProps {
  holding: StockHolding;
  displayMode: DisplayMode;
  isMobile: boolean;
  dark?: boolean;
  trades?: TradingProfitLoss[];
}

const StockHoldingListItem: React.FC<StockHoldingListItemProps> = ({
  holding,
  displayMode,
  isMobile,
  dark,
  trades = [],
}) => {
  const [expanded, setExpanded] = useState(false);
  const [tradeSortOrder, setTradeSortOrder] = useState<'desc' | 'asc'>('desc'); // desc=최신순
  const textMuted = dark ? 'text-gray-400' : 'text-gray-600';
  const cardBg = dark ? 'bg-gray-800/50' : 'bg-white';
  const borderColor = dark ? 'border-gray-700' : 'border-gray-200';

  const tradesGrouped = useMemo(() => {
    const sorted = [...trades].sort((a, b) => {
      // 먼저 날짜순 정렬
      const dateCompare =
        tradeSortOrder === 'desc'
          ? b.tradeDate.localeCompare(a.tradeDate)
          : a.tradeDate.localeCompare(b.tradeDate);
      if (dateCompare !== 0) return dateCompare;

      // 같은 날짜면 매수(BUY)를 먼저 표시
      if (a.tradeType === 'BUY' && b.tradeType === 'SELL') return -1;
      if (a.tradeType === 'SELL' && b.tradeType === 'BUY') return 1;

      return 0;
    });
    const byDate: Record<string, TradingProfitLoss[]> = {};
    for (const t of sorted) {
      if (!byDate[t.tradeDate]) byDate[t.tradeDate] = [];
      byDate[t.tradeDate].push(t);
    }
    const entries = Object.entries(byDate);
    entries.sort(([a], [b]) =>
      tradeSortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b)
    );
    return entries;
  }, [trades, tradeSortOrder]);

  const detailSection = (
    <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-5">
      {/* 1주 평균금액 섹션 */}
      <div>
        <p className={cn('text-xs', textMuted)}>1주 평균금액</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
          {formatCurrency(holding.averagePrice)}
        </p>
        <p className={cn('text-xs mt-1 flex items-center gap-1', textMuted)}>
          <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          수수료·세금 포함
        </p>
      </div>

      {/* 재무 정보 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className={cn('text-sm', textMuted)}>보유 수량</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}주
          </span>
        </div>
        <div className="flex justify-between items-start">
          <span className={cn('text-sm', textMuted)}>총 금액</span>
          <div className="text-right">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(holding.marketValue)}
            </p>
            <p className={cn('text-sm', getProfitLossColor(holding.profitLoss))}>
              {holding.profitLoss >= 0 ? '+' : ''}
              {formatCurrency(holding.profitLoss)} ({formatPercentage(holding.profitLossRate)})
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className={cn('text-sm', textMuted)}>투자 원금</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(holding.purchasePrice)}
          </span>
        </div>
      </div>

      {/* 거래 내역 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className={cn('text-sm font-medium', textMuted)}>거래 내역</p>
          <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 min-w-[60px]',
                tradeSortOrder === 'desc'
                  ? dark
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-gray-900 text-white'
                  : textMuted
              )}
              onClick={() => setTradeSortOrder('desc')}
            >
              최신순
            </button>
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 min-w-[60px]',
                tradeSortOrder === 'asc'
                  ? dark
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-gray-900 text-white'
                  : textMuted
              )}
              onClick={() => setTradeSortOrder('asc')}
            >
              오래된순
            </button>
          </div>
        </div>
        <div
          className={cn(
            'space-y-4',
            isMobile ? 'max-h-[280px] overflow-y-auto scrollbar-hide' : ''
          )}
        >
          {tradesGrouped.length === 0 ? (
            <p className={cn('py-6 text-center text-sm', textMuted)}>거래 내역이 없습니다.</p>
          ) : (
            tradesGrouped.map(([dateStr, dayTrades], groupIdx) => {
              const date = parseLocalDate(dateStr);
              const year = isDateValid(date) ? date.getFullYear() : null;
              const prevGroup = tradesGrouped[groupIdx - 1];
              const prevDate = prevGroup ? parseLocalDate(prevGroup[0]) : null;
              const prevYear =
                prevDate && isDateValid(prevDate) ? prevDate.getFullYear() : null;
              const showYearSeparator =
                prevYear !== null && year !== null && prevYear !== year;

              return (
                <div key={dateStr}>
                  {showYearSeparator && (
                    <p className={cn('text-sm font-medium mb-2', textMuted)}>
                      {year != null ? `${year}년` : ''}
                    </p>
                  )}
                  <div className="space-y-2">
                    {dayTrades.map((t, i) => (
                      <div
                        key={`${dateStr}-${t.tradeType}-${i}`}
                        className="flex items-center justify-between py-2 min-h-[44px]"
                      >
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
                            {i === 0 ? formatDateSafe(date, 'M.d', dateStr) : ''}
                          </span>
                          <span
                            className={cn(
                              'text-sm font-medium truncate',
                              t.tradeType === 'SELL'
                                ? 'text-blue-500 dark:text-blue-400'
                                : 'text-gray-900 dark:text-gray-100'
                            )}
                          >
                            {t.tradeType === 'BUY' ? '구매' : '판매'} {t.quantity}주
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0 ml-2">
                          주당 {formatCurrency(t.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const dayChangeRate = holding.dayChangeRate;
  const dayChangeDisplay =
    dayChangeRate != null
      ? `${dayChangeRate >= 0 ? '+' : ''}${dayChangeRate.toFixed(1)}%`
      : '—';

  if (isMobile) {
    return (
      <div className={cn('rounded-lg border', borderColor, cardBg)}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
          className="flex items-center gap-3 p-4 min-h-[56px] active:bg-gray-50 dark:active:bg-gray-800/70"
        >
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold text-white shrink-0">
            {getInitials(holding.stockName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {holding.stockName}
            </div>
            {displayMode === 'currentPrice' ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                내 평균 {formatCurrency(holding.averagePrice)}
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}주
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            {displayMode === 'currentPrice' ? (
              <>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(holding.currentPrice)}
                </div>
                {dayChangeRate != null && (
                  <div className={cn('text-sm font-medium', getProfitLossColor(dayChangeRate))}>
                    {dayChangeDisplay}
                  </div>
                )}
              </>
            ) : ( 
              <>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(holding.marketValue)}
                </div>
                <div className={cn('text-sm font-medium', getProfitLossColor(holding.profitLoss))}>
                  {holding.profitLoss >= 0 ? '+' : ''}
                  {formatCurrency(holding.profitLoss)} ({formatPercentage(holding.profitLossRate)})
                </div>
              </>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
          )}
        </div>
        {expanded && detailSection}
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border', borderColor, cardBg)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
        className="flex items-center justify-between p-4 min-h-[56px] hover:bg-gray-50 dark:hover:bg-gray-800/70 cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold text-white shrink-0">
            {getInitials(holding.stockName)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {holding.stockName}
            </div>
            {displayMode === 'currentPrice' ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                내 평균 {formatCurrency(holding.averagePrice)}
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}주
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          {displayMode === 'currentPrice' ? (
            <>
              <div className="text-right">
                <p className={cn('text-xs', textMuted)}>현재가</p>
                <p className="font-medium">{formatCurrency(holding.currentPrice)}</p>
                {dayChangeRate != null && (
                  <p className={cn('text-sm font-medium', getProfitLossColor(dayChangeRate))}>
                    {dayChangeDisplay}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-right">
                <p className={cn('text-xs', textMuted)}>총 금액</p>
                <p className="font-medium">{formatCurrency(holding.marketValue)}</p>
              </div>
              <div className="text-right">
                <p className={cn('text-xs', textMuted)}>수익금</p>
                <div className={cn('font-semibold', getProfitLossColor(holding.profitLoss))}>
                  {holding.profitLoss >= 0 ? '+' : ''}
                  {formatCurrency(holding.profitLoss)} ({formatPercentage(holding.profitLossRate)})
                </div>
              </div>
            </>
          )}
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
          )}
        </div>
      </div>
      {expanded && detailSection}
    </div>
  );
};

export default StockHoldingListItem;
