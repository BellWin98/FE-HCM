import React, { useState, useMemo } from 'react';
import type { TossHolding, TossTrade } from '@/types/tossStock';
import { ChevronDown, ChevronUp, Check, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { STOCK_TEXT_MUTED, STOCK_BORDER, STOCK_SEGMENT_ACTIVE } from '@/lib/stockTheme';
import { formatPercentage, getProfitLossColor } from '@/lib/stockFormat';
import { formatMoney, formatQuantity, formatSignedMoney } from '@/lib/tossFormat';
import { type TossCostBasis } from '@/lib/tossPortfolio';
import type { TossTradeHistoryStatus } from '@/hooks/useTossTradeHistory';

const parseLocalDate = (value: string): Date => {
  if (!value) return new Date(NaN);
  const parts = value.split(/[-/T]/);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) || 1;
  const day = parseInt(parts[2], 10) || 1;
  if (isNaN(year)) return new Date(NaN);
  return new Date(year, month - 1, day);
};

const isDateValid = (date: Date): boolean => !isNaN(date.getTime());

const formatDateSafe = (date: Date, formatStr: string, fallback: string): string => {
  if (!isDateValid(date)) return fallback;
  try {
    return format(date, formatStr, { locale: ko });
  } catch {
    return fallback;
  }
};

interface DisclosureProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * 상세 안에서 한 번 더 접히는 구역.
 *
 * 판단에 바로 쓰지 않는 값(비용, 거래 내역)을 기본으로 감춰 상세의 첫 화면을 짧게 유지한다.
 * 팝오버/시트가 아니라 인라인이라 스크롤 문맥이 끊기지 않고, 열고 닫기가 한 번씩이면 끝난다.
 */
