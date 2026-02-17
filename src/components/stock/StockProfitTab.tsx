import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TradingProfitLossSummary,
  TradingProfitLossPeriod,
  TradingProfitLoss,
} from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, subDays, subWeeks, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ko } from 'date-fns/locale';
import PeriodSegmentControl, { PeriodType } from './PeriodSegmentControl';
import { cn } from '@/lib/utils';

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
  if (!stockName?.length) return '?';
  return stockName.replace(/\s/g, '').slice(0, 2).toUpperCase();
};

type ProfitTypeTab = 'sales' | 'fee' | 'tax';
type DetailViewMode = 'daily' | 'stock';

interface StockProfitTabProps {
  dark?: boolean;
}

const StockProfitTab: React.FC<StockProfitTabProps> = ({ dark }) => {
  const isMobile = useIsMobile();
  const [summary, setSummary] = useState<TradingProfitLossSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>('MONTHLY');
  const [navOffset, setNavOffset] = useState(0); // 0=현재, 음수=과거
  const [profitTypeTab, setProfitTypeTab] = useState<ProfitTypeTab>('sales');
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.getTradingProfitLoss({
        ...appliedPeriod,
        periodType: appliedPeriod.periodType,
      })) as TradingProfitLossSummary;
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '수익 분석을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
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

  const tradesByDate = useMemo(() => {
    if (!summary?.trades?.length) return {};
    const sellTrades = summary.trades.filter((t) => t.tradeType === 'SELL');
    return sellTrades.reduce((acc, t) => {
      if (!acc[t.tradeDate]) acc[t.tradeDate] = [];
      acc[t.tradeDate].push(t);
      return acc;
    }, {} as Record<string, TradingProfitLoss[]>);
  }, [summary?.trades]);

  const tradesByStock = useMemo(() => {
    if (!summary?.trades?.length) return [];
    const sellTrades = summary.trades.filter((t) => t.tradeType === 'SELL');
    const map = new Map<
      string,
      { name: string; code: string; profit: number; rate: number; fee: number; tax: number; count: number }
    >();
    for (const t of sellTrades) {
      const existing = map.get(t.stockCode);
      if (existing) {
        existing.profit += t.profitLoss;
        existing.count += 1;
      } else {
        map.set(t.stockCode, {
          name: t.stockName,
          code: t.stockCode,
          profit: t.profitLoss,
          rate: t.profitLossRate,
          fee: t.fee,
          tax: t.tax,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [summary?.trades]);

  const cardBg = dark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200';
  const textMuted = dark ? 'text-gray-400' : 'text-gray-600';

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
      <PeriodSegmentControl value={periodType} onChange={handlePeriodTypeChange} dark={dark} />

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
        {[
          { key: 'sales' as const, label: '판매수익' },
          { key: 'fee' as const, label: '수수료' },
          { key: 'tax' as const, label: '제세금' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
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

      {/* 판매수익 상세 */}
      {profitTypeTab === 'sales' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className={cn('text-xl font-bold', getProfitLossColor(salesProfit))}>
              {formatCurrency(salesProfit)}
              {summary?.totalProfitLossRate != null && ` (${formatPercentage(summary.totalProfitLossRate)})`}
            </p>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
              <button
                type="button"
                className={cn(
                  'px-3 py-2 text-sm min-h-[40px]',
                  detailViewMode === 'daily' ? 'bg-gray-200 dark:bg-gray-700' : textMuted
                )}
                onClick={() => setDetailViewMode('daily')}
              >
                일별
              </button>
              <button
                type="button"
                className={cn(
                  'px-3 py-2 text-sm min-h-[40px]',
                  detailViewMode === 'stock' ? 'bg-gray-200 dark:bg-gray-700' : textMuted
                )}
                onClick={() => setDetailViewMode('stock')}
              >
                종목별 합계
              </button>
            </div>
          </div>

          {detailViewMode === 'daily' && (
            <div className="space-y-4 overflow-y-auto max-h-[400px]">
              {Object.entries(tradesByDate)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([dateStr, trades]) => {
                  const date = parseLocalDate(dateStr);
                  const dayProfit = trades.reduce((s, t) => s + t.profitLoss, 0);
                  const dayRate = trades[0]?.profitLossRate ?? 0;
                  return (
                    <div key={dateStr}>
                      <div className="text-sm font-medium mb-2">
                        {formatDateSafe(date, 'M월 d일 (EEE)', dateStr)} ·{' '}
                        <span className={getProfitLossColor(dayProfit)}>
                          {formatCurrency(dayProfit)} ({formatPercentage(dayRate)})
                        </span>
                      </div>
                      <div className="space-y-2 pl-2">
                        {trades.map((t, i) => (
                          <div
                            key={`${t.stockCode}-${i}`}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-lg min-h-[56px]',
                              cardBg,
                              dark ? 'border border-gray-700' : 'border border-gray-200'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold text-white">
                                {getInitials(t.stockName)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {t.stockName}
                                </div>
                                <div className={cn('text-sm', getProfitLossColor(t.profitLoss))}>
                                  {formatCurrency(t.profitLoss)} ({formatPercentage(t.profitLossRate)})
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              {Object.keys(tradesByDate).length === 0 && (
                <div className={cn('py-8 text-center', textMuted)}>거래 내역이 없습니다.</div>
              )}
            </div>
          )}

          {detailViewMode === 'stock' && (
            <div className="space-y-2 overflow-y-auto max-h-[400px]">
              {tradesByStock.map((s) => (
                <div
                  key={s.code}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg min-h-[56px]',
                    cardBg,
                    dark ? 'border border-gray-700' : 'border border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold text-white">
                      {getInitials(s.name)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{s.name}</div>
                      <div className={cn('text-sm', getProfitLossColor(s.profit))}>
                        {formatCurrency(s.profit)}
                        {s.count === 1 && ` (${formatPercentage(s.rate)})`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {tradesByStock.length === 0 && (
                <div className={cn('py-8 text-center', textMuted)}>종목별 내역이 없습니다.</div>
              )}
            </div>
          )}
        </>
      )}

      {/* 수수료 상세 */}
      {profitTypeTab === 'fee' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className={cn('text-xl font-bold', getProfitLossColor(-fee))}>
              -{formatCurrency(fee)}
            </p>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
              <button
                type="button"
                className={cn(
                  'px-3 py-2 text-sm min-h-[40px]',
                  detailViewMode === 'daily' ? 'bg-gray-200 dark:bg-gray-700' : textMuted
                )}
                onClick={() => setDetailViewMode('daily')}
              >
                일별
              </button>
              <button
                type="button"
                className={cn(
                  'px-3 py-2 text-sm min-h-[40px]',
                  detailViewMode === 'stock' ? 'bg-gray-200 dark:bg-gray-700' : textMuted
                )}
                onClick={() => setDetailViewMode('stock')}
              >
                종목별 합계
              </button>
            </div>
          </div>

          {detailViewMode === 'daily' && (
            <div className="space-y-4 overflow-y-auto max-h-[400px]">
              {Object.entries(tradesByDate)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([dateStr, trades]) => {
                  const date = parseLocalDate(dateStr);
                  const dayFee = trades.reduce((s, t) => s + t.fee, 0);
                  return (
                    <div key={dateStr}>
                      <div className="text-sm font-medium mb-2">
                        {formatDateSafe(date, 'M월 d일 (EEE)', dateStr)} ·{' '}
                        <span className={getProfitLossColor(-dayFee)}>
                          -{formatCurrency(dayFee)}
                        </span>
                      </div>
                      <div className="space-y-2 pl-2">
                        {trades.map((t, i) => (
                          <div
                            key={`${t.stockCode}-${i}`}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-lg min-h-[56px]',
                              cardBg,
                              dark ? 'border border-gray-700' : 'border border-gray-200'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold text-white">
                                {getInitials(t.stockName)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {t.stockName}
                                </div>
                                <div className={cn('text-sm', getProfitLossColor(-t.fee))}>
                                  -{formatCurrency(t.fee)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              {Object.keys(tradesByDate).length === 0 && (
                <div className={cn('py-8 text-center', textMuted)}>거래 내역이 없습니다.</div>
              )}
            </div>
          )}

          {detailViewMode === 'stock' && (
            <div className="space-y-2 overflow-y-auto max-h-[400px]">
              {tradesByStock.map((s) => (
                <div
                  key={s.code}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg min-h-[56px]',
                    cardBg,
                    dark ? 'border border-gray-700' : 'border border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold text-white">
                      {getInitials(s.name)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{s.name}</div>
                      <div className={cn('text-sm', getProfitLossColor(-s.fee))}>
                        -{formatCurrency(s.fee)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {tradesByStock.length === 0 && (
                <div className={cn('py-8 text-center', textMuted)}>종목별 내역이 없습니다.</div>
              )}
            </div>
          )}
        </>
      )}

      {/* 제세금 상세 */}
      {profitTypeTab === 'tax' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className={cn('text-xl font-bold', getProfitLossColor(-tax))}>
              -{formatCurrency(tax)}
            </p>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
              <button
                type="button"
                className={cn(
                  'px-3 py-2 text-sm min-h-[40px]',
                  detailViewMode === 'daily' ? 'bg-gray-200 dark:bg-gray-700' : textMuted
                )}
                onClick={() => setDetailViewMode('daily')}
              >
                일별
              </button>
              <button
                type="button"
                className={cn(
                  'px-3 py-2 text-sm min-h-[40px]',
                  detailViewMode === 'stock' ? 'bg-gray-200 dark:bg-gray-700' : textMuted
                )}
                onClick={() => setDetailViewMode('stock')}
              >
                종목별 합계
              </button>
            </div>
          </div>

          {detailViewMode === 'daily' && (
            <div className="space-y-4 overflow-y-auto max-h-[400px]">
              {Object.entries(tradesByDate)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([dateStr, trades]) => {
                  const date = parseLocalDate(dateStr);
                  const dayTax = trades.reduce((s, t) => s + t.tax, 0);
                  return (
                    <div key={dateStr}>
                      <div className="text-sm font-medium mb-2">
                        {formatDateSafe(date, 'M월 d일 (EEE)', dateStr)} ·{' '}
                        <span className={getProfitLossColor(-dayTax)}>
                          -{formatCurrency(dayTax)}
                        </span>
                      </div>
                      <div className="space-y-2 pl-2">
                        {trades.map((t, i) => (
                          <div
                            key={`${t.stockCode}-${i}`}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-lg min-h-[56px]',
                              cardBg,
                              dark ? 'border border-gray-700' : 'border border-gray-200'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold text-white">
                                {getInitials(t.stockName)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {t.stockName}
                                </div>
                                <div className={cn('text-sm', getProfitLossColor(-t.tax))}>
                                  -{formatCurrency(t.tax)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              {Object.keys(tradesByDate).length === 0 && (
                <div className={cn('py-8 text-center', textMuted)}>거래 내역이 없습니다.</div>
              )}
            </div>
          )}

          {detailViewMode === 'stock' && (
            <div className="space-y-2 overflow-y-auto max-h-[400px]">
              {tradesByStock.map((s) => (
                <div
                  key={s.code}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg min-h-[56px]',
                    cardBg,
                    dark ? 'border border-gray-700' : 'border border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold text-white">
                      {getInitials(s.name)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{s.name}</div>
                      <div className={cn('text-sm', getProfitLossColor(-s.tax))}>
                        -{formatCurrency(s.tax)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {tradesByStock.length === 0 && (
                <div className={cn('py-8 text-center', textMuted)}>종목별 내역이 없습니다.</div>
              )}
            </div>
          )}
        </>
      )}            

      {/* {profitTypeTab !== 'sales' && (
        <div className={cn('py-12 text-center', textMuted)}>데이터가 없습니다.</div>
      )} */}

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
