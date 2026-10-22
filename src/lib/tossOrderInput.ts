/**
 * 주문·정정 시트가 함께 쓰는 입력 규칙.
 *
 * 두 시트가 같은 돈을 다루므로 숫자 입력·고액 확인·제출 잠금 규칙이 한쪽만 바뀌면 안 된다.
 */

/** 1억원 이상 주문은 토스가 별도 확인 플래그를 요구한다. */
export const HIGH_VALUE_THRESHOLD_KRW = 100_000_000;

/**
 * 확인 화면에 들어온 직후 제출 버튼을 잠가 두는 시간.
 * 모바일에서 "확인"을 누른 손가락이 그대로 같은 자리의 "주문하기"·"정정하기"에 떨어지는 사고를 막는다.
 */
export const SUBMIT_ARM_DELAY_MS = 800;

/**
 * 미국 종목 가격의 소수 자릿수. 1달러 미만 호가 단위가 0.0001 이라 넷째 자리까지 의미가 있다
 * (`tossTick` 의 US_DECIMALS_BELOW_ONE_DOLLAR 와 같은 값). 국내 종목은 원 단위 정수다.
 */
export const US_PRICE_SCALE = 4;

/**
 * 가격·수량 입력의 최대 글자 수(소수점 포함).
 * 실제 주문이 닿을 수 없는 자릿수인데 `inputMode` 만으로는 길이를 막지 못한다 —
 * 붙여넣기나 키를 누르고 있으면 끝없이 들어가고, 그 값으로 예상 금액을 곱하면 화면에 쓰레기 숫자가 뜬다.
 */
export const NUMBER_INPUT_MAX_LENGTH = 12;

/**
 * 숫자 입력에서 허용되지 않는 문자를 걷어낸다.
 * `inputMode="decimal"` 은 모바일 키보드 모양만 바꿀 뿐 입력을 막지 않는다(데스크톱·붙여넣기는 무엇이든 들어온다).
 * 소수점을 허용할 때도 소수점은 하나만, 소수 자릿수는 `scale` 까지만 남기고, 전체 길이는 상한에서 자른다.
 */
export const sanitizeNumberInput = (raw: string, scale: number): string => {
  const digitsOnly = raw.replace(scale > 0 ? /[^0-9.]/g : /[^0-9]/g, '');
  const [whole = '', ...decimals] = digitsOnly.split('.');
  const joined = decimals.length === 0 ? whole : `${whole}.${decimals.join('').slice(0, scale)}`;
  return joined.slice(0, NUMBER_INPUT_MAX_LENGTH);
};
