import { format, isValid, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
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

/**
 * 손익 금액. 양수에만 `+` 를 붙인다 — 음수는 Intl 포맷이 이미 `-` 를 넣고,
 * 0 은 부호 없이 그대로 두는 편이 읽기 쉽다.
 */
export const formatSignedMoney = (amount: number, currency: TossCurrency): string =>
  `${amount > 0 ? '+' : ''}${formatMoney(amount, currency)}`;

/** 값이 없을 수 있는 손익 금액(해외 미보유 등). {@link formatOptionalMoney} 와 같은 이유로 0 으로 대체하지 않는다. */
export const formatOptionalSignedMoney = (
  amount: number | null | undefined,
  currency: TossCurrency
): string => (amount == null ? '—' : formatSignedMoney(amount, currency));

/**
 * 적용 환율 표기.
 * 원화지만 소수점이 의미 있으므로 통화 포맷({@link formatMoney})을 쓸 수 없다 — KRW 는 소수점을 버린다.
 */
export const formatExchangeRate = (rate: number): string =>
  `$1 = ₩${rate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}`;

/** 보유 수량. 해외 소수점 매매를 고려해 소수점을 허용한다. */
export const formatQuantity = (quantity: number): string =>
  quantity.toLocaleString(undefined, { maximumFractionDigits: 6 });

/**
 * 체결 일시. "2026-09-01T14:32:11" → "9월 1일 14:32".
 *
 * 올해 거래는 연도를 접는다 — 모바일 한 줄에 시각까지 넣으려면 자리가 모자라고, 기간 헤더에
 * 이미 연도가 적혀 있다. 지난해 거래(전체 기간 조회)만 연도를 붙인다.
 *
 * 시각이 없는 값(날짜만 내려온 경우)은 날짜까지만 보여준다 — 장이 열리지 않은 "00:00"을
 * 체결 시각처럼 적어 두는 셈이 되기 때문이다.
 */
export const formatTradeDateTime = (value: string, now: Date = new Date()): string => {
  // parseISO 는 오프셋 없는 값을 로컬 시각으로 읽는다. `new Date()` 는 날짜만 있는 값을 UTC 로 읽어
  // 시간대에 따라 하루가 밀린다.
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;

  const datePattern =
    parsed.getFullYear() === now.getFullYear() ? 'M월 d일' : 'yyyy년 M월 d일';
  return format(parsed, value.includes('T') ? `${datePattern} HH:mm` : datePattern, { locale: ko });
};