const Disclosure: React.FC<DisclosureProps> = ({ label, open, onToggle, children }) => (
  <div className={cn('pt-4 border-t', STOCK_BORDER)}>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={cn(
        'flex items-center justify-between w-full min-h-[44px] text-sm font-medium',
        STOCK_TEXT_MUTED
      )}
    >
      {label}
      {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
    {open && <div className="pt-2">{children}</div>}
  </div>
);

interface TossHoldingListItemProps {
  holding: TossHolding;
  /**
   * 세전(`preCost`) / 세후(`afterCost`) 기준. 요약과 함께 화면 전체가 한 기준을 따른다.
   * 접힌 줄뿐 아니라 펼친 상세의 평가금·손익·게이지까지 같이 바뀐다.
   */
  costBasis: TossCostBasis;
  isMobile: boolean;
  trades?: TossTrade[];
  /** 거래 내역에 추정 원가가 섞여 있는지. 수익분석 탭과 같은 안내를 이 자리에도 띄운다. */
  tradesEstimated?: boolean;
  /**
   * 거래 내역 조회 상태. 빈 배열만으로는 "아직 안 받았다"와 "받아 보니 없다"를 구분할 수 없어,
   * 응답을 기다리는 동안 "거래 내역이 없습니다"가 떠 버린다.
   * 상태를 넘기지 않는 호출자(순수 표시용)를 위해 기본값은 이미 정착한 상태로 둔다.
   */
  tradesStatus?: TossTradeHistoryStatus;
  /**
   * 거래 내역을 <b>실제로 열었을 때</b> 불러오게 한다.
   * 줄을 펼치는 것만으로 부르면, 판단만 하고 닫는 대부분의 경우에 계좌 전체 주문 조회가 헛돈다.
   */
  onLoadTrades?: () => void;
  /**
   * 매수/매도 요청. <b>주문 시트를 여기서 렌더하지 않고 콜백만 올린다</b> —
   * 목록이 리렌더될 때 이 항목이 언마운트되면 열려 있던 시트가 함께 사라지기 때문이다.
   * 시트는 페이지가 들고 있어야 한다.
   */
  onTrade?: (side: 'BUY' | 'SELL') => void;
}

/**
 * 보유 종목 한 줄.
 *
 * 모든 금액은 종목의 거래통화로만 포맷한다 — 원화 병기는 하지 않는다. 평단·투자원금·손익은
 * 매수 시점 환율로 확정된 과거 금액이라 오늘 환율로 환산하면 어느 쪽도 아닌 값이 되기 때문이다.
 * 국내·해외를 나란히 견주는 일은 통화 세그먼트가 대신한다.
 */
const TossHoldingListItem: React.FC<TossHoldingListItemProps> = ({
  holding,
  costBasis,
  isMobile,
  trades = [],
  tradesEstimated = false,
  tradesStatus = 'loaded',
  onLoadTrades,
  onTrade,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showCosts, setShowCosts] = useState(false);
  const [showTrades, setShowTrades] = useState(false);
  const [tradeSortOrder, setTradeSortOrder] = useState<'desc' | 'asc'>('desc');

  const currency = holding.currency;
  const money = (amount: number): string => formatMoney(amount, currency);
  const signedMoney = (amount: number): string => formatSignedMoney(amount, currency);
  const textMuted = STOCK_TEXT_MUTED;

  const tradesGrouped = useMemo(() => {
    const sorted = [...trades].sort((a, b) => {
      const dateCompare =
        tradeSortOrder === 'desc'
          ? b.tradeDate.localeCompare(a.tradeDate)
          : a.tradeDate.localeCompare(b.tradeDate);
      if (dateCompare !== 0) return dateCompare;
      // 같은 날짜면 매수를 먼저 보여준다.
      if (a.tradeType === 'BUY' && b.tradeType === 'SELL') return -1;
      if (a.tradeType === 'SELL' && b.tradeType === 'BUY') return 1;
      return 0;
    });

    const byDate: Record<string, TossTrade[]> = {};
    for (const trade of sorted) {
      byDate[trade.tradeDate] = byDate[trade.tradeDate] ?? [];
      byDate[trade.tradeDate].push(trade);
    }
    return Object.entries(byDate).sort(([a], [b]) =>
      tradeSortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b)
    );
  }, [trades, tradeSortOrder]);

  const handleToggle = () => setExpanded((current) => !current);
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };
  const handleToggleTrades = () => {
    setShowTrades((current) => {
      if (!current) onLoadTrades?.();
      return !current;
    });
  };

  const dailyRate = holding.dailyProfitLossRate;
  const isOverseas = holding.marketCountry === 'US';

  // 세전/세후는 평가금과 손익 세 값이 한 세트로 바뀐다 — 섞어 보여주면 어느 기준인지 알 수 없다.
  const afterCost = costBasis === 'afterCost';
  const shownMarketValue = afterCost ? holding.marketValueAfterCost : holding.marketValue;
  const shownProfitLoss = afterCost ? holding.profitLossAfterCost : holding.profitLoss;
  const shownProfitLossRate = afterCost ? holding.profitLossRateAfterCost : holding.profitLossRate;

  // 반대쪽 기준. 세금·수수료가 얼마나 갉아먹는지는 두 값을 나란히 봐야 안다.
  const otherProfitLoss = afterCost ? holding.profitLoss : holding.profitLossAfterCost;
  const otherProfitLossRate = afterCost
    ? holding.profitLossRate
    : holding.profitLossRateAfterCost;
  const otherLabel = afterCost ? '세전' : '세후';


  const dailyBadge = (
    <span
      className={cn(
        'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
        dailyRate > 0 && 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        dailyRate < 0 && 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        dailyRate === 0 && 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      )}
    >
      오늘 {formatPercentage(dailyRate)}
    </span>
  );

  /**
   * 접힌 줄의 단가 3종(수량·평단·현재가).
   *
   * 라벨을 값 <b>위에</b> 얹어 한 칸으로 묶는다 — 라벨을 값 앞에 붙이면 줄이 길어져 모바일에서
   * 잘리고, 라벨을 빼면 어느 숫자가 무엇인지 읽어내야 한다. 라벨 행과 값 행을 따로 두는 그리드는
   * 스크린리더가 "수량 평단 현재가 12주 …" 순으로 읽어 버리므로 칸 단위로 감싼다.
   */
  const priceCell = (label: string, value: string, valueClass?: string) => (
    <div className="min-w-0">
      <span className="block text-[10px] leading-tight text-gray-400 dark:text-gray-500">
        {label}
      </span>
      <span
        className={cn(
          'block text-xs tabular-nums truncate',
          valueClass ?? 'text-gray-700 dark:text-gray-300'
        )}
      >
        {value}
      </span>
    </div>
  );

  const tradesLoading = tradesStatus === 'loading' || tradesStatus === 'idle';
  const tradesFailed = tradesStatus === 'error';
  const hasTrades = !tradesLoading && !tradesFailed && tradesGrouped.length > 0;

  /**
   * 응답을 기다리는 동안의 자리. 스피너 대신 실제 줄 모양을 그린다 —
   * 무엇이 올 자리인지 미리 보여주고, 도착했을 때 높이가 튀지 않는다.
   */
  const tradesSkeleton = (
    <div className="space-y-2" data-testid="trades-loading" aria-busy="true" aria-live="polite">
      <span className="sr-only">거래 내역을 불러오는 중입니다.</span>
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className="flex items-center justify-between py-2 min-h-[44px] animate-pulse"
        >
          <div className="flex items-center gap-2">
            <div className="h-3 w-7 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  );

  /**
   * 조회 실패. "거래 내역이 없습니다"로 뭉뚱그리면 없는 것과 못 받은 것이 같아 보인다.
   * 훅이 실패 시 요청 기록을 되돌려 두므로 같은 `onLoadTrades` 가 곧 재시도다.
   */
  const tradesError = (
    <div className="py-6 text-center space-y-2" data-testid="trades-error" aria-live="polite">
      <p className={cn('text-sm', textMuted)}>거래 내역을 불러오지 못했어요.</p>
      <button
        type="button"
        onClick={onLoadTrades}
        className="min-h-[36px] px-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        다시 시도
      </button>
    </div>
  );

  /** 포지션 블록의 한 줄. 라벨과 값만 있는 2열이라 별도 컴포넌트 없이 반복한다. */
  const positionRow = (testId: string, label: string, value: string) => (
    <div className="contents" data-testid={testId}>
      <span className={cn('text-sm', textMuted)}>{label}</span>
      <span className="text-right font-medium text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">
        {value}
      </span>
    </div>
  );

  const detailSection = (
    <div
      data-testid="holding-detail"
      className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-5"
    >
      {/*
        ① 판단 블록. 매수/매도를 정할 때 실제로 보는 값만 위로 올린다 —
        현재가가 평단의 어느 쪽에 얼마나 가 있는지, 그래서 지금 얼마를 벌고 있는지, 오늘은 어땠는지.
      */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn('text-xs', textMuted)}>현재가</p>
            <p
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums"
              data-testid="holding-last-price"
            >
              {money(holding.lastPrice)}
            </p>
          </div>
          {dailyBadge}
        </div>
        <p
          className={cn('text-xs mt-1 flex items-center gap-1 tabular-nums', textMuted)}
          data-testid="holding-average-price"
        >
          <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          평단 {money(holding.averagePurchasePrice)}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div data-testid="holding-profit-loss">
            <p className={cn('text-xs', textMuted)}>평가손익</p>
            <p
              className={cn(
                'text-base font-bold mt-0.5 tabular-nums',
                getProfitLossColor(shownProfitLoss)
              )}
            >
              {signedMoney(shownProfitLoss)}
            </p>
            <p className={cn('text-xs tabular-nums', getProfitLossColor(shownProfitLoss))}>
              {formatPercentage(shownProfitLossRate)}
            </p>
          </div>
          <div data-testid="holding-daily-profit">
            <p className={cn('text-xs', textMuted)}>오늘 손익</p>
            <p
              className={cn(
                'text-base font-bold mt-0.5 tabular-nums',
                getProfitLossColor(holding.dailyProfitLoss)
              )}
            >
              {signedMoney(holding.dailyProfitLoss)}
            </p>
            <p className={cn('text-xs tabular-nums', getProfitLossColor(holding.dailyProfitLoss))}>
              {formatPercentage(dailyRate)}
            </p>
          </div>
        </div>
      </div>

      {/* ② 포지션 블록. 얼마를 얼마어치 들고 있는지 — 판단의 배경이 되는 값들. */}
      <div className={cn('grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-3 items-baseline pt-4 border-t', STOCK_BORDER)}>
        {positionRow('holding-quantity', '보유 수량', `${formatQuantity(holding.quantity)}주`)}
        {positionRow('holding-purchase-amount', '투자 원금', money(holding.purchaseAmount))}
        {positionRow('holding-market-value', '평가금액', money(shownMarketValue))}
      </div>

      {/*
        ③ 비용. 위 손익이 고른 기준을 따르므로 여기서는 <b>반대쪽 기준</b>을 보여준다 —
        수수료·세금과 나란히 놓아야 두 기준의 차이가 어디서 왔는지 바로 읽힌다.
      */}
      <Disclosure label="수수료·세금" open={showCosts} onToggle={() => setShowCosts((v) => !v)}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-3 items-baseline">
          {positionRow('holding-commission', '수수료', money(holding.commission))}
          {positionRow('holding-tax', '세금', money(holding.tax))}
          <div className="contents" data-testid="holding-counterpart-profit">
            <span className={cn('text-sm', textMuted)}>{otherLabel} 손익</span>
            <span
              className={cn(
                'text-right font-medium tabular-nums whitespace-nowrap',
                getProfitLossColor(otherProfitLoss)
              )}
            >
              {signedMoney(otherProfitLoss)}
              <span className="ml-1 text-xs font-normal">
                ({formatPercentage(otherProfitLossRate)})
              </span>
            </span>
          </div>
        </div>
      </Disclosure>

      {/* ④ 거래 내역. 여는 순간에야 계좌 전체 주문을 불러온다. */}
      <Disclosure label="거래 내역" open={showTrades} onToggle={handleToggleTrades}>
        {/* 주문 이력보다 앞서 매수한 종목은 원가를 보유 평균단가로 메운다 — 그 사실을 밝힌다. */}
        {tradesEstimated && hasTrades && (
          <div
            className={cn(
              'flex items-start gap-2 p-3 rounded-lg text-xs mb-3',
              'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
            )}
          >
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>주문 이력보다 앞서 매수한 종목이 있어 일부 손익은 추정치입니다.</span>
          </div>
        )}
        {/* 정렬 토글은 정렬할 것이 있을 때만. 빈 화면에 컨트롤만 떠 있으면 데이터가 있는 줄 안다. */}
        {hasTrades && (
          <div className="flex items-center justify-end mb-3">
            <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
              <button
                type="button"
                className={cn(
                  'px-2.5 py-1 min-w-[60px]',
                  tradeSortOrder === 'desc' ? STOCK_SEGMENT_ACTIVE : textMuted
                )}
                onClick={() => setTradeSortOrder('desc')}
              >
                최신순
              </button>
              <button
                type="button"
                className={cn(
                  'px-2.5 py-1 min-w-[60px]',
                  tradeSortOrder === 'asc' ? STOCK_SEGMENT_ACTIVE : textMuted
                )}
                onClick={() => setTradeSortOrder('asc')}
              >
                오래된순
              </button>
            </div>
          </div>
        )}
        <div className={cn('space-y-4', isMobile && 'max-h-[280px] overflow-y-auto scrollbar-hide')}>
          {tradesLoading ? (
            tradesSkeleton
          ) : tradesFailed ? (
            tradesError
          ) : tradesGrouped.length === 0 ? (
            <p className={cn('py-6 text-center text-sm', textMuted)} aria-live="polite">
              거래 내역이 없습니다.
            </p>
          ) : (
            tradesGrouped.map(([dateStr, dayTrades]) => {
              const date = parseLocalDate(dateStr);
              return (
                <div key={dateStr} className="space-y-2">
                  {dayTrades.map((trade, index) => (
                    <div
                      key={`${dateStr}-${trade.tradeType}-${index}`}
                      className="flex items-center justify-between py-2 min-h-[44px]"
                    >
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
                          {index === 0 ? formatDateSafe(date, 'M.d', dateStr) : ''}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-medium truncate',
                            trade.tradeType === 'SELL'
                              ? 'text-blue-500 dark:text-blue-400'
                              : 'text-gray-900 dark:text-gray-100'
                          )}
                        >
                          {trade.tradeType === 'BUY' ? '구매' : '판매'} {formatQuantity(trade.quantity)}주
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0 ml-2">
                        주당 {formatMoney(trade.price, trade.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </Disclosure>

      {/*
        ⑤ 매수·매도. 이미 펼쳐서 판단을 마친 자리에 둔다 — 접힌 줄에 두면 스크롤 중 오탭이 나고,
        여기까지 왔다는 것 자체가 이 종목을 들여다봤다는 뜻이다.
      */}
      {onTrade && (
        <div className={cn('grid grid-cols-2 gap-2 border-t pt-4', STOCK_BORDER)}>
          <button
            type="button"
            onClick={() => onTrade('BUY')}
            className="min-h-[48px] rounded-lg bg-red-500 text-sm font-semibold text-white active:bg-red-600"
          >
            매수
          </button>
          <button
            type="button"
            onClick={() => onTrade('SELL')}
            className="min-h-[48px] rounded-lg bg-blue-500 text-sm font-semibold text-white active:bg-blue-600"
          >
            매도
          </button>
        </div>
      )}
    </div>
  );

  const header = (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center gap-2.5 py-3 pr-3 pl-3 min-h-[56px]',
        isMobile
          ? 'active:bg-gray-50 dark:active:bg-gray-800/70'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/70 cursor-pointer'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-gray-900 dark:text-gray-100 break-words leading-snug">
            {holding.name}
          </span>
          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {isOverseas ? 'US' : 'KR'}
          </span>
          {dailyBadge}
        </div>
        {/*
          수량·평단·현재가. 현재가에만 평단 대비 방향으로 색을 입혀, 두 숫자를 견주지 않아도
          지금 평단 위인지 아래인지가 한눈에 들어오게 한다(왼쪽 게이지·오른쪽 손익률과 같은 색 규칙).
        */}
        <div className="mt-1 flex items-start gap-3 overflow-hidden" data-testid="holding-price-strip">
          {priceCell('수량', `${formatQuantity(holding.quantity)}주`)}
          {priceCell('평단', money(holding.averagePurchasePrice))}
          {priceCell(
            '현재가',
            money(holding.lastPrice),
            cn('font-semibold', getProfitLossColor(holding.lastPrice - holding.averagePurchasePrice))
          )}
        </div>
      </div>
      {/* 원화 병기가 빠진 자리를 손익 금액과 손익률을 두 줄로 푸는 데 쓴다. */}
      <div className="text-right shrink-0 tabular-nums">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap leading-snug">
          {money(shownMarketValue)}
        </div>
        <div
          className={cn(
            'text-xs font-medium whitespace-nowrap mt-0.5',
            getProfitLossColor(shownProfitLoss)
          )}
        >
          {signedMoney(shownProfitLoss)}
        </div>
        <div className={cn('text-xs font-medium whitespace-nowrap', getProfitLossColor(shownProfitLoss))}>
          {formatPercentage(shownProfitLossRate)}
        </div>
      </div>
      {expanded ? (
        <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
      )}
    </div>
  );

  return (
    <div
      data-testid={`holding-row-${holding.symbol}`}
      className={cn('rounded-lg border bg-white dark:bg-gray-800/50 overflow-hidden flex', STOCK_BORDER)}
    >
      {/* 손익 방향 스트립. 색만으로 훑을 수 있어야 종목이 늘어나도 리스트가 읽힌다. */}
      <div
        aria-hidden="true"
        className={cn(
          'w-1 shrink-0',
          shownProfitLoss > 0 && 'bg-red-500 dark:bg-red-400',
          shownProfitLoss < 0 && 'bg-blue-500 dark:bg-blue-400',
          shownProfitLoss === 0 && 'bg-gray-200 dark:bg-gray-600'
        )}
      />
      <div className="flex-1 min-w-0">
        {header}
        {expanded && detailSection}
      </div>
    </div>
  );
};

export default TossHoldingListItem;
