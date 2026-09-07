import type { TossMarketCountry, TossSecurityType } from '@/types/tossStock';

/**
 * 호가 단위(tick size).
 *
 * 백엔드는 이 표를 들지 않는다 — 우리가 복제한 표가 제도 개정으로 낡는 순간 **정상 주문을 우리 손으로
 * 막게** 되기 때문이다(토스는 항상 최신 표를 쓴다). 그래서 서버는 호가 단위를 검증하지 않고,
 * 어긋난 주문은 토스가 400 으로 알려 준다.
 *
 * 표를 화면에 두는 것은 비용이 아니다: 가격 스테퍼(+/− 버튼)는 증분값 없이 존재할 수 없어
 * 어차피 필요하고, 입력 단계에서 맞춰 두면 그 400 자체가 거의 나지 않는다.
 *
 * 기준: KRX 2023-01-25 개정 호가가격단위.
 */

/** [이 가격 미만, 호가 단위] — 위에서부터 처음 걸리는 구간을 쓴다. */
const KRX_TICKS: ReadonlyArray<readonly [number, number]> = [
  [2_000, 1],
  [5_000, 5],
  [20_000, 10],
  [50_000, 50],
  [200_000, 100],
  [500_000, 500],
];

const KRX_TICK_ABOVE_ALL = 1_000;

/** ETF·ETN 은 가격 구간과 무관하게 5원이다. */
const KRX_ETF_TICK = 5;
const KRX_FIVE_WON_TYPES: ReadonlySet<string> = new Set(['ETF', 'ETN']);

const US_TICK_ABOVE_ONE_DOLLAR = 0.01;
const US_TICK_BELOW_ONE_DOLLAR = 0.0001;

/** 미국 가격의 소수 자릿수. 부동소수 오차가 그대로 주문 가격이 되지 않도록 반올림에 쓴다. */
const US_DECIMALS_ABOVE_ONE_DOLLAR = 2;
const US_DECIMALS_BELOW_ONE_DOLLAR = 4;

const krxTickSize = (price: number, securityType: TossSecurityType): number => {
  if (KRX_FIVE_WON_TYPES.has(securityType)) return KRX_ETF_TICK;

  const bracket = KRX_TICKS.find(([ceiling]) => price < ceiling);
  return bracket ? bracket[1] : KRX_TICK_ABOVE_ALL;
};

const usTickSize = (price: number): number =>
  price >= 1 ? US_TICK_ABOVE_ONE_DOLLAR : US_TICK_BELOW_ONE_DOLLAR;

export const tickSizeFor = (
  price: number,
  marketCountry: TossMarketCountry,
  securityType: TossSecurityType
): number => (marketCountry === 'KR' ? krxTickSize(price, securityType) : usTickSize(price));

/** 소수 자릿수. 국내는 원 단위 정수, 미국은 $1 을 경계로 2자리/4자리다. */
const decimalsFor = (price: number, marketCountry: TossMarketCountry): number => {
  if (marketCountry === 'KR') return 0;
  return price >= 1 ? US_DECIMALS_ABOVE_ONE_DOLLAR : US_DECIMALS_BELOW_ONE_DOLLAR;
};

/**
 * 부동소수 오차를 잘라낸다. 0.01 을 더하다 보면 185.50000000000002 같은 값이 나오는데,
 * 그대로 주문에 실으면 토스가 자릿수 초과로 거부한다.
 */
const round = (value: number, decimals: number): number => Number(value.toFixed(decimals));

/**
 * 가격을 호가 단위에 맞춘다.
 *
 * 구간 경계를 넘는 경우는 넘어간 뒤의 단위를 다시 적용한다 —
 * 49,999원을 올리면 50,000원이 되고, 그 위부터는 100원 단위다.
 */
export const snapToTick = (
  price: number,
  marketCountry: TossMarketCountry,
  securityType: TossSecurityType,
  direction: 'up' | 'down' | 'nearest' = 'nearest'
): number => {
  if (!Number.isFinite(price) || price <= 0) return 0;

  const decimals = decimalsFor(price, marketCountry);
  const tick = tickSizeFor(price, marketCountry, securityType);

  // 소수 단위(0.0001)를 그대로 나누면 오차가 쌓이므로 정수 눈금 수로 바꿔 계산한다.
  const steps = price / tick;
  const rounded =
    direction === 'up'
      ? Math.ceil(round(steps, 9))
      : direction === 'down'
        ? Math.floor(round(steps, 9))
        : Math.round(round(steps, 9));

  return Math.max(0, round(rounded * tick, decimals));
};

/** 한 칸 올리거나 내린다. 스테퍼 버튼이 쓴다. */
export const stepPrice = (
  price: number,
  marketCountry: TossMarketCountry,
  securityType: TossSecurityType,
  direction: 'up' | 'down'
): number => {
  const snapped = snapToTick(price, marketCountry, securityType, direction);
  // 이미 호가에 맞아 스냅으로 값이 그대로면 한 칸을 실제로 움직여 준다.
  if (snapped !== price) return snapped;

  const tick = tickSizeFor(price, marketCountry, securityType);
  const decimals = decimalsFor(price, marketCountry);
  const moved = direction === 'up' ? price + tick : price - tick;
  if (moved <= 0) return 0;

  // 구간 경계를 넘었으면 넘어간 쪽 단위로 다시 맞춘다.
  return snapToTick(round(moved, decimals), marketCountry, securityType, direction);
};

export const isOrderPriceValid = (
  price: number,
  marketCountry: TossMarketCountry,
  securityType: TossSecurityType
): boolean => {
  if (!Number.isFinite(price) || price <= 0) return false;
  return snapToTick(price, marketCountry, securityType, 'down') === price;
};
