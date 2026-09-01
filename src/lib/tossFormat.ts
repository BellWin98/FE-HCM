import type { TossCurrency } from '@/types/tossStock';

/**
 * 통화를 구분해 금액을 포맷한다.
 *
 * 한투 화면의 `formatCurrency` 는 원화 전용이라, 토스처럼 국내·미국 종목이 섞이는 계좌에
 * 그대로 쓰면 달러 금액이 "₩150" 처럼 조용히 잘못 표시된다.
 */
export const formatMoney = (amount: number, currency: TossCurrency): string => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
};

/**
 * 값이 없을 수 있는 금액(해외 미보유, 조회 실패)을 표시한다.
 * 0으로 대체하지 않는다 — "0원"과 "알 수 없음"은 다른 의미다.
 */
export const formatOptionalMoney = (
  amount: number | null | undefined,
  currency: TossCurrency
): string => (amount == null ? '—' : formatMoney(amount, currency));

/** 보유 수량. 해외 소수점 매매를 고려해 소수점을 허용한다. */
export const formatQuantity = (quantity: number): string =>
  quantity.toLocaleString(undefined, { maximumFractionDigits: 6 });
