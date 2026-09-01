/**
 * 토스증권 연동 전용 타입.
 *
 * 한국투자증권(`types/index.ts` 의 StockPortfolio 등)과 의도적으로 분리한다.
 * 두 증권사는 응답 구조가 달라 한 타입으로 합치면 어느 쪽에서도 옵셔널 투성이가 된다.
 *
 * 주의: 손익률은 백엔드에서 이미 퍼센트(15.16)로 변환해 내려온다.
 * 토스 원본은 소수비율(0.1516)이므로 원본 응답을 직접 다룰 때는 100을 곱해야 한다.
 */

export type TossMarketCountry = 'KR' | 'US';
export type TossCurrency = 'KRW' | 'USD';

/** 연동된 계좌 소유자. 상단 세그먼트를 채운다. */
export interface TossAccountOwner {
  owner: string;
  displayName: string;
}

export interface TossHolding {
  symbol: string;
  name: string;
  marketCountry: TossMarketCountry;
  currency: TossCurrency;
  /** 해외 소수점 매매가 있어 정수가 아닐 수 있다. */
  quantity: number;
  lastPrice: number;
  averagePurchasePrice: number;
  purchaseAmount: number;
  marketValue: number;
  marketValueAfterCost: number;
  profitLoss: number;
  profitLossAfterCost: number;
  profitLossRate: number;
  profitLossRateAfterCost: number;
  dailyProfitLoss: number;
  /** 일간 손익률(%). 한투와 달리 보유주식 응답에 이미 들어 있다. */
  dailyProfitLossRate: number;
  commission: number;
  tax: number;
}

export interface TossPortfolio {
  owner: string;
  ownerName: string;
  totalPurchaseAmountKrw: number;
  /** 해외 종목이 없으면 null. 0과 구분해야 한다. */
  totalPurchaseAmountUsd: number | null;
  totalMarketValueKrw: number;
  totalMarketValueUsd: number | null;
  totalProfitLossKrw: number;
  totalProfitLossUsd: number | null;
  totalProfitLossRate: number;
  dailyProfitLossKrw: number;
  dailyProfitLossUsd: number | null;
  dailyProfitLossRate: number;
  /** 현금 매수가능금액. 조회 실패 시 null(0으로 채우면 잔고 없음으로 오해한다). */
  cashBuyingPowerKrw: number | null;
  cashBuyingPowerUsd: number | null;
  holdings: TossHolding[];
  lastUpdated: string;
}

export interface TossTrade {
  symbol: string;
  name: string;
  tradeDate: string;
  tradeType: 'BUY' | 'SELL';
  currency: TossCurrency;
  quantity: number;
  price: number;
  amount: number;
  profitLoss: number;
  profitLossRate: number;
  fee: number;
  tax: number;
  /** 원가를 추정으로 메운 체결. 화면에 표시해야 한다. */
  estimated: boolean;
}

/** 통화별 합계. 원화와 달러를 한 숫자로 더하지 않기 위해 나눠서 내려온다. */
export interface TossCurrencyTotals {
  currency: TossCurrency;
  totalBuyAmount: number;
  totalSellAmount: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  totalFee: number;
  totalTax: number;
  tradeCount: number;
}

export interface TossRealizedProfit {
  owner: string;
  ownerName: string;
  period: string;
  totals: TossCurrencyTotals[];
  tradeCount: number;
  trades: TossTrade[];
  /** 하나라도 추정 원가가 섞였는지. */
  estimated: boolean;
}

export interface TossRealizedProfitPeriod {
  owner: string;
  startDate: string;
  endDate: string;
}
