import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { TossRealizedProfit, TossCurrencyTotals } from '@/types/tossStock';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight, Info } from 'lucide-react';
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
import { STOCK_CARD_BG, STOCK_TEXT_MUTED, STOCK_BORDER } from '@/lib/stockTheme';
import { formatPercentage, getProfitLossColor } from '@/lib/stockFormat';
import { formatMoney, formatQuantity } from '@/lib/tossFormat';

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

interface TossStockProfitTabProps {
  owner: string;
}

const TossStockProfitTab: React.FC<TossStockProfitTabProps> = ({ owner }) => {
  const [periodType, setPeriodType] = useState<PeriodType>('MONTHLY');
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [summary, setSummary] = useState<TossRealizedProfit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => resolveRange(periodType, anchor), [periodType, anchor]);

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
      return <div className={cn('py-16 text-center', textMuted)}>이 기간에는 거래 내역이 없습니다.</div>;
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
          <p className={cn('text-sm font-medium', textMuted)}>거래 내역 {summary.tradeCount}건</p>
          {summary.trades.map((trade, index) => (
            <div
              key={`${trade.tradeDate}-${trade.symbol}-${trade.tradeType}-${index}`}
              className={cn('flex items-start justify-between p-4 rounded-lg border', STOCK_CARD_BG)}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{trade.name}</span>
                  {trade.estimated && (
                    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      추정
                    </span>
                  )}
                </div>
                <p className={cn('text-xs mt-0.5', textMuted)}>
                  {trade.tradeDate} · {trade.tradeType === 'BUY' ? '구매' : '판매'}{' '}
                  {formatQuantity(trade.quantity)}주 · 주당 {formatMoney(trade.price, trade.currency)}
                </p>
              </div>
              <div className="text-right shrink-0 ml-3 tabular-nums">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatMoney(trade.amount, trade.currency)}
                </p>
                {trade.tradeType === 'SELL' && (
                  <p className={cn('text-sm font-medium', getProfitLossColor(trade.profitLoss))}>
                    {trade.profitLoss >= 0 ? '+' : ''}
                    {formatMoney(trade.profitLoss, trade.currency)} ({formatPercentage(trade.profitLossRate)})
                  </p>
                )}
              </div>
            </div>
          ))}
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
          disabled={!canNavigate}
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
