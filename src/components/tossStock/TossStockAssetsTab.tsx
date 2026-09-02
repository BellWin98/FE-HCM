import React, { useState, useMemo } from 'react';
import type { TossPortfolio } from '@/types/tossStock';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTossTradeHistory } from '@/hooks/useTossTradeHistory';
import TossHoldingListItem, { type TossCostBasis } from './TossHoldingListItem';
import { cn } from '@/lib/utils';
import { STOCK_CARD_BG, STOCK_TEXT_MUTED, STOCK_BORDER, STOCK_SEGMENT_ACTIVE } from '@/lib/stockTheme';
import { formatPercentage, getProfitLossColor } from '@/lib/stockFormat';
import {
  formatExchangeRate,
  formatMoney,
  formatOptionalMoney,
  formatOptionalSignedMoney,
  formatSignedMoney,
} from '@/lib/tossFormat';
import {
  canShowUnifiedTotal,
  filterHoldingsByMarket,
  hasOverseasHoldings,
  legProfitLossRate,
  sortHoldings,
  type TossMarketFilter,
  type TossSortOption,
} from '@/lib/tossPortfolio';

/**
 * 데이터 기준 시각. 파싱에 실패하면 시각을 지어내지 말고 빈 문자열로 둔다 —
 * 잘못된 시각은 시각이 없는 것보다 나쁘다.
 */
