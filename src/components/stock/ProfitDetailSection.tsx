import React from 'react';
import type { TradingProfitLoss } from '@/types';
import type { DailyProfitGroup, StockProfitGroup } from '@/lib/stockProfit';
import { formatCurrency, formatPercentage, getProfitLossColor, getInitials } from '@/lib/stockFormat';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { STOCK_CARD_BG, STOCK_TEXT_MUTED, STOCK_ROW_BORDER } from '@/lib/stockTheme';

export type ProfitMetric = 'sales' | 'fee' | 'tax';
export type DetailViewMode = 'daily' | 'stock';

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

/**
 * 수수료·제세금은 지출이므로 음수로 표시한다. 판매수익만 부호를 그대로 쓰고 수익률을 함께 보여준다.
 */
const metricValue = {
  sales: {
    trade: (t: TradingProfitLoss) => t.profitLoss,
    daily: (g: DailyProfitGroup) => g.profit,
    stock: (s: StockProfitGroup) => s.profit,
    showRate: true,
  },
  fee: {
    trade: (t: TradingProfitLoss) => -t.fee,
    daily: (g: DailyProfitGroup) => -g.fee,
    stock: (s: StockProfitGroup) => -s.fee,
    showRate: false,
  },
  tax: {
    trade: (t: TradingProfitLoss) => -t.tax,
    daily: (g: DailyProfitGroup) => -g.tax,
    stock: (s: StockProfitGroup) => -s.tax,
    showRate: false,
  },
} as const;

interface ProfitDetailSectionProps {
  metric: ProfitMetric;
  total: number;
  totalRate?: number | null;
  dailyGroups: DailyProfitGroup[];
  stockGroups: StockProfitGroup[];
  viewMode: DetailViewMode;
  onViewModeChange: (mode: DetailViewMode) => void;
}

const ProfitDetailSection: React.FC<ProfitDetailSectionProps> = ({
  metric,
  total,
  totalRate,
  dailyGroups,
  stockGroups,
  viewMode,
  onViewModeChange,
}) => {
  const accessor = metricValue[metric];
  const cardBg = STOCK_CARD_BG;
  const textMuted = STOCK_TEXT_MUTED;
  const rowBorder = STOCK_ROW_BORDER;

  const handleDailyClick = () => onViewModeChange('daily');
  const handleStockClick = () => onViewModeChange('stock');

  const renderRow = (key: string, name: string, value: number, rate?: number | null) => (
    <div
      key={key}
      className={cn('flex items-center justify-between p-3 rounded-lg min-h-[56px]', cardBg, rowBorder)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
          {getInitials(name)}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-gray-900 dark:text-gray-100 break-words leading-snug">{name}</div>
          <div className={cn('text-sm', getProfitLossColor(value))}>
            {formatCurrency(value)}
            {rate != null && ` (${formatPercentage(rate)})`}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className={cn('text-xl font-bold', getProfitLossColor(total))}>
          {formatCurrency(total)}
          {accessor.showRate && totalRate != null && ` (${formatPercentage(totalRate)})`}
        </p>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
          <button
            type="button"
            aria-pressed={viewMode === 'daily'}
            className={cn(
              'px-3 py-2 text-sm min-h-[40px]',
              viewMode === 'daily' ? 'bg-gray-200 dark:bg-gray-700' : textMuted
            )}
            onClick={handleDailyClick}
          >
            일별
          </button>
          <button
            type="button"
            aria-pressed={viewMode === 'stock'}
            className={cn(
              'px-3 py-2 text-sm min-h-[40px]',
              viewMode === 'stock' ? 'bg-gray-200 dark:bg-gray-700' : textMuted
            )}
            onClick={handleStockClick}
          >
            종목별 합계
          </button>
        </div>
      </div>

      {viewMode === 'daily' && (
        <div className="space-y-4 overflow-y-auto max-h-[400px]">
          {dailyGroups.map((group) => {
            const dayValue = accessor.daily(group);
            return (
              <div key={group.date}>
                <div className="text-sm font-medium mb-2">
                  {formatDateSafe(parseLocalDate(group.date), 'M월 d일 (EEE)', group.date)} ·{' '}
                  <span className={getProfitLossColor(dayValue)}>
                    {formatCurrency(dayValue)}
                    {accessor.showRate && ` (${formatPercentage(group.rate)})`}
                  </span>
                </div>
                <div className="space-y-2 pl-2">
                  {group.trades.map((trade, i) =>
                    renderRow(
                      `${trade.stockCode}-${trade.tradeType}-${i}`,
                      trade.stockName,
                      accessor.trade(trade),
                      accessor.showRate ? trade.profitLossRate : null
                    )
                  )}
                </div>
              </div>
            );
          })}
          {dailyGroups.length === 0 && (
            <div className={cn('py-8 text-center', textMuted)}>거래 내역이 없습니다.</div>
          )}
        </div>
      )}

      {viewMode === 'stock' && (
        <div className="space-y-2 overflow-y-auto max-h-[400px]">
          {stockGroups.map((stock) =>
            renderRow(
              stock.code,
              stock.name,
              accessor.stock(stock),
              accessor.showRate ? stock.rate : null
            )
          )}
          {stockGroups.length === 0 && (
            <div className={cn('py-8 text-center', textMuted)}>종목별 내역이 없습니다.</div>
          )}
        </div>
      )}
    </>
  );
};

export default ProfitDetailSection;
