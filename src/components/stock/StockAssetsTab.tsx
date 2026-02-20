import React, { useState, useMemo, useEffect } from 'react';
import { StockPortfolio, StockHolding, TradingProfitLossSummary } from '@/types';
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
import StockChart from '@/components/StockChart';
import StockHoldingListItem from './StockHoldingListItem';
import StockTradingHistoryDialog from './StockTradingHistoryDialog';
import { cn } from '@/lib/utils';

const formatDateLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
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

type ViewMode = 'marketValue' | 'currentPrice' | 'profitLoss';
type DisplayMode = 'currentPrice' | 'marketValue'; // 현재가 | 평가금
type SortOption = 'profitRateAsc' | 'profitRateDesc' | 'marketValueAsc' | 'marketValueDesc';

interface StockAssetsTabProps {
  portfolio: StockPortfolio;
  onRefresh: () => void;
  loading: boolean;
  onNavigateToProfit: () => void;
  dark?: boolean;
}

const StockAssetsTab: React.FC<StockAssetsTabProps> = ({
  portfolio,
  onRefresh,
  loading,
  onNavigateToProfit,
  dark,
}) => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>('marketValue');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('marketValue');
  const [sortOption, setSortOption] = useState<SortOption>('marketValueDesc');
  const [tradesSummary, setTradesSummary] = useState<TradingProfitLossSummary | null>(null);
  const [isTradingHistoryOpen, setIsTradingHistoryOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const today = new Date();
        const data = (await api.getTradingProfitLoss({
          startDate: '2025-06-01',
          endDate: formatDateLocal(today),
          periodType: 'ALL',
        })) as TradingProfitLossSummary;
        if (!cancelled) setTradesSummary(data);
      } catch {
        if (!cancelled) setTradesSummary(null);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

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

  const cardBg = dark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200';
  const textMuted = dark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={cn('space-y-4 sm:space-y-6', isMobile && 'pb-6')}>
      {/* 계좌 요약 카드 */}
      <div
        className={cn(
          'flex gap-3 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible scrollbar-hide',
          isMobile && 'snap-x snap-mandatory'
        )}
      >
        <Card className={cn('shrink-0 w-[260px] sm:w-auto snap-center', cardBg)}>
          <CardContent className="p-4">
            <p className={cn('text-sm', textMuted)}>금일 예수금</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {formatCurrency(portfolio.depositToday)}
            </p>
          </CardContent>
        </Card>
        <Card className={cn('shrink-0 w-[260px] sm:w-auto snap-center', cardBg)}>
          <CardContent className="p-4">
            <p className={cn('text-sm', textMuted)}>D+2 예수금</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {formatCurrency(portfolio.depositD2)}
            </p>
          </CardContent>
        </Card>
        <Card className={cn('shrink-0 w-[260px] sm:w-auto snap-center', cardBg)}>
          <CardContent className="p-4">
            <p className={cn('text-sm', textMuted)}>총 매입금액</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {formatCurrency(portfolio.totalBuyValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 내 투자 섹션 */}
      <div className={cn('p-4 rounded-xl border', cardBg)}>
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('text-sm', textMuted)}>내 투자</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {formatCurrency(portfolio.totalMarketValue)}
            </p>
            <p className={cn('text-base mt-1 font-medium', getProfitLossColor(portfolio.totalProfitLoss))}>
              {formatCurrency(portfolio.totalProfitLoss)} ({formatPercentage(portfolio.totalProfitLossRate)})
            </p>
          </div>
          {/* <ChevronRight className="h-6 w-6 text-gray-400" /> */}
        </div>
      </div>

      {/* 수익 분포 */}
      <StockChart
        holdings={portfolio.holdings}
        totalMarketValue={portfolio.totalMarketValue}
        dark={dark}
      />

      {/* 주식 보유 목록 헤더 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
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
        <div
          className={cn(
            'inline-flex rounded-lg overflow-hidden border text-sm',
            dark ? 'border-gray-600' : 'border-gray-200'
          )}
        >
          <button
            type="button"
            onClick={() => setDisplayMode('currentPrice')}
            className={cn(
              'px-4 py-2 min-w-[70px] font-medium transition-colors',
              displayMode === 'currentPrice'
                ? dark
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-gray-900 text-white'
                : textMuted
            )}
          >
            현재가
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('marketValue')}
            className={cn(
              'px-4 py-2 min-w-[70px] font-medium transition-colors',
              displayMode === 'marketValue'
                ? dark
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-gray-900 text-white'
                : textMuted
            )}
          >
            평가금
          </button>
        </div>
      </div>

      {/* 보유 종목 목록 */}
      <div className="space-y-2">
        {sortedHoldings.length === 0 ? (
          <div className={cn('py-12 text-center', textMuted)}>보유 중인 주식이 없습니다.</div>
        ) : (
          sortedHoldings.map((holding) => (
            <StockHoldingListItem
              key={holding.stockCode}
              holding={holding}
              displayMode={displayMode}
              isMobile={isMobile}
              dark={dark}
              trades={(tradesSummary?.trades ?? []).filter((t) => t.stockCode === holding.stockCode)}
            />
          ))
        )}
      </div>

      {/* 하단 요약 링크 영역 */}
      <div className={cn('space-y-2 pt-4 border-t', dark ? 'border-gray-700' : 'border-gray-200')}>
        <Button
          variant={dark ? 'secondary' : 'default'}
          className="w-full min-h-[48px] justify-between"
          onClick={onNavigateToProfit}
        >
          <span>수익분석</span>
          <ChevronRight className="h-5 w-5" />
        </Button>
        <Button
          variant={dark ? 'secondary' : 'default'}
          className="w-full min-h-[48px] justify-between"
          onClick={() => setIsTradingHistoryOpen(true)}
        >
          <span>주문내역</span>
          <ChevronRight className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          className="w-full min-h-[44px]"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          새로고침
        </Button>
      </div>

      {/* 주문내역 다이얼로그 */}
      <StockTradingHistoryDialog
        open={isTradingHistoryOpen}
        onOpenChange={setIsTradingHistoryOpen}
        trades={tradesSummary?.trades ?? []}
        dark={dark}
      />
    </div>
  );
};

export default StockAssetsTab;
