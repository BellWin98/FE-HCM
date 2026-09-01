import React, { useState, useMemo, useEffect } from 'react';
import type { TossPortfolio, TossRealizedProfit } from '@/types/tossStock';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronRight, ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { api } from '@/lib/api';
import TossHoldingListItem, { type TossDisplayMode } from './TossHoldingListItem';
import { cn } from '@/lib/utils';
import { STOCK_CARD_BG, STOCK_TEXT_MUTED, STOCK_BORDER, STOCK_SEGMENT_ACTIVE } from '@/lib/stockTheme';
import { formatPercentage, getProfitLossColor } from '@/lib/stockFormat';
import { formatMoney, formatOptionalMoney } from '@/lib/tossFormat';

type SortOption = 'profitRateAsc' | 'profitRateDesc' | 'marketValueAsc' | 'marketValueDesc';

/** 종목별 거래 내역을 붙이기 위한 조회 시작일. 계좌 개설 이전이어도 무해하다. */
const TRADE_HISTORY_START_DATE = '2020-01-01';

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface TossStockAssetsTabProps {
  portfolio: TossPortfolio;
  onRefresh: () => void;
  loading: boolean;
  onNavigateToProfit: () => void;
}

const TossStockAssetsTab: React.FC<TossStockAssetsTabProps> = ({
  portfolio,
  onRefresh,
  loading,
  onNavigateToProfit,
}) => {
  const isMobile = useIsMobile();
  const [displayMode, setDisplayMode] = useState<TossDisplayMode>('marketValue');
  const [sortOption, setSortOption] = useState<SortOption>('marketValueDesc');
  const [realizedProfit, setRealizedProfit] = useState<TossRealizedProfit | null>(null);

  // 종목을 펼쳤을 때 보여줄 거래 내역. 실패해도 자산 화면 자체는 유효하므로 조용히 비운다.
  useEffect(() => {
    let cancelled = false;

    const fetchTrades = async (): Promise<void> => {
      try {
        const data = await api.getTossRealizedProfit({
          owner: portfolio.owner,
          startDate: TRADE_HISTORY_START_DATE,
          endDate: formatDateLocal(new Date()),
        });
        if (!cancelled) setRealizedProfit(data);
      } catch {
        if (!cancelled) setRealizedProfit(null);
      }
    };

    fetchTrades();
    return () => {
      cancelled = true;
    };
  }, [portfolio.owner]);

  const sortedHoldings = useMemo(() => {
    return [...portfolio.holdings].sort((a, b) => {
      switch (sortOption) {
        case 'profitRateAsc':
          return a.profitLossRate - b.profitLossRate;
        case 'profitRateDesc':
          return b.profitLossRate - a.profitLossRate;
        case 'marketValueAsc':
          return a.marketValue - b.marketValue;
        case 'marketValueDesc':
          return b.marketValue - a.marketValue;
        default:
          return 0;
      }
    });
  }, [portfolio.holdings, sortOption]);

  const hasUsdHoldings = portfolio.totalMarketValueUsd != null;
  const textMuted = STOCK_TEXT_MUTED;

  return (
    <div className={cn('space-y-4 sm:space-y-6', isMobile && 'pb-6')}>
      {/* 계좌 요약 카드 — 토스에는 D+2 예수금 개념이 없어 현금 매수가능금액으로 대체한다. */}
      <div
        className={cn(
          'flex gap-3 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible scrollbar-hide',
          isMobile && 'snap-x snap-mandatory'
        )}
      >
        <Card className={cn('shrink-0 w-[260px] sm:w-auto snap-center', STOCK_CARD_BG)}>
          <CardContent className="p-4">
            <p className={cn('text-sm', textMuted)}>현금 매수가능금액</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {formatOptionalMoney(portfolio.cashBuyingPowerKrw, 'KRW')}
            </p>
            {hasUsdHoldings && (
              <p className={cn('text-xs mt-1', textMuted)}>
                {formatOptionalMoney(portfolio.cashBuyingPowerUsd, 'USD')}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className={cn('shrink-0 w-[260px] sm:w-auto snap-center', STOCK_CARD_BG)}>
          <CardContent className="p-4">
            <p className={cn('text-sm', textMuted)}>총 매입금액</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {formatMoney(portfolio.totalPurchaseAmountKrw, 'KRW')}
            </p>
            {hasUsdHoldings && (
              <p className={cn('text-xs mt-1', textMuted)}>
                {formatOptionalMoney(portfolio.totalPurchaseAmountUsd, 'USD')}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className={cn('shrink-0 w-[260px] sm:w-auto snap-center', STOCK_CARD_BG)}>
          <CardContent className="p-4">
            <p className={cn('text-sm', textMuted)}>오늘 손익</p>
            <p className={cn('text-xl font-bold mt-1', getProfitLossColor(portfolio.dailyProfitLossKrw))}>
              {portfolio.dailyProfitLossKrw >= 0 ? '+' : ''}
              {formatMoney(portfolio.dailyProfitLossKrw, 'KRW')}
            </p>
            <p className={cn('text-xs mt-1', getProfitLossColor(portfolio.dailyProfitLossRate))}>
              {formatPercentage(portfolio.dailyProfitLossRate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 내 투자 */}
      <div className={cn('p-4 rounded-xl border', STOCK_CARD_BG)}>
        <p className={cn('text-sm', textMuted)}>내 투자</p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
          {formatMoney(portfolio.totalMarketValueKrw, 'KRW')}
        </p>
        <p className={cn('text-base mt-1 font-medium', getProfitLossColor(portfolio.totalProfitLossKrw))}>
          {portfolio.totalProfitLossKrw >= 0 ? '+' : ''}
          {formatMoney(portfolio.totalProfitLossKrw, 'KRW')} ({formatPercentage(portfolio.totalProfitLossRate)})
        </p>
        {hasUsdHoldings && (
          <p className={cn('text-sm mt-2', textMuted)}>
            해외 {formatOptionalMoney(portfolio.totalMarketValueUsd, 'USD')} (
            {formatOptionalMoney(portfolio.totalProfitLossUsd, 'USD')})
          </p>
        )}
      </div>

      {/* 목록 헤더 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
          <SelectTrigger className="flex items-center gap-1 w-auto min-w-[140px] min-h-[44px]">
            <ArrowUpDown className="h-4 w-4 shrink-0" />
            <SelectValue placeholder="정렬 기준" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="marketValueDesc">평가금 높은 순</SelectItem>
            <SelectItem value="marketValueAsc">평가금 낮은 순</SelectItem>
            <SelectItem value="profitRateDesc">총 수익률 높은 순</SelectItem>
            <SelectItem value="profitRateAsc">총 수익률 낮은 순</SelectItem>
          </SelectContent>
        </Select>
        <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 text-sm">
          <button
            type="button"
            onClick={() => setDisplayMode('currentPrice')}
            className={cn(
              'px-4 py-2 min-w-[70px] font-medium transition-colors',
              displayMode === 'currentPrice' ? STOCK_SEGMENT_ACTIVE : textMuted
            )}
          >
            현재가
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('marketValue')}
            className={cn(
              'px-4 py-2 min-w-[70px] font-medium transition-colors',
              displayMode === 'marketValue' ? STOCK_SEGMENT_ACTIVE : textMuted
            )}
          >
            평가금
          </button>
        </div>
      </div>

      {/* 보유 종목 */}
      <div className="space-y-2">
        {sortedHoldings.length === 0 ? (
          <div className={cn('py-12 text-center', textMuted)}>보유 중인 주식이 없습니다.</div>
        ) : (
          sortedHoldings.map((holding) => (
            <TossHoldingListItem
              key={`${holding.marketCountry}-${holding.symbol}`}
              holding={holding}
              displayMode={displayMode}
              isMobile={isMobile}
              trades={(realizedProfit?.trades ?? []).filter((trade) => trade.symbol === holding.symbol)}
            />
          ))
        )}
      </div>

      <div className={cn('space-y-2 pt-4 border-t', STOCK_BORDER)}>
        <Button variant="default" className="w-full min-h-[48px] justify-between" onClick={onNavigateToProfit}>
          <span>수익분석</span>
          <ChevronRight className="h-5 w-5" />
        </Button>
        <Button variant="outline" className="w-full min-h-[44px]" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          새로고침
        </Button>
      </div>
    </div>
  );
};

export default TossStockAssetsTab;
