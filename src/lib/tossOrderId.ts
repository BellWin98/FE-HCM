/**
 * 주문 멱등키(`clientOrderId`) 생성.
 *
 * **프론트에서 만든다.** 서버가 만들면 재시도할 때마다 값이 달라져 멱등성이 통째로 사라진다 —
 * 멱등키의 존재 이유가 "같은 주문을 다시 보내도 한 건"인데, 재시도마다 새 키면 그냥 새 주문이다.
 *
 * 특히 소켓 타임아웃(5초)으로 접수 여부를 알 수 없게 됐을 때, 같은 키로 다시 보내면 토스가
 * 이전 결과를 그대로 돌려준다. 이게 이 함수가 존재하는 가장 큰 이유다.
 *
 * 형식은 토스 제약을 따른다: `^[a-zA-Z0-9\-_]+$`, 최대 36자.
 */

const HEX = '0123456789abcdef';

/**
 * `crypto.randomUUID` 는 보안 컨텍스트(HTTPS·localhost)에서만 존재한다.
 * 운영은 PWA 라 HTTPS 이고 개발은 localhost 라 둘 다 안전하지만,
 * 사설 IP 로 띄운 개발 서버에서는 없을 수 있어 폴백을 둔다.
 */
const randomHex = (length: number): string => {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (byte) => HEX[byte & 0x0f]).join('');
};

/** 32자 hex. 토스의 36자 제한과 문자 집합을 모두 만족한다. */
export const createClientOrderId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return randomHex(32);
};