const formatUpdatedAt = (lastUpdated: string): string => {
  const parsed = new Date(lastUpdated);
  if (isNaN(parsed.getTime())) return '';
  const hours = parsed.getHours().toString().padStart(2, '0');
  const minutes = parsed.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

interface TossStockAssetsTabProps {
  portfolio: TossPortfolio;
  onRefresh: () => void;
  loading: boolean;
}

const TossStockAssetsTab: React.FC<TossStockAssetsTabProps> = ({
  portfolio,
  onRefresh,
  loading,
}) => {
  const isMobile = useIsMobile();
  const [costBasis, setCostBasis] = useState<TossCostBasis>('preCost');
  const [sortOption, setSortOption] = useState<TossSortOption>('marketValueDesc');
  const [marketFilter, setMarketFilter] = useState<TossMarketFilter>('ALL');
  const tradeHistory = useTossTradeHistory(portfolio.owner);

  const hasUsdHoldings = hasOverseasHoldings(portfolio);
  // 필터 컨트롤을 그리지 않는 계좌에서는 목록이 조용히 걸러지지 않게 한다.
  const activeMarket: TossMarketFilter = hasUsdHoldings ? marketFilter : 'ALL';

  const sortedHoldings = useMemo(
    () =>
      sortHoldings(
        filterHoldingsByMarket(portfolio.holdings, activeMarket),
        sortOption,
        portfolio.usdKrwRate
      ),
    [portfolio.holdings, portfolio.usdKrwRate, activeMarket, sortOption]
  );

  const domesticCount = portfolio.holdings.filter((holding) => holding.marketCountry === 'KR').length;
  const overseasCount = portfolio.holdings.length - domesticCount;
  // 고른 시장이 비었다고 계좌가 빈 것은 아니다.
  const emptyListMessage =
    activeMarket === 'ALL'
      ? '보유 중인 주식이 없습니다.'
      : `${activeMarket === 'KR' ? '국내' : '해외'} 종목이 없어요.`;

  const showUnifiedTotal = canShowUnifiedTotal(portfolio);
  const textMuted = STOCK_TEXT_MUTED;

  const domesticRate = legProfitLossRate(portfolio.totalProfitLossKrw, portfolio.totalPurchaseAmountKrw);
  const overseasRate = legProfitLossRate(portfolio.totalProfitLossUsd, portfolio.totalPurchaseAmountUsd);
  const overseasWeight = portfolio.overseasWeightPercent ?? 0;
  const domesticWeight = 100 - overseasWeight;

  /**
   * 계좌 전체를 한 숫자로 보여주는 히어로.
   * 금액·손익·세후·오늘이 모두 같은 모집단(전체 원화 환산)이라 서로 어긋날 일이 없다.
   */
  const unifiedHero = (
    <div className={cn('p-4 rounded-xl border', STOCK_CARD_BG)} data-testid="portfolio-hero">
      <p className={cn('text-sm', textMuted)}>{hasUsdHoldings ? '총자산 · 원화 환산' : '총자산'}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
        {formatOptionalMoney(portfolio.totalMarketValueInKrw, 'KRW')}
      </p>
      <p
        className={cn(
          'text-base mt-1 font-medium tabular-nums',
          getProfitLossColor(portfolio.totalProfitLossInKrw ?? 0)
        )}
      >
        {formatOptionalSignedMoney(portfolio.totalProfitLossInKrw, 'KRW')} (
        {formatPercentage(portfolio.totalProfitLossRate)})
      </p>
      <p className={cn('text-xs mt-0.5 tabular-nums', textMuted)}>
        세후 {formatOptionalSignedMoney(portfolio.totalProfitLossAfterCostInKrw, 'KRW')} ·{' '}
        {formatPercentage(portfolio.totalProfitLossRateAfterCost)}
      </p>

      <div className={cn('grid grid-cols-3 gap-3 mt-4 pt-3 border-t', STOCK_BORDER)}>
        <div className="min-w-0">
          <p className={cn('text-xs', textMuted)}>오늘</p>
          <p
            className={cn(
              'text-sm font-bold mt-0.5 tabular-nums truncate',
              getProfitLossColor(portfolio.dailyProfitLossInKrw ?? 0)
            )}
          >
            {formatOptionalSignedMoney(portfolio.dailyProfitLossInKrw, 'KRW')}
          </p>
          <p className={cn('text-xs tabular-nums', getProfitLossColor(portfolio.dailyProfitLossRate))}>
            {formatPercentage(portfolio.dailyProfitLossRate)}
          </p>
        </div>
        <div className="min-w-0">
          <p className={cn('text-xs', textMuted)}>투자원금</p>
          <p className="text-sm font-bold mt-0.5 text-gray-900 dark:text-gray-100 tabular-nums truncate">
            {formatOptionalMoney(portfolio.totalPurchaseAmountInKrw, 'KRW')}
          </p>
        </div>
        <div className="min-w-0">
          <p className={cn('text-xs', textMuted)}>현금 매수가능</p>
          <p className="text-sm font-bold mt-0.5 text-gray-900 dark:text-gray-100 tabular-nums truncate">
            {formatOptionalMoney(portfolio.cashBuyingPowerKrw, 'KRW')}
          </p>
          {hasUsdHoldings && (
            <p className={cn('text-xs tabular-nums truncate', textMuted)}>
              + {formatOptionalMoney(portfolio.cashBuyingPowerUsd, 'USD')}
            </p>
          )}
        </div>
      </div>

      {/* 국내/해외 비중. 한쪽만 보는 손익률은 응답에 없어 같은 통화 안에서 직접 계산한다. */}
      {hasUsdHoldings && (
        <div className={cn('mt-4 pt-3 border-t', STOCK_BORDER)}>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5" aria-hidden="true">
            <div className="bg-gray-900 dark:bg-gray-100" style={{ flexGrow: domesticWeight }} />
            <div className="bg-blue-600 dark:bg-blue-400" style={{ flexGrow: overseasWeight }} />
          </div>
          <div className="flex justify-between gap-3 mt-2">
            <div className="min-w-0" data-testid="leg-domestic">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                국내 {domesticWeight.toFixed(1)}%
              </p>
              <p className={cn('text-xs tabular-nums truncate', textMuted)}>
                {formatMoney(portfolio.totalMarketValueKrw, 'KRW')}
              </p>
              {/* <p className={cn('text-xs font-medium tabular-nums', getProfitLossColor(domesticRate ?? 0))}>
                {domesticRate == null ? '—' : formatPercentage(domesticRate)}
              </p> */}
            </div>
            <div className="min-w-0 text-right" data-testid="leg-overseas">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                해외 {overseasWeight.toFixed(1)}%
              </p>
              <p className={cn('text-xs tabular-nums truncate', textMuted)}>
                {formatOptionalMoney(portfolio.totalMarketValueUsd, 'USD')}
              </p>
              {/* <p className={cn('text-xs font-medium tabular-nums', getProfitLossColor(overseasRate ?? 0))}>
                {overseasRate == null ? '—' : formatPercentage(overseasRate)}
              </p> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('space-y-4 sm:space-y-6', isMobile && 'pb-6')}>
      {/*
        데이터 기준 시각과 적용 환율.
        환산 금액을 보여주는 이상 어떤 환율을 썼는지도 같이 보여야 한다 — 1분마다 바뀌는 값이다.
      */}
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-xs tabular-nums', textMuted)} data-testid="data-freshness">
          {formatUpdatedAt(portfolio.lastUpdated)} 기준
          {portfolio.usdKrwRate != null && ` · ${formatExchangeRate(portfolio.usdKrwRate)}`}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="min-h-[36px]"
          onClick={onRefresh}
          disabled={loading}
          aria-label="새로고침"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {showUnifiedTotal && unifiedHero}

      {/*
        환율을 못 받아 합칠 수 없을 때의 폴백.
        `...Krw` 는 국내만, `...Usd` 는 해외만인 반면 `totalProfitLossRate` 는 전체 환산 기준이라,
        셋을 한 줄에 묶으면 "-₩13,100 (+2.36%)" 처럼 금액과 비율이 어긋난 줄이 나온다.
      */}
      {!showUnifiedTotal && (
        <>
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
                <p className={cn('text-xs mt-1', textMuted)}>
                  {formatOptionalMoney(portfolio.cashBuyingPowerUsd, 'USD')}
                </p>
              </CardContent>
            </Card>
            <Card className={cn('shrink-0 w-[260px] sm:w-auto snap-center', STOCK_CARD_BG)}>
              <CardContent className="p-4">
                <p className={cn('text-sm', textMuted)}>총 매입금액</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {formatMoney(portfolio.totalPurchaseAmountKrw, 'KRW')}
                </p>
                <p className={cn('text-xs mt-1', textMuted)}>
                  {formatOptionalMoney(portfolio.totalPurchaseAmountUsd, 'USD')}
                </p>
              </CardContent>
            </Card>
            <Card className={cn('shrink-0 w-[260px] sm:w-auto snap-center', STOCK_CARD_BG)}>
              <CardContent className="p-4" data-testid="daily-profit-card">
                <p className={cn('text-sm', textMuted)}>오늘 손익</p>
                <p
                  className={cn(
                    'text-xl font-bold mt-1',
                    getProfitLossColor(portfolio.dailyProfitLossKrw)
                  )}
                >
                  {formatSignedMoney(portfolio.dailyProfitLossKrw, 'KRW')}
                </p>
                <p className={cn('text-sm', getProfitLossColor(portfolio.dailyProfitLossUsd ?? 0))}>
                  {formatOptionalSignedMoney(portfolio.dailyProfitLossUsd, 'USD')}
                </p>
                {/* 비율만 국내·해외를 환산해 합친 전체 기준이라, 위 금액과 같은 대상이 아니다. */}
                <p className={cn('text-xs mt-1', getProfitLossColor(portfolio.dailyProfitLossRate))}>
                  전체 {formatPercentage(portfolio.dailyProfitLossRate)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className={cn('p-4 rounded-xl border', STOCK_CARD_BG)}>
            <p className={cn('text-sm', textMuted)}>내 투자 · 국내</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {formatMoney(portfolio.totalMarketValueKrw, 'KRW')}
            </p>
            <p
              data-testid="total-profit-domestic"
              className={cn('text-base mt-1 font-medium', getProfitLossColor(portfolio.totalProfitLossKrw))}
            >
              {formatSignedMoney(portfolio.totalProfitLossKrw, 'KRW')}
            </p>

            <div className={cn('mt-3 pt-3 border-t', STOCK_BORDER)}>
              <p className={cn('text-sm', textMuted)}>내 투자 · 해외</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatOptionalMoney(portfolio.totalMarketValueUsd, 'USD')}
              </p>
              <p
                data-testid="total-profit-overseas"
                className={cn(
                  'text-base mt-1 font-medium',
                  getProfitLossColor(portfolio.totalProfitLossUsd ?? 0)
                )}
              >
                {formatOptionalSignedMoney(portfolio.totalProfitLossUsd, 'USD')}
              </p>
            </div>
            <div
              className={cn('mt-3 pt-3 border-t flex items-baseline justify-between gap-3', STOCK_BORDER)}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">전체 수익률</p>
                <p className={cn('text-xs', textMuted)}>국내·해외를 원화 환산한 기준</p>
              </div>
              <p
                className={cn('text-lg font-bold shrink-0', getProfitLossColor(portfolio.totalProfitLossRate))}
              >
                {formatPercentage(portfolio.totalProfitLossRate)}
              </p>
            </div>
          </div>
        </>
      )}

      {/*
        전체 / 국내 / 해외.
        계좌 전체를 바꾸는 것이 아니라 아래 목록만 좁힌다 — 히어로는 계속 계좌 전체를 가리킨다.
        각 칸에 종목 수와 통화별 소계를 실어, 누르지 않아도 두 시장의 크기를 견줄 수 있게 한다.
      */}
      {hasUsdHoldings && (
        <div className="grid grid-cols-3 gap-2" data-testid="market-filter">
          {[
            { value: 'ALL' as const, label: '전체', count: portfolio.holdings.length, subtotal: null },
            {
              value: 'KR' as const,
              label: '국내',
              count: domesticCount,
              subtotal: formatMoney(portfolio.totalMarketValueKrw, 'KRW'),
            },
            {
              value: 'US' as const,
              label: '해외',
              count: overseasCount,
              subtotal: formatOptionalMoney(portfolio.totalMarketValueUsd, 'USD'),
            },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMarketFilter(option.value)}
              aria-pressed={activeMarket === option.value}
              className={cn(
                'rounded-lg border px-2 py-2 min-h-[52px] text-center transition-colors',
                activeMarket === option.value
                  ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
                  : cn('bg-white dark:bg-gray-800/50', STOCK_BORDER, textMuted)
              )}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="block text-[11px] tabular-nums truncate opacity-80">
                {option.subtotal == null
                  ? `${option.count}종목`
                  : `${option.count} · ${option.subtotal}`}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 목록 헤더 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Select value={sortOption} onValueChange={(value) => setSortOption(value as TossSortOption)}>
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
        {/* 현재가/평가금 토글이 있던 자리 — 이제 둘 다 한 줄에 나오므로 세전/세후 전환이 대신한다. */}
        <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 text-sm">
          <button
            type="button"
            onClick={() => setCostBasis('preCost')}
            aria-pressed={costBasis === 'preCost'}
            className={cn(
              'px-4 py-2 min-w-[70px] font-medium transition-colors',
              costBasis === 'preCost' ? STOCK_SEGMENT_ACTIVE : textMuted
            )}
          >
            세전
          </button>
          <button
            type="button"
            onClick={() => setCostBasis('afterCost')}
            aria-pressed={costBasis === 'afterCost'}
            className={cn(
              'px-4 py-2 min-w-[70px] font-medium transition-colors',
              costBasis === 'afterCost' ? STOCK_SEGMENT_ACTIVE : textMuted
            )}
          >
            세후
          </button>
        </div>
      </div>

      {/* 보유 종목 */}
      <div className="space-y-2">
        {sortedHoldings.length === 0 ? (
          <div className={cn('py-12 text-center', textMuted)}>{emptyListMessage}</div>
        ) : (
          sortedHoldings.map((holding) => (
            <TossHoldingListItem
              key={`${holding.marketCountry}-${holding.symbol}`}
              holding={holding}
              costBasis={costBasis}
              usdKrwRate={portfolio.usdKrwRate}
              isMobile={isMobile}
              onExpand={tradeHistory.load}
              trades={tradeHistory.trades.filter((trade) => trade.symbol === holding.symbol)}
              tradesEstimated={tradeHistory.estimated}
            />
          ))
        )}
      </div>

      {/*
        바닥의 "수익분석" 버튼은 상단 탭과 목적지가 같아 없앴고, 새로고침은 종목이 늘어나면
        도달할 수 없는 위치라 헤더로 옮겼다.
      */}
    </div>
  );
};

export default TossStockAssetsTab;
