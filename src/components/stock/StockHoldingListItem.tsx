import React, { useState } from 'react';
import { StockHolding } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

interface StockHoldingListItemProps {
  holding: StockHolding;
  isMobile: boolean;
  dark?: boolean;
}

const StockHoldingListItem: React.FC<StockHoldingListItemProps> = ({
  holding,
  isMobile,
  dark,
}) => {
  const [expanded, setExpanded] = useState(false);
  const textMuted = dark ? 'text-gray-400' : 'text-gray-600';
  const cardBg = dark ? 'bg-gray-800/50' : 'bg-white';
  const borderColor = dark ? 'border-gray-700' : 'border-gray-200';

  if (isMobile) {
    return (
      <div className={cn('rounded-lg border', borderColor, cardBg)}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
          className="flex items-center gap-3 p-4 min-h-[56px]"
        >
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold text-white shrink-0">
            {getInitials(holding.stockName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {holding.stockName}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {holding.quantity.toLocaleString()}주
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(holding.marketValue)}
            </div>
            <div className={cn('text-sm font-medium', getProfitLossColor(holding.profitLoss))}>
              {formatCurrency(holding.profitLoss)} ({formatPercentage(holding.profitLossRate)})
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
          )}
        </div>
        {expanded && (
          <div className="px-4 pb-4 pt-0 grid grid-cols-2 gap-3 border-t border-gray-200 dark:border-gray-700 mt-0 pt-4">
            <div>
              <p className={cn('text-xs', textMuted)}>현재가</p>
              <p className="font-medium text-sm">{formatCurrency(holding.currentPrice)}</p>
            </div>
            <div>
              <p className={cn('text-xs', textMuted)}>평균단가</p>
              <p className="font-medium text-sm">{formatCurrency(holding.averagePrice)}</p>
            </div>
            <div>
              <p className={cn('text-xs', textMuted)}>매입금액</p>
              <p className="font-medium text-sm">{formatCurrency(holding.purchasePrice)}</p>
            </div>
            <div>
              <p className={cn('text-xs', textMuted)}>섹터</p>
              <p className="font-medium text-sm">{holding.sector}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border min-h-[56px]',
        cardBg,
        borderColor
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold text-white shrink-0">
          {getInitials(holding.stockName)}
        </div>
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">{holding.stockName}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {holding.stockCode} · {holding.quantity.toLocaleString()}주
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className={cn('text-xs', textMuted)}>현재가</p>
          <p className="font-medium">{formatCurrency(holding.currentPrice)}</p>
        </div>
        <div className="text-right">
          <p className={cn('text-xs', textMuted)}>평가금액</p>
          <p className="font-medium">{formatCurrency(holding.marketValue)}</p>
        </div>
        <div className="text-right">
          <p className={cn('text-xs', textMuted)}>손익</p>
          <div className={cn('font-semibold', getProfitLossColor(holding.profitLoss))}>
            {formatCurrency(holding.profitLoss)} ({formatPercentage(holding.profitLossRate)})
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockHoldingListItem;
