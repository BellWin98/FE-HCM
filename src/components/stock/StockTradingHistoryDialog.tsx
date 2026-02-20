import React, { useMemo } from 'react';
import { TradingProfitLoss } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface StockTradingHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trades: TradingProfitLoss[];
  dark?: boolean;
}

const formatDateToMD = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}.${day}`;
  } catch {
    return dateString;
  }
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR').format(price);
};

const StockTradingHistoryDialog: React.FC<StockTradingHistoryDialogProps> = ({
  open,
  onOpenChange,
  trades,
  dark,
}) => {
  const groupedTrades = useMemo(() => {
    if (!trades.length) return [];
    
    // 날짜순으로 정렬 (최신순)
    const sorted = [...trades].sort((a, b) => {
      return new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime();
    });

    // 날짜별로 그룹화
    const grouped: Array<{ date: string; trades: TradingProfitLoss[] }> = [];
    let currentDate = '';
    
    for (const trade of sorted) {
      if (trade.tradeDate !== currentDate) {
        currentDate = trade.tradeDate;
        grouped.push({ date: currentDate, trades: [trade] });
      } else {
        grouped[grouped.length - 1].trades.push(trade);
      }
    }

    return grouped;
  }, [trades]);

  const cardBg = dark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200';
  const textMuted = dark ? 'text-gray-400' : 'text-gray-600';
  const textPrimary = dark ? 'text-gray-100' : 'text-gray-900';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col',
          dark && 'bg-gray-900 border-gray-700'
        )}
      >
        <DialogHeader>
          <DialogTitle className={textPrimary}>주문내역</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {groupedTrades.length === 0 ? (
            <div className={cn('py-12 text-center', textMuted)}>
              거래 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {groupedTrades.map((group, groupIndex) => (
                <div key={group.date} className="space-y-3">
                  {group.trades.map((trade, tradeIndex) => {
                    const isFirstInGroup = tradeIndex === 0;
                    const isBuy = trade.tradeType === 'BUY';
                    
                    return (
                      <div
                        key={`${trade.stockCode}-${trade.tradeDate}-${tradeIndex}`}
                        className="flex items-start gap-3"
                      >
                        {/* 날짜 - 첫 번째 항목에만 표시 */}
                        {isFirstInGroup && (
                          <div className="min-w-[40px] pt-1">
                            <span className={cn('text-sm', textMuted)}>
                              {formatDateToMD(trade.tradeDate)}
                            </span>
                          </div>
                        )}
                        {!isFirstInGroup && <div className="min-w-[40px]" />}

                        {/* 거래 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className={cn('text-base font-semibold', textPrimary)}>
                            {trade.stockName}
                          </div>
                          <div
                            className={cn(
                              'text-sm mt-0.5',
                              isBuy ? textMuted : 'text-blue-500 dark:text-blue-400'
                            )}
                          >
                            {trade.quantity}주 {isBuy ? '구매' : '판매'} 완료
                          </div>
                        </div>

                        {/* 주당 가격 */}
                        <div className="text-right pt-1">
                          <div className={cn('text-sm', textMuted)}>
                            주당 {formatPrice(trade.price)}원
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockTradingHistoryDialog;
