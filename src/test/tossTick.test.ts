import { describe, expect, it } from 'vitest';
import { isOrderPriceValid, snapToTick, tickSizeFor } from '@/lib/tossTick';

/**
 * 호가 단위.
 *
 * 백엔드는 이 표를 들지 않는다 — 우리가 복제한 표가 제도 개정으로 낡는 순간 정상 주문을 우리 손으로
 * 막게 되기 때문이다(토스는 항상 최신 표를 쓴다). 대신 화면이 든다: 가격 스테퍼(+/− 버튼)는
 * 증분값 없이 존재할 수 없으므로 어차피 필요하고, 입력 단계에서 맞춰 두면 토스의 400 자체가 거의 안 난다.
 *
 * 기준은 KRX 2023-01-25 개정이다.
 */
describe('국내 호가 단위', () => {
  const kr = (price: number) => tickSizeFor(price, 'KR', 'STOCK');

  it('2,000원 미만은 1원 단위다', () => {
    expect(kr(1)).toBe(1);
    expect(kr(1999)).toBe(1);
  });

  it('2,000원 이상 5,000원 미만은 5원 단위다', () => {
    expect(kr(2000)).toBe(5);
    expect(kr(4999)).toBe(5);
  });

  it('5,000원 이상 20,000원 미만은 10원 단위다', () => {
    expect(kr(5000)).toBe(10);
    expect(kr(19999)).toBe(10);
  });

  it('20,000원 이상 50,000원 미만은 50원 단위다', () => {
    expect(kr(20000)).toBe(50);
    expect(kr(49999)).toBe(50);
  });

  it('50,000원 이상 200,000원 미만은 100원 단위다', () => {
    expect(kr(50000)).toBe(100);
    expect(kr(70000)).toBe(100);
    expect(kr(199999)).toBe(100);
  });

  it('200,000원 이상 500,000원 미만은 500원 단위다', () => {
    expect(kr(200000)).toBe(500);
    expect(kr(499999)).toBe(500);
  });

  it('500,000원 이상은 1,000원 단위다', () => {
    expect(kr(500000)).toBe(1000);
    expect(kr(1200000)).toBe(1000);
  });

  it('ETF·ETN 은 가격과 무관하게 5원 단위다', () => {
    // 일반 주식이면 100원 단위가 될 가격에서도 ETF 는 5원이다.
    expect(tickSizeFor(70000, 'KR', 'ETF')).toBe(5);
    expect(tickSizeFor(70000, 'KR', 'ETN')).toBe(5);
    expect(tickSizeFor(1200, 'KR', 'ETF')).toBe(5);
  });
});

describe('미국 호가 단위', () => {
  it('1달러 이상은 0.01달러 단위다', () => {
    expect(tickSizeFor(185.5, 'US', 'STOCK')).toBe(0.01);
    expect(tickSizeFor(1, 'US', 'STOCK')).toBe(0.01);
  });

  it('1달러 미만은 0.0001달러 단위다', () => {
    expect(tickSizeFor(0.5, 'US', 'STOCK')).toBe(0.0001);
  });
});

describe('호가 단위 스냅', () => {
  it('내림은 호가 단위 아래로 맞춘다', () => {
    expect(snapToTick(70050, 'KR', 'STOCK', 'down')).toBe(70000);
  });

  it('올림은 호가 단위 위로 맞춘다', () => {
    expect(snapToTick(70050, 'KR', 'STOCK', 'up')).toBe(70100);
  });

  it('가장 가까운 쪽으로 맞출 수 있다', () => {
    expect(snapToTick(70040, 'KR', 'STOCK', 'nearest')).toBe(70000);
    expect(snapToTick(70060, 'KR', 'STOCK', 'nearest')).toBe(70100);
  });

  it('이미 호가에 맞는 값은 그대로 둔다', () => {
    expect(snapToTick(70000, 'KR', 'STOCK', 'up')).toBe(70000);
    expect(snapToTick(70000, 'KR', 'STOCK', 'down')).toBe(70000);
  });

  it('구간 경계를 넘어갈 때는 넘어간 쪽 호가 단위를 쓴다', () => {
    // 49,950원(50원 단위)에서 한 칸 올리면 50,000원이고, 거기서부터는 100원 단위다.
    expect(snapToTick(49999, 'KR', 'STOCK', 'up')).toBe(50000);
  });

  it('0 이하로는 내려가지 않는다', () => {
    expect(snapToTick(0, 'KR', 'STOCK', 'down')).toBe(0);
    expect(snapToTick(-100, 'KR', 'STOCK', 'down')).toBe(0);
  });

  it('미국 종목은 소수점 자릿수를 유지한다', () => {
    // 부동소수 누적으로 185.50000000000002 같은 값이 나오면 토스가 400 을 낸다.
    expect(snapToTick(185.504, 'US', 'STOCK', 'down')).toBe(185.5);
    expect(snapToTick(185.501, 'US', 'STOCK', 'up')).toBe(185.51);
  });
});

describe('주문 가격 유효성', () => {
  it('호가 단위에 맞는 가격은 통과한다', () => {
    expect(isOrderPriceValid(70000, 'KR', 'STOCK')).toBe(true);
    expect(isOrderPriceValid(185.5, 'US', 'STOCK')).toBe(true);
  });

  it('호가 단위에 어긋난 가격은 걸러낸다', () => {
    expect(isOrderPriceValid(70050, 'KR', 'STOCK')).toBe(false);
    expect(isOrderPriceValid(185.505, 'US', 'STOCK')).toBe(false);
  });

  it('0 이하는 유효하지 않다', () => {
    expect(isOrderPriceValid(0, 'KR', 'STOCK')).toBe(false);
    expect(isOrderPriceValid(-1, 'KR', 'STOCK')).toBe(false);
  });
});
