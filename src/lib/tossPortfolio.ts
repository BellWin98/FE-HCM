import type { TossCurrency, TossHolding, TossPortfolio } from '@/types/tossStock';

/**
 * 토스 자산 화면에서 응답으로부터 파생시키는 값들.
 *
 * 토스 응답은 국내(`...Krw`)와 해외(`...Usd`)를 따로 담아 주고 통화 간 합산은 하지 않는다.
 * 두 덩어리를 견주거나 한 줄로 정렬하려면 환율로 환산해야 하는데, 환율은 백엔드가 함께 내려준다
 * (`usdKrwRate`). 환율이 없으면 환산은 불가능하며 그 경우 `null` 을 돌려준다 —
 * 0 으로 대체하면 해외 자산이 통째로 사라진 것처럼 보인다.
 */

/**
 * 통화 한 쪽(국내 또는 해외)만의 손익률(%).
 *
 * 응답의 `totalProfitLossRate` 는 국내·해외를 환산해 합친 <b>전체</b> 기준이라 한쪽만 볼 때는 쓸 수 없다.
 * 같은 통화 안에서의 나눗셈이므로 환율 없이도 정확하다.
 */
export const legProfitLossRate = (
  profitLoss: number | null | undefined,
  purchaseAmount: number | null | undefined
): number | null => {
  if (profitLoss == null || purchaseAmount == null || purchaseAmount === 0) return null;
  return (profitLoss / purchaseAmount) * 100;
};

/**
 * 종목 거래통화로 된 금액을 원화로 환산한다.
 * 원화 종목은 그대로, 해외 종목은 환율이 있어야 하고 없으면 `null`.
 */
export const amountInKrw = (
  amount: number,
  currency: TossCurrency,
  usdKrwRate: number | null
): number | null => {
  if (currency !== 'USD') return amount;
  if (usdKrwRate == null) return null;
  return amount * usdKrwRate;
};

/** 보유 종목 하나의 원화 환산 평가금액. 해외 종목인데 환율이 없으면 환산할 수 없다. */
export const holdingMarketValueInKrw = (
  holding: TossHolding,
  usdKrwRate: number | null
): number | null => amountInKrw(holding.marketValue, holding.currency, usdKrwRate);

/** 목록에 어떤 시장을 남길지. 계좌 전체를 바꾸는 것이 아니라 목록만 좁힌다. */
export type TossMarketFilter = 'ALL' | 'KR' | 'US';

export const filterHoldingsByMarket = (
  holdings: TossHolding[],
  market: TossMarketFilter
): TossHolding[] => {
  if (market === 'ALL') return holdings;
  return holdings.filter((holding) => holding.marketCountry === market);
};

export type TossSortOption =
  | 'profitRateAsc'
  | 'profitRateDesc'
  | 'marketValueAsc'
  | 'marketValueDesc';

/**
 * 보유 종목 정렬.
 *
 * 평가금 정렬은 통화를 맞춰야 의미가 있다 — `880800`(원)과 `1132.80`(달러)을 그냥 비교하면
 * "평가금 높은 순"이 사실상 "국내 종목 먼저"가 되고 해외 종목은 아무리 커도 바닥에 깔린다.
 * 환율이 있으면 원화로 환산해 함께 정렬하고, 없으면 통화별로 묶어(국내 먼저) 그룹 안에서만 정렬한다.
 * 손익률은 애초에 통화와 무관한 비율이라 언제나 전체를 함께 정렬한다.
 */
export const sortHoldings = (
  holdings: TossHolding[],
  sortOption: TossSortOption,
  usdKrwRate: number | null
): TossHolding[] => {
  const byRate = sortOption === 'profitRateAsc' || sortOption === 'profitRateDesc';
  const ascending = sortOption === 'profitRateAsc' || sortOption === 'marketValueAsc';
  const direction = ascending ? 1 : -1;

  return [...holdings].sort((a, b) => {
    if (byRate) return (a.profitLossRate - b.profitLossRate) * direction;

    const left = holdingMarketValueInKrw(a, usdKrwRate);
    const right = holdingMarketValueInKrw(b, usdKrwRate);
    // 환산이 불가능한 조합(환율 없음 + 해외 종목)은 국내를 먼저 두고 통화 안에서만 비교한다.
    if (left == null || right == null) {
      if (a.currency !== b.currency) return a.currency === 'KRW' ? -1 : 1;
      return (a.marketValue - b.marketValue) * direction;
    }
    return (left - right) * direction;
  });
};

/**
 * 계좌 전체를 한 숫자로 보여줄 수 있는 상태인지.
 *
 * 해외 종목이 없으면 국내 금액이 곧 전체이고, 있으면 환율이 있어야 합칠 수 있다.
 * 백엔드가 그 판단을 마친 결과가 `totalMarketValueInKrw` 이므로 그것만 보면 된다.
 */
export const canShowUnifiedTotal = (portfolio: TossPortfolio): boolean =>
  portfolio.totalMarketValueInKrw != null;

/** 해외 종목을 보유 중인지. 0과 미보유를 구분해야 하므로 금액이 아니라 null 여부로 판단한다. */
export const hasOverseasHoldings = (portfolio: TossPortfolio): boolean =>
  portfolio.totalMarketValueUsd != null;
