import React, { useState, useMemo } from 'react';
import type { TossHolding, TossTrade } from '@/types/tossStock';
import { ChevronDown, ChevronUp, Check, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { STOCK_TEXT_MUTED, STOCK_BORDER, STOCK_SEGMENT_ACTIVE } from '@/lib/stockTheme';
import { formatPercentage, getProfitLossColor } from '@/lib/stockFormat';
import { formatExchangeRate, formatMoney, formatQuantity, formatSignedMoney } from '@/lib/tossFormat';
import { amountInKrw, holdingMarketValueInKrw } from '@/lib/tossPortfolio';

/** 손익을 세전으로 볼지 세후로 볼지. 목록 전체가 한 기준을 따른다. */
export type TossCostBasis = 'preCost' | 'afterCost';

/** 펼친 상세의 금액 한 줄. 해외 종목이면 오른쪽에 원화 환산 칸이 하나 더 붙는다. */
interface DetailRow {
  key: string;
  label: string;
  /** 종목 거래통화 기준 금액. 원화 칸은 여기서 환산해 만든다. */
  amount: number;
  /** 손익처럼 부호가 의미를 갖는 값인지. */
  signed?: boolean;
  /** 손익 방향에 따라 색을 입힐지. */
  colored?: boolean;
  /** 함께 보여줄 손익률(%). 통화와 무관해 거래통화 칸에만 한 번 붙인다. */
  rate?: number;
  testId?: string;
}

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

interface TossHoldingListItemProps {
  holding: TossHolding;
  /** 세전(`preCost`) / 세후(`afterCost`) 기준. 평가금과 손익이 한 세트로 바뀐다. */
  costBasis: TossCostBasis;
  /** 해외 종목의 원화 병기에 쓴다. 없으면 병기를 생략한다. */
  usdKrwRate: number | null;
  isMobile: boolean;
  trades?: TossTrade[];
  /** 거래 내역에 추정 원가가 섞여 있는지. 수익분석 탭과 같은 안내를 이 자리에도 띄운다. */
  tradesEstimated?: boolean;
  /** 처음 펼칠 때 거래 내역을 불러오게 한다 — 펼치지 않으면 받을 이유가 없는 데이터다. */
  onExpand?: () => void;
}

/**
 * 보유 종목 한 줄.
 *
 * 모든 금액을 종목의 거래통화로 포맷해야 달러 종목이 원화로 표시되지 않는다.
 * 다만 국내와 해외를 나란히 놓고 크기를 견주려면 환산이 필요하므로, 해외 종목에 한해
 * 원화를 <b>보조로 병기</b>한다.
 */
const TossHoldingListItem: React.FC<TossHoldingListItemProps> = ({
  holding,
  costBasis,
  usdKrwRate,
  isMobile,
  trades = [],
  tradesEstimated = false,
  onExpand,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [tradeSortOrder, setTradeSortOrder] = useState<'desc' | 'asc'>('desc');

  const currency = holding.currency;
  const money = (amount: number): string => formatMoney(amount, currency);
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

  const handleToggle = () => {
    setExpanded((current) => {
      if (!current) onExpand?.();
      return !current;
    });
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  const dailyRate = holding.dailyProfitLossRate;
  const isOverseas = holding.marketCountry === 'US';

  // 세전/세후는 평가금과 손익 세 값이 한 세트로 바뀐다 — 섞어 보여주면 어느 기준인지 알 수 없다.
  const afterCost = costBasis === 'afterCost';
  const shownMarketValue = afterCost ? holding.marketValueAfterCost : holding.marketValue;
  const shownProfitLoss = afterCost ? holding.profitLossAfterCost : holding.profitLoss;
  const shownProfitLossRate = afterCost ? holding.profitLossRateAfterCost : holding.profitLossRate;
  const marketValueInKrw = holdingMarketValueInKrw({ ...holding, marketValue: shownMarketValue }, usdKrwRate);

  // 해외 종목이면서 환율이 있을 때만 원화 열이 생긴다. 국내 종목은 이미 원화라 늘릴 이유가 없다.
  const showKrwColumn = isOverseas && usdKrwRate != null;
  const averagePriceInKrw = amountInKrw(holding.averagePurchasePrice, currency, usdKrwRate);

  const detailRows: DetailRow[] = [
    {
      key: 'marketValue',
      label: '총 금액',
      amount: holding.marketValue,
      testId: 'holding-market-value',
    },
    {
      key: 'profitLoss',
      label: '평가손익',
      amount: holding.profitLoss,
      signed: true,
      colored: true,
      rate: holding.profitLossRate,
      testId: 'holding-profit-loss',
    },
    {
      key: 'purchaseAmount',
      label: '투자 원금',
      amount: holding.purchaseAmount,
      testId: 'holding-purchase-amount',
    },
    // 접힌 줄에는 등락률만 보여서, 오늘 실제로 얼마가 움직였는지는 여기서만 알 수 있다.
    {
      key: 'dailyProfitLoss',
      label: '오늘 손익',
      amount: holding.dailyProfitLoss,
      signed: true,
      colored: true,
      rate: dailyRate,
      testId: 'holding-daily-profit',
    },
    {
      key: 'profitLossAfterCost',
      label: '비용 공제 후 손익',
      amount: holding.profitLossAfterCost,
      signed: true,
      colored: true,
      rate: holding.profitLossRateAfterCost,
      testId: 'holding-profit-after-cost',
    },
    { key: 'commission', label: '수수료', amount: holding.commission, testId: 'holding-commission' },
    { key: 'tax', label: '세금', amount: holding.tax, testId: 'holding-tax' },
  ];

  const detailSection = (
    <div
      data-testid="holding-detail"
      className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-5"
    >
      <div>
        <p className={cn('text-xs', textMuted)}>1주 평균금액</p>
        <div className="flex items-baseline gap-2 flex-wrap mt-1" data-testid="holding-average-price">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
            {money(holding.averagePurchasePrice)}
          </span>
          {showKrwColumn && (
            <span className={cn('text-sm tabular-nums', textMuted)}>
              {formatMoney(averagePriceInKrw as number, 'KRW')}
            </span>
          )}
        </div>
        <p className={cn('text-xs mt-1 flex items-center gap-1', textMuted)}>
          <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          수수료·세금 포함
        </p>
      </div>

      {/*
        금액을 통화별 열로 세운다.
        해외 종목은 값마다 원화를 덧붙여야 하는데, 줄마다 두 줄로 쌓으면 항목이 여덟이라 읽히지 않는다.
        열 머리에 통화를 한 번만 적고 각 줄을 한 줄로 유지하는 편이 훨씬 빨리 훑힌다.
        손익률은 통화와 무관하므로 거래통화 쪽에만 한 번 붙인다.
      */}
      <div
        className={cn(
          'grid gap-x-3 gap-y-3 items-baseline',
          showKrwColumn ? 'grid-cols-[minmax(0,1fr)_auto_auto]' : 'grid-cols-[minmax(0,1fr)_auto]'
        )}
      >
        {showKrwColumn && (
          <>
            <span />
            <span className={cn('text-[11px] text-right', textMuted)}>USD</span>
            <span className={cn('text-[11px] text-right', textMuted)}>KRW</span>
          </>
        )}

        <div className="contents">
          <span className={cn('text-sm', textMuted)}>보유 수량</span>
          <span className="text-right font-medium text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">
            {formatQuantity(holding.quantity)}주
          </span>
          {showKrwColumn && <span />}
        </div>

        {detailRows.map((row) => (
          <div className="contents" key={row.key} data-testid={row.testId}>
            <span className={cn('text-sm', textMuted)}>{row.label}</span>
            <span
              className={cn(
                'text-right font-medium tabular-nums whitespace-nowrap',
                row.colored
                  ? getProfitLossColor(row.amount)
                  : 'text-gray-900 dark:text-gray-100'
              )}
            >
              {row.signed ? formatSignedMoney(row.amount, currency) : money(row.amount)}
              {row.rate != null && (
                <span className="ml-1 text-xs font-normal">({formatPercentage(row.rate)})</span>
              )}
            </span>
            {showKrwColumn && (
              <span
                className={cn(
                  'text-right text-xs tabular-nums whitespace-nowrap',
                  row.colored ? getProfitLossColor(row.amount) : textMuted
                )}
              >
                {row.signed
                  ? formatSignedMoney(amountInKrw(row.amount, currency, usdKrwRate) as number, 'KRW')
                  : formatMoney(amountInKrw(row.amount, currency, usdKrwRate) as number, 'KRW')}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 투자 원금·수수료는 과거 금액이라, 오늘 환율로 환산한 값은 매수 시점의 원화와 다르다. */}
      {showKrwColumn && (
        <p className={cn('text-[11px] leading-relaxed', textMuted)}>
          원화는 현재 환율({formatExchangeRate(usdKrwRate as number)}) 기준이라 매수 시점 환율과 다릅니다.
        </p>
      )}

      <div>
        {/* 주문 이력보다 앞서 매수한 종목은 원가를 보유 평균단가로 메운다 — 그 사실을 밝힌다. */}
        {tradesEstimated && (
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
        <div className="flex items-center justify-between mb-3">
          <p className={cn('text-sm font-medium', textMuted)}>거래 내역</p>
          <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
            <button
              type="button"
              className={cn('px-2.5 py-1 min-w-[60px]', tradeSortOrder === 'desc' ? STOCK_SEGMENT_ACTIVE : textMuted)}
              onClick={() => setTradeSortOrder('desc')}
            >
              최신순
            </button>
            <button
              type="button"
              className={cn('px-2.5 py-1 min-w-[60px]', tradeSortOrder === 'asc' ? STOCK_SEGMENT_ACTIVE : textMuted)}
              onClick={() => setTradeSortOrder('asc')}
            >
              오래된순
            </button>
          </div>
        </div>
        <div className={cn('space-y-4', isMobile && 'max-h-[280px] overflow-y-auto scrollbar-hide')}>
          {tradesGrouped.length === 0 ? (
            <p className={cn('py-6 text-center text-sm', textMuted)}>거래 내역이 없습니다.</p>
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
      </div>
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
        </div>
        {/* 토글로 감추던 평단·현재가를 수량과 한 줄에 넣어 왕복 없이 읽히게 한다. */}
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 tabular-nums truncate">
          {formatQuantity(holding.quantity)}주 · 평단 {money(holding.averagePurchasePrice)} →{' '}
          {money(holding.lastPrice)}
        </div>
      </div>
      <div className="text-right shrink-0 tabular-nums">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap leading-snug">
          {money(shownMarketValue)}
        </div>
        {/* 해외 종목은 달러가 주(主)이되, 국내 종목과 크기를 견줄 수 있도록 원화를 병기한다. */}
        {isOverseas && marketValueInKrw != null && (
          <div className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {formatMoney(marketValueInKrw, 'KRW')}
          </div>
        )}
        <div
          className={cn(
            'text-xs font-medium whitespace-nowrap mt-0.5',
            getProfitLossColor(shownProfitLoss)
          )}
        >
          {formatSignedMoney(shownProfitLoss, currency)} · {formatPercentage(shownProfitLossRate)}
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
