import { describe, expect, it } from 'vitest';
import { estimateBuyAveragePrice, estimateSellProfit } from '@/lib/tossOrderEstimate';

/**
 * 주문 시트의 예상값.
 *
 * 매수 후 평균단가는 가중평균이고, 매도 예상 손익은 (주문가 − 평단) × 수량이다.
 * 수수료·세금은 넣지 않는다 — 화면이 "제외"라고 적는다.
 */
describe('매수 후 예상 평균단가', () => {
  it('보유분과 주문분의 가중평균이다', () => {
    // (65,000 × 100 + 71,000 × 50) / 150 = 67,000
    expect(estimateBuyAveragePrice({ quantity: 100, averagePrice: 65000 }, 71000, 50)).toBe(67000);
  });

  it('소수점 수량(미국 종목)도 계산한다', () => {
    // (150 × 1.5 + 200 × 0.5) / 2 = 162.5
    expect(estimateBuyAveragePrice({ quantity: 1.5, averagePrice: 150 }, 200, 0.5)).toBe(162.5);
  });

  it('주문 수량이나 가격이 없으면 null 이다', () => {
    expect(estimateBuyAveragePrice({ quantity: 100, averagePrice: 65000 }, 0, 10)).toBeNull();
    expect(estimateBuyAveragePrice({ quantity: 100, averagePrice: 65000 }, 71000, 0)).toBeNull();
  });
});

describe('매도 예상 손익', () => {
  it('(주문가 − 평단) × 수량과 평단 대비 수익률을 준다', () => {
    const result = estimateSellProfit({ quantity: 100, averagePrice: 65000 }, 72000, 10);
    expect(result).toEqual({
      profitLoss: 70000,
      profitLossRate: expect.closeTo(10.77, 2),
      cost: null,
      profitLossAfterCost: null,
      profitLossRateAfterCost: null,
    });
  });

  it('비용률이 있으면 매도금액에 곱한 비용을 뺀 세후 손익·수익률도 준다', () => {
    // 매도금액 720,000 × 0.00165 = 1,188 → 세후 손익 68,812, 매입금액 650,000 대비 10.59%
    const result = estimateSellProfit({ quantity: 100, averagePrice: 65000 }, 72000, 10, 0.00165);
    expect(result?.cost).toBeCloseTo(1188, 6);
    expect(result?.profitLossAfterCost).toBeCloseTo(68812, 6);
    expect(result?.profitLossRateAfterCost).toBeCloseTo(10.59, 2);
  });

  it('비용률이 있어도 평단이 0 이면 세후 수익률은 null 이다', () => {
    const result = estimateSellProfit({ quantity: 100, averagePrice: 0 }, 72000, 10, 0.00165);
    expect(result?.profitLossAfterCost).toBeCloseTo(718812, 6);
    expect(result?.profitLossRateAfterCost).toBeNull();
  });

  it('손실이면 음수다', () => {
    const result = estimateSellProfit({ quantity: 100, averagePrice: 65000 }, 60000, 10);
    expect(result?.profitLoss).toBe(-50000);
    expect(result?.profitLossRate).toBeCloseTo(-7.69, 2);
  });

  it('평단이 0 이면 수익률은 null 이다 — 0 으로 나눌 수 없다', () => {
    const result = estimateSellProfit({ quantity: 100, averagePrice: 0 }, 72000, 10);
    expect(result).toMatchObject({ profitLoss: 720000, profitLossRate: null });
  });

  it('주문 수량이나 가격이 없으면 null 이다', () => {
    expect(estimateSellProfit({ quantity: 100, averagePrice: 65000 }, 0, 10)).toBeNull();
    expect(estimateSellProfit({ quantity: 100, averagePrice: 65000 }, 72000, 0)).toBeNull();
  });
});
