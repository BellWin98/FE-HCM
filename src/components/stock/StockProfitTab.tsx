import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { TradingProfitLossSummary, TradingProfitLossPeriod } from '@/types';
import { groupSellTradesByDate, groupSellTradesByStock } from '@/lib/stockProfit';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { format, subDays, subWeeks, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ko } from 'date-fns/locale';
import PeriodSegmentControl, { PeriodType } from './PeriodSegmentControl';
import ProfitDetailSection, { ProfitMetric, DetailViewMode } from './ProfitDetailSection';
import { formatCurrency, formatPercentage, getProfitLossColor } from '@/lib/stockFormat';
import { cn } from '@/lib/utils';
import { STOCK_CARD_BG, STOCK_TEXT_MUTED } from '@/lib/stockTheme';

const formatDateLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
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

const formatDateSafe = (date: Date, formatStr: string, fallback: string): string => {
  if (!date || isNaN(date.getTime())) return fallback;
  try {
    return format(date, formatStr, { locale: ko });
  } catch {
    return fallback;
  }
};

const PROFIT_TABS: ReadonlyArray<{ key: ProfitMetric; label: string }> = [
  { key: 'sales', label: '판매수익' },
  { key: 'fee', label: '수수료' },
  { key: 'tax', label: '제세금' },
];

