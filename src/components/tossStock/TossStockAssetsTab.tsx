import React, { useState, useMemo } from 'react';
import type { TossOpenOrder, TossOrderSide, TossPortfolio, TossTrade } from '@/types/tossStock';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowUpDown, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTossTradeHistory } from '@/hooks/useTossTradeHistory';
import TossHoldingListItem from './TossHoldingListItem';
import TossOpenOrdersSection from './TossOpenOrdersSection';
import TossCurrencySegment, { type TossSegmentOption } from './TossCurrencySegment';
import TossPortfolioHero from './TossPortfolioHero';
import { cn } from '@/lib/utils';
import { STOCK_TEXT_MUTED } from '@/lib/stockTheme';
import { formatExchangeRate, formatMoney, formatOptionalMoney } from '@/lib/tossFormat';
import {
  filterHoldingsByMarket,
  hasDomesticHoldings,
  hasOverseasHoldings,
  sortHoldings,
  type TossCostBasis,
  type TossMarketSegment,
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

/** 환율 등락 표시. EQUAL 이나 값이 없으면 아무것도 붙이지 않는다. */
const RATE_CHANGE_MARK: Record<string, string> = { UP: ' ▲', DOWN: ' ▼' };

/** 거래 내역이 없는 종목에 매번 새 배열을 넘기면 그것만으로 리렌더가 발생한다. */
const EMPTY_TRADES: TossTrade[] = [];

interface TossStockAssetsTabProps {
  portfolio: TossPortfolio;
  onRefresh: () => void;
  loading: boolean;
  /**
   * 주문 UI 를 그릴지. 서버가 내려주는 값이며 <b>표시 제어일 뿐</b>이다 —
   * 조작해도 주문 엔드포인트가 403 을 낸다.
   */
  canTrade?: boolean;
  openOrders?: TossOpenOrder[];
  onCancelOrder?: (orderId: string) => void;
  cancelingOrderId?: string | null;
  /** 종목 검색 시트 열기. 시트 자체는 페이지가 들고 있다. */
  onOpenSearch?: () => void;
  /** 보유 종목의 매수/매도. 주문 시트도 페이지가 들고 있다. */
  onTradeHolding?: (symbol: string, side: TossOrderSide) => void;
}

const TossStockAssetsTab: React.FC<TossStockAssetsTabProps> = ({
  portfolio,
  onRefresh,
  loading,
  canTrade = false,
  openOrders = [],
  onCancelOrder,
  cancelingOrderId = null,
  onOpenSearch,
  onTradeHolding,
}) => {
  const isMobile = useIsMobile();
  const [costBasis, setCostBasis] = useState<TossCostBasis>('preCost');
  const [sortOption, setSortOption] = useState<TossSortOption>('marketValueDesc');
  const [segment, setSegment] = useState<TossMarketSegment>('KR');
  const tradeHistory = useTossTradeHistory(portfolio.owner);

  const hasDomestic = hasDomesticHoldings(portfolio);
  const hasOverseas = hasOverseasHoldings(portfolio);

  /**
   * 세그먼트는 실제 보유 종목에서 파생시킨다. 한쪽만 보유한 계좌에서는 전환 UI 자체를 그리지 않고,
   * 고를 수 없게 된 통화가 선택 상태로 남아 목록이 조용히 비는 일이 없게 한다.
   */
  const segments: TossSegmentOption[] = useMemo(() => {
    const options: TossSegmentOption[] = [];
    if (hasDomestic) {
      options.push({
        value: 'KR',
        label: '국내 ₩',
        count: portfolio.holdings.filter((holding) => holding.marketCountry === 'KR').length,
      });
    }
    if (hasOverseas) {
      options.push({
        value: 'US',
        label: '해외 $',
        count: portfolio.holdings.filter((holding) => holding.marketCountry === 'US').length,
      });
    }
    return options;
  }, [
    hasDomestic,
    hasOverseas,
    portfolio.holdings,
  ]);

  // 해외 전용 계좌에서 기본값 'KR' 이 그대로 남지 않도록 실제 선택 가능한 값으로 되돌린다.
  const activeSegment: TossMarketSegment = segments.some((option) => option.value === segment)
    ? segment
    : (segments[0]?.value ?? 'KR');

  const sortedHoldings = useMemo(
    () => sortHoldings(filterHoldingsByMarket(portfolio.holdings, activeSegment), sortOption),
    [portfolio.holdings, activeSegment, sortOption]
  );

  // 거래 내역은 계좌 한 벌을 공유한다. 종목마다 filter 를 돌리면 종목 수 × 거래 수만큼 훑게 된다.
  const tradesBySymbol = useMemo(() => {
    const grouped = new Map<string, TossTrade[]>();
    for (const trade of tradeHistory.trades) {
      const bucket = grouped.get(trade.symbol);
      if (bucket) bucket.push(trade);
      else grouped.set(trade.symbol, [trade]);
    }
    return grouped;
  }, [tradeHistory.trades]);

  const textMuted = STOCK_TEXT_MUTED;
  const rateChangeMark = portfolio.usdKrwRateChangeType
    ? (RATE_CHANGE_MARK[portfolio.usdKrwRateChangeType] ?? '')
    : '';

  return (
    <div className={cn('space-y-4 sm:space-y-6', isMobile && 'pb-6')}>
      {/*
        미체결 주문은 이 화면에서 가장 시간에 민감한 정보다. 아래로 밀리면 사용자는 자기 주문이
        살아 있는지 모른 채 같은 주문을 한 번 더 낸다. 건수가 0이면 섹션 자체가 그려지지 않는다.
      */}
      {canTrade && onCancelOrder && (
        <TossOpenOrdersSection
          orders={openOrders}
          onCancel={onCancelOrder}
          cancelingOrderId={cancelingOrderId}
        />
      )}

      {/*
        데이터 기준 시각과 환율.
        환율은 금액 환산에 쓰지 않지만, 해외 종목을 달러로 읽는 동안 크기를 가늠할 잣대는 있어야 한다.
      */}
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-xs tabular-nums', textMuted)} data-testid="data-freshness">
          {formatUpdatedAt(portfolio.lastUpdated)} 기준
          {portfolio.usdKrwRate != null &&
            ` · ${formatExchangeRate(portfolio.usdKrwRate)}${rateChangeMark}`}
        </p>
        <div className="flex items-center gap-2">
          {/* 보유하지 않은 종목을 사려면 먼저 찾을 수 있어야 한다. */}
          {canTrade && onOpenSearch && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[36px]"
              onClick={onOpenSearch}
              aria-label="종목 검색"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
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
      </div>

      <TossCurrencySegment segments={segments} value={activeSegment} onChange={setSegment} />

      <TossPortfolioHero
        portfolio={portfolio}
        segment={activeSegment}
        costBasis={costBasis}
        onCostBasisChange={setCostBasis}
      />

      {/* 목록 헤더. 세전/세후 토글은 화면 전체의 기준이라 요약 카드 머리로 옮겼다. */}
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
              costBasis={costBasis}
              isMobile={isMobile}
              onLoadTrades={tradeHistory.load}
              trades={tradesBySymbol.get(holding.symbol) ?? EMPTY_TRADES}
              tradesEstimated={tradeHistory.estimated}
              tradesStatus={tradeHistory.status}
              onTrade={
                canTrade && onTradeHolding
                  ? (side) => onTradeHolding(holding.symbol, side)
                  : undefined
              }
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
