import React from 'react';
import type { TossCurrency, TossPortfolio } from '@/types/tossStock';
import { cn } from '@/lib/utils';
import { STOCK_CARD_BG, STOCK_TEXT_MUTED, STOCK_BORDER } from '@/lib/stockTheme';
import { formatPercentage, getProfitLossColor } from '@/lib/stockFormat';
import { formatOptionalMoney, formatOptionalSignedMoney } from '@/lib/tossFormat';
import {
  legDailyChangeRate,
  legProfitLossRate,
  type TossCostBasis,
  type TossMarketSegment,
} from '@/lib/tossPortfolio';
import TossCostBasisToggle from './TossCostBasisToggle';

interface TossPortfolioHeroProps {
  portfolio: TossPortfolio;
  segment: TossMarketSegment;
  costBasis: TossCostBasis;
  onCostBasisChange: (value: TossCostBasis) => void;
}

/** 고른 통화 한 쪽의 값만 모은 것. 반대편 통화 값은 아예 손에 쥐지 않는다. */
interface CurrencyLeg {
  title: string;
  currency: TossCurrency;
  marketValue: number | null;
  marketValueAfterCost: number | null;
  purchaseAmount: number | null;
  profitLoss: number | null;
  profitLossAfterCost: number | null;
  dailyProfitLoss: number | null;
  cashBuyingPower: number | null;
}

const toLeg = (portfolio: TossPortfolio, segment: TossMarketSegment): CurrencyLeg =>
  segment === 'KR'
    ? {
        title: '국내 자산',
        currency: 'KRW',
        marketValue: portfolio.totalMarketValueKrw,
        marketValueAfterCost: portfolio.totalMarketValueAfterCostKrw,
        purchaseAmount: portfolio.totalPurchaseAmountKrw,
        profitLoss: portfolio.totalProfitLossKrw,
        profitLossAfterCost: portfolio.totalProfitLossAfterCostKrw,
        dailyProfitLoss: portfolio.dailyProfitLossKrw,
        cashBuyingPower: portfolio.cashBuyingPowerKrw,
      }
    : {
        title: '해외 자산',
        currency: 'USD',
        marketValue: portfolio.totalMarketValueUsd,
        marketValueAfterCost: portfolio.totalMarketValueAfterCostUsd,
        purchaseAmount: portfolio.totalPurchaseAmountUsd,
        profitLoss: portfolio.totalProfitLossUsd,
        profitLossAfterCost: portfolio.totalProfitLossAfterCostUsd,
        dailyProfitLoss: portfolio.dailyProfitLossUsd,
        cashBuyingPower: portfolio.cashBuyingPowerUsd,
      };

/** 비율은 계산이 불가능할 수 있다(원금 0, 값 없음). 0%로 대체하면 "본전"이라는 거짓말이 된다. */
const formatOptionalPercentage = (rate: number | null): string =>
  rate == null ? '—' : formatPercentage(rate);

/**
 * 고른 통화의 자산을 한 덩어리로 보여주는 요약.
 *
 * 손익률은 응답의 `totalProfitLossRate` 를 쓰지 않고 `legProfitLossRate` 로 직접 만든다 —
 * 응답 값은 국내·해외를 원화 환산해 합친 전체 기준이라, 여기 금액과 모집단이 달라
 * "-₩13,100 (+2.36%)" 처럼 손실인데 플러스 수익률인 줄이 나온다.
 *
 * 총자산·평가손익은 세전/세후 토글을 그대로 따르고, 반대쪽 기준은 아래 한 줄에 참고로 남긴다.
 */
const TossPortfolioHero: React.FC<TossPortfolioHeroProps> = ({
  portfolio,
  segment,
  costBasis,
  onCostBasisChange,
}) => {
  const leg = toLeg(portfolio, segment);
  const { currency } = leg;
  const afterCost = costBasis === 'afterCost';

  // 자산과 손익은 한 세트로 움직여야 한다 — 섞으면 어느 기준인지 알 수 없다.
  const shownMarketValue = afterCost ? leg.marketValueAfterCost : leg.marketValue;
  const shownProfitLoss = afterCost ? leg.profitLossAfterCost : leg.profitLoss;
  const shownProfitLossRate = legProfitLossRate(shownProfitLoss, leg.purchaseAmount);

  // 반대쪽 기준. 세금·수수료가 얼마나 갉아먹는지는 두 값을 나란히 봐야 안다.
  const otherProfitLoss = afterCost ? leg.profitLoss : leg.profitLossAfterCost;
  const otherProfitLossRate = legProfitLossRate(otherProfitLoss, leg.purchaseAmount);
  const otherLabel = afterCost ? '세전' : '세후';

  /**
   * 오늘 손익은 세후 값이 따로 없다(토스가 세전만 준다).
   * 분모도 같은 기준이어야 하므로 세전 평가금으로 계산한다.
   */
  const dailyChangeRate = legDailyChangeRate(leg.dailyProfitLoss, leg.marketValue);

  const textMuted = STOCK_TEXT_MUTED;

  return (
    <div className={cn('p-4 rounded-xl border', STOCK_CARD_BG)} data-testid="portfolio-hero">
      <div className="flex items-start justify-between gap-2">
        <p className={cn('text-sm', textMuted)}>{leg.title}</p>
        <TossCostBasisToggle value={costBasis} onChange={onCostBasisChange} />
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
        {formatOptionalMoney(shownMarketValue, currency)}
      </p>
      <p
        className={cn(
          'text-base mt-1 font-medium tabular-nums',
          getProfitLossColor(shownProfitLoss ?? 0)
        )}
      >
        {formatOptionalSignedMoney(shownProfitLoss, currency)} (
        {formatOptionalPercentage(shownProfitLossRate)})
      </p>

      <div className={cn('grid grid-cols-3 gap-3 mt-4 pt-3 border-t', STOCK_BORDER)}>
        <div className="min-w-0">
          <p className={cn('text-xs', textMuted)}>오늘</p>
          <p
            className={cn(
              'text-sm font-bold mt-0.5 tabular-nums truncate',
              getProfitLossColor(leg.dailyProfitLoss ?? 0)
            )}
          >
            {formatOptionalSignedMoney(leg.dailyProfitLoss, currency)}
          </p>
          <p className={cn('text-xs tabular-nums', getProfitLossColor(dailyChangeRate ?? 0))}>
            {formatOptionalPercentage(dailyChangeRate)}
          </p>
        </div>
        <div className="min-w-0">
          <p className={cn('text-xs', textMuted)}>투자원금</p>
          <p className="text-sm font-bold mt-0.5 text-gray-900 dark:text-gray-100 tabular-nums truncate">
            {formatOptionalMoney(leg.purchaseAmount, currency)}
          </p>
        </div>
        <div className="min-w-0">
          <p className={cn('text-xs', textMuted)}>현금 매수가능</p>
          <p className="text-sm font-bold mt-0.5 text-gray-900 dark:text-gray-100 tabular-nums truncate">
            {formatOptionalMoney(leg.cashBuyingPower, currency)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TossPortfolioHero;
