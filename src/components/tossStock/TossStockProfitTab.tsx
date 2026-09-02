import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { TossCurrency, TossCurrencyTotals, TossRealizedProfit, TossTrade } from '@/types/tossStock';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { api } from '@/lib/api';
import {
  format,
  subDays,
  addDays,
  subWeeks,
  addWeeks,
  subMonths,
  addMonths,
  subYears,
  addYears,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import PeriodSegmentControl, { type PeriodType } from '@/components/stock/PeriodSegmentControl';
import { cn } from '@/lib/utils';
import { STOCK_CARD_BG, STOCK_TEXT_MUTED, STOCK_BORDER, STOCK_SEGMENT_ACTIVE } from '@/lib/stockTheme';
import { formatPercentage, getProfitLossColor } from '@/lib/stockFormat';
import { formatMoney, formatQuantity, formatSignedMoney } from '@/lib/tossFormat';

/** ALL 조회의 시작일. 계좌 개설일보다 앞서면 되고, 앞서도 무해하다. */
const ALL_PERIOD_START_DATE = '2020-01-01';

const formatDateLocal = (date: Date): string => format(date, 'yyyy-MM-dd');

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

const resolveRange = (periodType: PeriodType, anchor: Date): DateRange => {
  switch (periodType) {
    case 'DAILY':
      return {
        startDate: formatDateLocal(anchor),
        endDate: formatDateLocal(anchor),
        label: format(anchor, 'yyyy년 M월 d일', { locale: ko }),
      };
    case 'WEEKLY': {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      const end = endOfWeek(anchor, { weekStartsOn: 1 });
      return {
        startDate: formatDateLocal(start),
        endDate: formatDateLocal(end),
        label: `${format(start, 'M.d', { locale: ko })} ~ ${format(end, 'M.d', { locale: ko })}`,
      };
    }
    case 'YEARLY':
      return {
        startDate: formatDateLocal(startOfYear(anchor)),
        endDate: formatDateLocal(endOfYear(anchor)),
        label: format(anchor, 'yyyy년', { locale: ko }),
      };
    case 'ALL':
      return {
        startDate: ALL_PERIOD_START_DATE,
        endDate: formatDateLocal(new Date()),
        label: '전체 기간',
      };
    case 'MONTHLY':
    default:
      return {
        startDate: formatDateLocal(startOfMonth(anchor)),
        endDate: formatDateLocal(endOfMonth(anchor)),
        label: format(anchor, 'yyyy년 M월', { locale: ko }),
      };
  }
};

/**
 * 오늘이 이 구간 안에(또는 이전에) 들어 있는지.
 * 미래 구간으로 넘어가 봐야 "거래 없음"만 반복되므로 다음 버튼을 여기서 막는다.
 */
const reachesToday = (range: DateRange): boolean => range.endDate >= formatDateLocal(new Date());

const shiftAnchor = (periodType: PeriodType, anchor: Date, direction: -1 | 1): Date => {
  switch (periodType) {
    case 'DAILY':
      return direction === -1 ? subDays(anchor, 1) : addDays(anchor, 1);
    case 'WEEKLY':
      return direction === -1 ? subWeeks(anchor, 1) : addWeeks(anchor, 1);
    case 'YEARLY':
      return direction === -1 ? subYears(anchor, 1) : addYears(anchor, 1);
    case 'MONTHLY':
      return direction === -1 ? subMonths(anchor, 1) : addMonths(anchor, 1);
    default:
      return anchor;
  }
};

type TradeFilter = 'SELL' | 'ALL';

/** 한 종목의 체결을 묶은 것. 같은 종목을 나눠 팔면 이름만 반복되므로 종목 단위로 접는다. */
interface TradeGroup {
  symbol: string;
  name: string;
  currency: TossCurrency;
  trades: TossTrade[];
  sellCount: number;
  buyCount: number;
  /** 실현손익 합계. 매도에만 손익이 붙으므로 매도만 더한다. */
  realizedProfitLoss: number;
  estimated: boolean;
}

const groupTradesBySymbol = (trades: TossTrade[]): TradeGroup[] => {
  const groups = new Map<string, TradeGroup>();

  for (const trade of trades) {
    const existing = groups.get(trade.symbol);
    const group: TradeGroup = existing ?? {
      symbol: trade.symbol,
      name: trade.name,
      currency: trade.currency,
      trades: [],
      sellCount: 0,
      buyCount: 0,
      realizedProfitLoss: 0,
      estimated: false,
    };

    group.trades.push(trade);
    if (trade.tradeType === 'SELL') {
      group.sellCount += 1;
      group.realizedProfitLoss += trade.profitLoss;
    } else {
      group.buyCount += 1;
    }
    group.estimated = group.estimated || trade.estimated;
    groups.set(trade.symbol, group);
  }

  // 실현손익이 큰 종목부터. 통화가 섞여 있어도 절대값 비교는 순서를 정하는 용도로만 쓴다.
  return [...groups.values()].sort(
    (a, b) => Math.abs(b.realizedProfitLoss) - Math.abs(a.realizedProfitLoss)
  );
};

interface TossTradeGroupProps {
  group: TradeGroup;
  textMuted: string;
}

const TossTradeGroup: React.FC<TossTradeGroupProps> = ({ group, textMuted }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => setExpanded((current) => !current);

  return (
    <div
      data-testid={`trade-group-${group.symbol}`}
      className={cn('rounded-lg border overflow-hidden', STOCK_CARD_BG)}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-3 p-4 min-h-[56px] text-left hover:bg-gray-50 dark:hover:bg-gray-800/70"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{group.name}</span>
            {group.estimated && (
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                추정
              </span>
            )}
          </div>
          <p className={cn('text-xs mt-0.5', textMuted)}>
            {group.sellCount > 0 && `매도 ${group.sellCount}건`}
            {group.sellCount > 0 && group.buyCount > 0 && ' · '}
            {group.buyCount > 0 && `매수 ${group.buyCount}건`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {group.sellCount > 0 && (
            <span
              className={cn('font-medium tabular-nums', getProfitLossColor(group.realizedProfitLoss))}
            >
              {formatSignedMoney(group.realizedProfitLoss, group.currency)}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className={cn('px-4 pb-4 pt-1 space-y-3 border-t', STOCK_BORDER)}>
          {group.trades.map((trade, index) => (
            <div
              key={`${trade.tradeDate}-${trade.tradeType}-${index}`}
              className="flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {trade.tradeType === 'BUY' ? '구매' : '판매'} {formatQuantity(trade.quantity)}주
                </p>
                <p className={cn('text-xs mt-0.5 tabular-nums', textMuted)}>
                  {trade.tradeDate} · 주당 {formatMoney(trade.price, trade.currency)}
                </p>
              </div>
              <div className="text-right shrink-0 tabular-nums">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatMoney(trade.amount, trade.currency)}
                </p>
                {trade.tradeType === 'SELL' && (
                  <p className={cn('text-xs font-medium', getProfitLossColor(trade.profitLoss))}>
                    {formatSignedMoney(trade.profitLoss, trade.currency)} (
                    {formatPercentage(trade.profitLossRate)})
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface TossStockProfitTabProps {
  owner: string;
}

const TossStockProfitTab: React.FC<TossStockProfitTabProps> = ({ owner }) => {
  const [periodType, setPeriodType] = useState<PeriodType>('MONTHLY');
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [summary, setSummary] = useState<TossRealizedProfit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>('SELL');

  const range = useMemo(() => resolveRange(periodType, anchor), [periodType, anchor]);

  const visibleTrades = useMemo(() => {
    const trades = summary?.trades ?? [];
    return tradeFilter === 'SELL' ? trades.filter((trade) => trade.tradeType === 'SELL') : trades;
  }, [summary, tradeFilter]);

  const tradeGroups = useMemo(() => groupTradesBySymbol(visibleTrades), [visibleTrades]);

  const fetchSummary = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTossRealizedProfit({
        owner,
        startDate: range.startDate,
        endDate: range.endDate,
      });
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '수익 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [owner, range.startDate, range.endDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handlePeriodChange = (value: PeriodType) => {
    setPeriodType(value);
    setAnchor(new Date());
  };
  const handlePrev = () => setAnchor((current) => shiftAnchor(periodType, current, -1));
  const handleNext = () => setAnchor((current) => shiftAnchor(periodType, current, 1));

  const textMuted = STOCK_TEXT_MUTED;
  const canNavigate = periodType !== 'ALL';
  // 미래 구간으로 넘어가면 "거래 없음"만 반복되므로 오늘이 든 구간에서 멈춘다.
  const canGoNext = canNavigate && !reachesToday(range);
  const emptyMessage =
    tradeFilter === 'SELL'
      ? `${range.label}에는 매도한 종목이 없어요.`
      : `${range.label}에는 거래 내역이 없어요.`;

  const renderTotals = (totals: TossCurrencyTotals) => (
    <div key={totals.currency} className={cn('p-4 rounded-xl border', STOCK_CARD_BG)}>
      <div className="flex items-baseline justify-between">
        <p className={cn('text-sm', textMuted)}>
          실현손익{totals.currency === 'USD' ? ' (해외)' : ''}
        </p>
        <p className={cn('text-xs', textMuted)}>{totals.tradeCount}건</p>
      </div>
      <p className={cn('text-2xl font-bold mt-1', getProfitLossColor(totals.totalProfitLoss))}>
        {totals.totalProfitLoss >= 0 ? '+' : ''}
        {formatMoney(totals.totalProfitLoss, totals.currency)}
      </p>
      <p className={cn('text-sm mt-0.5 font-medium', getProfitLossColor(totals.totalProfitLossRate))}>
        {formatPercentage(totals.totalProfitLossRate)}
      </p>

      <div className={cn('mt-4 pt-4 border-t space-y-2 text-sm', STOCK_BORDER)}>
        <div className="flex justify-between">
          <span className={textMuted}>매수금액</span>
          <span className="font-medium">{formatMoney(totals.totalBuyAmount, totals.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className={textMuted}>매도금액</span>
          <span className="font-medium">{formatMoney(totals.totalSellAmount, totals.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className={textMuted}>수수료</span>
          <span className="font-medium">{formatMoney(totals.totalFee, totals.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className={textMuted}>제세금</span>
          <span className="font-medium">{formatMoney(totals.totalTax, totals.currency)}</span>
        </div>
      </div>
    </div>
  );

  const renderBody = () => {
    if (loading && !summary) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className={textMuted}>수익 정보를 불러오는 중...</p>
        </div>
      );
    }

    if (error && !summary) {
      return (
        <div className="py-16 text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchSummary} disabled={loading}>
            다시 시도
          </Button>
        </div>
      );
    }

    if (!summary || summary.trades.length === 0) {
      return <div className={cn('py-16 text-center', textMuted)}>{emptyMessage}</div>;
    }

    return (
      <div className="space-y-4">
        {/* 실현손익 API 가 없어 주문 체결로 직접 계산한 값이다. 원가가 불완전하면 사용자에게 알린다. */}
        {summary.estimated && (
          <div
            className={cn(
              'flex items-start gap-2 p-3 rounded-lg text-sm',
              'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
            )}
          >
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              주문 이력보다 앞서 매수한 종목이 있어 일부 손익은 보유 평균단가를 기준으로 한 추정치입니다.
            </span>
          </div>
        )}

        {summary.totals.map(renderTotals)}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className={cn('text-sm font-medium', textMuted)}>
              {tradeFilter === 'SELL' ? `매도 ${visibleTrades.length}건` : `거래 ${visibleTrades.length}건`}
            </p>
            {/* 실현손익이 붙는 것은 매도뿐이라, 매수까지 섞으면 손익 칸이 빈 줄이 절반이 된다. */}
            <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
              <button
                type="button"
                aria-pressed={tradeFilter === 'SELL'}
                className={cn('px-3 py-1.5', tradeFilter === 'SELL' ? STOCK_SEGMENT_ACTIVE : textMuted)}
                onClick={() => setTradeFilter('SELL')}
              >
                매도만
              </button>
              <button
                type="button"
                aria-pressed={tradeFilter === 'ALL'}
                className={cn('px-3 py-1.5', tradeFilter === 'ALL' ? STOCK_SEGMENT_ACTIVE : textMuted)}
                onClick={() => setTradeFilter('ALL')}
              >
                전체 거래
              </button>
            </div>
          </div>

          {tradeGroups.length === 0 ? (
            <p className={cn('py-10 text-center text-sm', textMuted)}>{emptyMessage}</p>
          ) : (
            tradeGroups.map((group) => (
              <TossTradeGroup key={group.symbol} group={group} textMuted={textMuted} />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-6">
      <PeriodSegmentControl value={periodType} onChange={handlePeriodChange} />

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          disabled={!canNavigate}
          aria-label="이전 기간"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{range.label}</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="다음 기간"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {renderBody()}

      <Button variant="outline" className="w-full min-h-[44px]" onClick={fetchSummary} disabled={loading}>
        <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
        새로고침
      </Button>
    </div>
  );
};

export default TossStockProfitTab;
