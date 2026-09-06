import type { TossHolding, TossPortfolio } from '@/types/tossStock';

/**
 * 토스 자산 화면에서 응답으로부터 파생시키는 값들.
 *
 * 토스 응답은 국내(`...Krw`)와 해외(`...Usd`)를 따로 담아 주고 통화 간 합산은 하지 않는다.
 * 화면도 합치지 않는다 — 평단·투자원금·손익은 매수/매도 시점 환율로 확정된 과거 금액이라
 * 오늘 환율을 곱하면 실제로 치른 원화도, 앞으로 손에 쥘 원화도 아닌 값이 나오기 때문이다.
 * 대신 통화 하나를 골라(`TossMarketSegment`) 그 통화로만 보여준다.
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
 * 통화 한 쪽만의 오늘 등락률(%).
 *
 * 응답의 `dailyProfitLossRate` 역시 원화 환산 전체 기준이라 통화별로 쓸 수 없는데,
 * 손익률과 달리 통화별 값이 아예 내려오지 않아 직접 만들어야 한다.
 * 전일 평가금을 `평가금 - 오늘손익` 으로 두는 근사다 — 장중에 추가 매수·매도가 있으면
 * 그만큼 어긋나지만, 오차가 매수/매도 판단을 뒤집는 크기는 아니다.
 */
export const legDailyChangeRate = (
  dailyProfitLoss: number | null | undefined,
  marketValue: number | null | undefined
): number | null => {
  if (dailyProfitLoss == null || marketValue == null) return null;
  const previous = marketValue - dailyProfitLoss;
  if (previous === 0) return null;
  return (dailyProfitLoss / previous) * 100;
};

/** 목록에 어떤 시장을 남길지. 화면 전체(요약 + 목록)가 이 선택 하나를 따른다. */
export type TossMarketSegment = 'KR' | 'US';

/**
 * 손익을 세전으로 볼지 세후로 볼지.
 *
 * 통화 세그먼트와 마찬가지로 <b>화면 전체</b>가 한 기준을 따른다 — 요약의 총자산·평가손익,
 * 목록 줄의 평가금·손익, 펼친 상세의 손익과 게이지까지 한 번에 바뀐다.
 * 일부만 따라가면 같은 화면 안에서 어느 숫자가 어느 기준인지 알 수 없게 된다.
 */
export type TossCostBasis = 'preCost' | 'afterCost';

export const filterHoldingsByMarket = (
  holdings: TossHolding[],
  market: TossMarketSegment
): TossHolding[] => holdings.filter((holding) => holding.marketCountry === market);

export type TossSortOption =
  | 'profitRateAsc'
  | 'profitRateDesc'
  | 'marketValueAsc'
  | 'marketValueDesc';

/**
 * 보유 종목 정렬.
 *
 * 목록은 세그먼트가 좁혀 준 <b>한 통화</b>만 담으므로 평가금을 그대로 비교하면 된다.
 * 그래도 통화 경계를 넘어 비교하지 않는 방어는 남겨 둔다 — `880800`(원)과 `1132.80`(달러)을
 * 그냥 견주면 "평가금 높은 순"이 사실상 "국내 종목 먼저"가 되기 때문이다.
 * 손익률은 애초에 통화와 무관한 비율이라 언제나 전체를 함께 정렬한다.
 */
export const sortHoldings = (
  holdings: TossHolding[],
  sortOption: TossSortOption
): TossHolding[] => {
  const byRate = sortOption === 'profitRateAsc' || sortOption === 'profitRateDesc';
  const ascending = sortOption === 'profitRateAsc' || sortOption === 'marketValueAsc';
  const direction = ascending ? 1 : -1;

  return [...holdings].sort((a, b) => {
    if (byRate) return (a.profitLossRate - b.profitLossRate) * direction;
    if (a.currency !== b.currency) return a.currency === 'KRW' ? -1 : 1;
    return (a.marketValue - b.marketValue) * direction;
  });
};

/**
 * 어느 시장의 종목을 보유 중인지. 세그먼트를 그릴지 말지가 여기서 갈린다.
 *
 * 합계 금액으로 판단하지 않는다 — 백엔드가 `totalMarketValueKrw` 를 항상 non-null 로
 * 내려주기 때문에(값이 없으면 0) 해외 전용 계좌도 국내를 가진 것처럼 보인다.
 * 목록에 실제로 그려질 것과 세그먼트가 어긋나지 않도록 양쪽 다 보유 종목에서 파생시킨다.
 */
export const hasDomesticHoldings = (portfolio: TossPortfolio): boolean =>
  portfolio.holdings.some((holding) => holding.marketCountry === 'KR');

export const hasOverseasHoldings = (portfolio: TossPortfolio): boolean =>
  portfolio.holdings.some((holding) => holding.marketCountry === 'US');
