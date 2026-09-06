import { describe, expect, it } from 'vitest';
import type { TossHolding, TossPortfolio } from '@/types/tossStock';
import {
  hasDomesticHoldings,
  hasOverseasHoldings,
  legDailyChangeRate,
  legProfitLossRate,
  sortHoldings,
} from '@/lib/tossPortfolio';

/**
 * 자산 화면이 응답에서 파생시키는 순수 계산들.
 *
 * `tsconfig` 가 `strict: false` 라 타입 시스템이 null 누락을 잡아 주지 않으므로,
 * "값이 없을 때 0으로 대체하지 않는다"는 규칙은 여기서 지킨다.
 */

const holding = (overrides: Partial<TossHolding> = {}): TossHolding => ({
  symbol: '005930',
  name: '삼성전자',
  marketCountry: 'KR',
  currency: 'KRW',
  quantity: 12,
  lastPrice: 73400,
  averagePurchasePrice: 68200,
  purchaseAmount: 818400,
  marketValue: 880800,
  marketValueAfterCost: 878200,
  profitLoss: 62400,
  profitLossAfterCost: 60290,
  profitLossRate: 7.63,
  profitLossRateAfterCost: 7.37,
  dailyProfitLoss: -3500,
  dailyProfitLossRate: -0.4,
  commission: 2110,
  tax: 0,
  ...overrides,
});

const nvidia = (overrides: Partial<TossHolding> = {}): TossHolding =>
  holding({
    symbol: 'NVDA',
    name: '엔비디아',
    marketCountry: 'US',
    currency: 'USD',
    marketValue: 1132.8,
    profitLossRate: 19.8,
    ...overrides,
  });

const portfolio = (holdings: TossHolding[]): TossPortfolio =>
  ({ holdings }) as TossPortfolio;

describe('legProfitLossRate', () => {
  it('같은 통화 안에서 손익을 원금으로 나눈다', () => {
    expect(legProfitLossRate(-13100, 2754400)).toBeCloseTo(-0.4756, 4);
  });

  it('원금이 0이거나 값이 없으면 0%가 아니라 null 이다', () => {
    // 0% 로 대체하면 "본전"이라는 거짓말이 된다.
    expect(legProfitLossRate(100, 0)).toBeNull();
    expect(legProfitLossRate(null, 2754400)).toBeNull();
    expect(legProfitLossRate(100, null)).toBeNull();
  });
});

describe('legDailyChangeRate', () => {
  it('전일 평가금을 평가금에서 오늘 손익을 뺀 값으로 두고 계산한다', () => {
    // 18,700 / (2,741,300 - 18,700)
    expect(legDailyChangeRate(18700, 2741300)).toBeCloseTo(0.6868, 4);
    expect(legDailyChangeRate(21.3, 2400.6)).toBeCloseTo(0.8952, 4);
  });

  it('전일 평가금이 0이거나 값이 없으면 null 이다', () => {
    expect(legDailyChangeRate(100, 100)).toBeNull();
    expect(legDailyChangeRate(null, 2400.6)).toBeNull();
    expect(legDailyChangeRate(21.3, null)).toBeNull();
  });
});

describe('sortHoldings', () => {
  const ids = (holdings: TossHolding[]): string[] => holdings.map((h) => h.symbol);

  it('한 통화 안에서는 평가금을 그대로 비교한다', () => {
    const list = [holding({ marketValue: 880800 }), holding({ symbol: '000660', marketValue: 1500000 })];

    expect(ids(sortHoldings(list, 'marketValueDesc'))).toEqual(['000660', '005930']);
    expect(ids(sortHoldings(list, 'marketValueAsc'))).toEqual(['005930', '000660']);
  });

  it('통화가 섞여 들어오면 경계를 넘어 크기를 견주지 않는다', () => {
    // ₩880,800 과 $1,132.80 을 숫자 그대로 비교하면 "평가금 높은 순"이 "국내 먼저"가 된다.
    const list = [nvidia(), holding()];

    expect(ids(sortHoldings(list, 'marketValueDesc'))).toEqual(['005930', 'NVDA']);
    expect(ids(sortHoldings(list, 'marketValueAsc'))).toEqual(['005930', 'NVDA']);
  });

  it('손익률은 통화와 무관한 비율이라 전체를 함께 정렬한다', () => {
    const list = [holding(), nvidia()];

    expect(ids(sortHoldings(list, 'profitRateDesc'))).toEqual(['NVDA', '005930']);
    expect(ids(sortHoldings(list, 'profitRateAsc'))).toEqual(['005930', 'NVDA']);
  });

  it('원본 배열을 건드리지 않는다', () => {
    const list = [nvidia(), holding()];
    sortHoldings(list, 'marketValueDesc');

    expect(ids(list)).toEqual(['NVDA', '005930']);
  });
});

describe('보유 시장 판정', () => {
  it('보유 종목에서 파생시킨다 — 합계 금액으로 판단하지 않는다', () => {
    // 백엔드는 totalMarketValueKrw 를 항상 non-null(값이 없으면 0)로 내려주므로
    // 합계만 보면 해외 전용 계좌도 국내를 가진 것처럼 보인다.
    expect(hasDomesticHoldings(portfolio([nvidia()]))).toBe(false);
    expect(hasOverseasHoldings(portfolio([nvidia()]))).toBe(true);

    expect(hasDomesticHoldings(portfolio([holding()]))).toBe(true);
    expect(hasOverseasHoldings(portfolio([holding()]))).toBe(false);
  });

  it('빈 계좌는 양쪽 다 false 다', () => {
    expect(hasDomesticHoldings(portfolio([]))).toBe(false);
    expect(hasOverseasHoldings(portfolio([]))).toBe(false);
  });
});