const StockProfitTab = () => {
  const [summary, setSummary] = useState<TradingProfitLossSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>('MONTHLY');
  const [navOffset, setNavOffset] = useState(0); // 0=현재, 음수=과거
  const [profitTypeTab, setProfitTypeTab] = useState<ProfitMetric>('sales');
  const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>('daily');

  const handlePeriodTypeChange = (type: PeriodType) => {
    setPeriodType(type);
    setNavOffset(0);
  };

  const appliedPeriod = useMemo((): TradingProfitLossPeriod => {
    const today = new Date();
    switch (periodType) {
      case 'DAILY': {
        const targetDate = subDays(today, Math.abs(navOffset));
        return {
          startDate: formatDateLocal(targetDate),
          endDate: formatDateLocal(targetDate),
          periodType: 'DAILY',
        };
      }
      case 'WEEKLY': {
        const weekEnd = subWeeks(today, Math.abs(navOffset));
        const weekStart = subDays(weekEnd, 6);
        return {
          startDate: formatDateLocal(weekStart),
          endDate: formatDateLocal(weekEnd),
          periodType: 'WEEKLY',
        };
      }
      case 'MONTHLY': {
        const targetMonth = subMonths(today, Math.abs(navOffset));
        const start = startOfMonth(targetMonth);
        const end = endOfMonth(targetMonth);
        const endCapped = end > today ? today : end;
        return {
          startDate: formatDateLocal(start),
          endDate: formatDateLocal(endCapped),
          periodType: 'MONTHLY',
        };
      }
      case 'YEARLY': {
        const targetYear = subYears(today, Math.abs(navOffset));
        const start = startOfYear(targetYear);
        const end = endOfYear(targetYear);
        const endCapped = end > today ? today : end;
        return {
          startDate: formatDateLocal(start),
          endDate: formatDateLocal(endCapped),
          periodType: 'YEARLY',
        };
      }
      case 'ALL':
        return {
          startDate: '2025-01-01',
          endDate: formatDateLocal(today),
          periodType: 'YEARLY',
        };
      default:
        return {
          startDate: formatDateLocal(subMonths(today, 1)),
          endDate: formatDateLocal(today),
          periodType: 'MONTHLY',
        };
    }
  }, [periodType, navOffset]);

  const canGoNext = navOffset < 0;

  // 화살표를 연달아 누르면 무거운 조회가 중첩되고, 늦게 도착한 이전 응답이 최신 응답을
  // 덮어쓸 수 있다. 요청마다 세대 번호를 붙여 마지막 요청의 결과만 반영한다.
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async (): Promise<void> => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTradingProfitLoss(appliedPeriod);
      if (requestId !== requestIdRef.current) return;
      setSummary(data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : '수익 분석을 불러오는데 실패했습니다.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [appliedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periodTitle = useMemo(() => {
    const start = parseLocalDate(appliedPeriod.startDate);
    const end = parseLocalDate(appliedPeriod.endDate);
    if (periodType === 'DAILY') {
      return formatDateSafe(end, 'M월 d일 실현수익', appliedPeriod.endDate + ' 실현수익');
    }
    if (periodType === 'YEARLY') {
      const year = end.getFullYear();
      return `${year}년 실현수익`;
    }
    if (periodType === 'ALL') {
      return '총 실현수익';
    }
    
    if (periodType === 'MONTHLY') {
      const year = end.getFullYear();
      const month = end.getMonth() + 1;
      return `${year}년 ${month}월 실현수익`;
    }
    if (periodType === 'WEEKLY') {
      return `${formatDateSafe(start, 'M/d', appliedPeriod.startDate)} ~ ${formatDateSafe(end, 'M/d', appliedPeriod.endDate)} 실현수익`;
    }
    return `${formatDateSafe(start, 'M/d', appliedPeriod.startDate)} ~ ${formatDateSafe(end, 'M/d', appliedPeriod.endDate)} 실현수익`;
  }, [appliedPeriod, periodType]);

  const salesProfit = summary?.totalProfitLoss ?? 0;
  const fee = summary?.totalFee ?? 0;
  const tax = summary?.totalTax ?? 0;
  const totalRealized = salesProfit - fee - tax;

  // 수수료·제세금은 지출이므로 상세 섹션에 음수로 넘긴다.
  const metricTotals: Record<ProfitMetric, number> = {
    sales: salesProfit,
    fee: -fee,
    tax: -tax,
  };

  const dailyGroups = useMemo(() => groupSellTradesByDate(summary?.trades), [summary?.trades]);
  const tradesByStock = useMemo(() => groupSellTradesByStock(summary?.trades), [summary?.trades]);

  const cardBg = STOCK_CARD_BG;
  const textMuted = STOCK_TEXT_MUTED;

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
        <p className={cn('mt-4', textMuted)}>수익 분석을 불러오는 중...</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline">
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 기간 필터 */}
      <PeriodSegmentControl value={periodType} onChange={handlePeriodTypeChange} />

      {/* 실현수익 요약 */}
      <div className={cn('p-4 rounded-xl border', cardBg)}>
        <div className="flex items-center justify-between mb-4">
          <span className={textMuted}>{periodTitle}</span>
          {periodType !== 'ALL' && (
            <div className="flex items-center gap-1 min-h-[44px]">
              <button
                type="button"
                onClick={() => setNavOffset((o) => o - 1)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="이전 기간"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => setNavOffset((o) => Math.min(0, o + 1))}
                disabled={!canGoNext}
                className={cn(
                  'p-2 rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center',
                  canGoNext
                    ? 'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200'
                    : 'opacity-40 cursor-not-allowed'
                )}
                aria-label="다음 기간"
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          )}
        </div>
        <p className={cn('text-2xl sm:text-3xl font-bold', getProfitLossColor(totalRealized))}>
          {totalRealized >= 0 ? '+' : ''}
          {formatCurrency(totalRealized)}
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className={textMuted}>판매수익</span>
            <span className={getProfitLossColor(salesProfit)}>
              {formatCurrency(salesProfit)}
              {summary?.totalProfitLossRate != null && ` (${formatPercentage(summary.totalProfitLossRate)})`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={textMuted}>수수료</span>
            <span className={getProfitLossColor(-fee)}>-{formatCurrency(fee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={textMuted}>제세금</span>
            <span className={getProfitLossColor(-tax)}>-{formatCurrency(tax)}</span>
          </div>
        </div>
      </div>

      {/* 수익 유형 탭 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 min-h-[44px]">
        {PROFIT_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={profitTypeTab === tab.key}
            onClick={() => setProfitTypeTab(tab.key)}
            className={cn(
              'flex-1 min-h-[44px] text-sm font-medium border-b-2 transition-colors',
              profitTypeTab === tab.key
                ? 'border-red-500 text-red-500 dark:text-red-400'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 선택된 유형의 상세 내역 — 판매수익/수수료/제세금이 동일한 레이아웃을 공유한다. */}
      <ProfitDetailSection
        metric={profitTypeTab}
        total={metricTotals[profitTypeTab]}
        totalRate={summary?.totalProfitLossRate}
        dailyGroups={dailyGroups}
        stockGroups={tradesByStock}
        viewMode={detailViewMode}
        onViewModeChange={setDetailViewMode}
      />

      <Button
        variant="outline"
        className="w-full min-h-[44px]"
        onClick={fetchData}
        disabled={loading}
      >
        <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
        새로고침
      </Button>
    </div>
  );
};

export default StockProfitTab;
