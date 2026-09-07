/**
 * 토스증권 연동 전용 타입.
 *
 * 한국투자증권(`types/index.ts` 의 StockPortfolio 등)과 의도적으로 분리한다.
 * 두 증권사는 응답 구조가 달라 한 타입으로 합치면 어느 쪽에서도 옵셔널 투성이가 된다.
 *
 * 주의: 손익률은 백엔드에서 이미 퍼센트(15.16)로 변환해 내려온다.
 * 토스 원본은 소수비율(0.1516)이므로 원본 응답을 직접 다룰 때는 100을 곱해야 한다.
 *
 * 금액은 통화를 넘어 합산하지 않는다. 환율로 환산하면 매수/매도 시점 환율과 달라져
 * 실제로 치른 원화도 앞으로 손에 쥘 원화도 아닌 값이 되기 때문이다 — 화면은 통화 하나를
 * 골라 그 통화로만 보여준다.
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
  /**
   * 전체 손익률(%). 토스가 국내·해외를 원화 환산해 합친 기준으로 계산해 준 값이다.
   * 위 통화별 금액과 모집단이 다르므로 한쪽 통화만 보는 화면에 붙이면 안 된다 —
   * "-₩13,100 (+2.36%)" 처럼 금액과 비율이 어긋난 줄이 나온다.
   * 통화별 손익률은 `legProfitLossRate` 로 직접 계산한다.
   */
  totalProfitLossRate: number;
  dailyProfitLossKrw: number;
  dailyProfitLossUsd: number | null;
  /** 일간 손익률(%). {@link totalProfitLossRate} 와 같은 이유로 통화별 화면에는 쓸 수 없다. */
  dailyProfitLossRate: number;
  /** 세금·수수료 공제 후 평가금액·손익. 토스가 요약 레벨에도 내려주는 값이다. */
  totalMarketValueAfterCostKrw: number;
  totalMarketValueAfterCostUsd: number | null;
  totalProfitLossAfterCostKrw: number;
  totalProfitLossAfterCostUsd: number | null;
  /** 세후 전체 손익률(%). 위 손익률과 마찬가지로 원화 환산 합산 기준이라 통화별 화면에 쓸 수 없다. */
  totalProfitLossRateAfterCost: number;

  /**
   * 적용 환율(1 USD = ? KRW). 해외 종목이 없거나 환율 조회에 실패하면 null.
   *
   * 금액 환산에는 쓰지 않는다 — 평단·투자원금·손익은 매수/매도 시점 환율로 확정된 과거 금액이라
   * 오늘 환율을 곱하면 실제로 치른 원화도, 앞으로 손에 쥘 원화도 아닌 값이 된다.
   * 화면에는 참고 표기("$1 = ₩1,382.4")로만 쓴다.
   */
  usdKrwRate: number | null;
  usdKrwMidRate: number | null;
  usdKrwRateChangeType: 'UP' | 'EQUAL' | 'DOWN' | null;
  usdKrwRateAsOf: string | null;

  /** 현금 매수가능금액. 조회 실패 시 null(0으로 채우면 잔고 없음으로 오해한다). */
  cashBuyingPowerKrw: number | null;
  cashBuyingPowerUsd: number | null;
  holdings: TossHolding[];
  lastUpdated: string;
}

export interface TossTrade {
  symbol: string;
  name: string;
  /** yyyy-MM-dd. 일자별로 묶는 화면(보유 종목의 거래 내역)이 쓰는 키다. */
  tradeDate: string;
  /**
   * 체결 시각(`yyyy-MM-ddTHH:mm[:ss]`, KST 로컬 시각).
   * 같은 날 나눠 체결된 건을 구분하려면 날짜만으로는 부족해 시·분까지 받는다.
   */
  tradeDateTime: string;
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

/**
 * 본인의 토스 접근 권한 여부. 토스 접근은 role 이 아니라 서버의 `toss_access` 로 관리되고
 * (ADMIN 은 등록 없이도 항상 허용), AuthContext 의 member 는 localStorage 캐시라
 * 재로그인 전까지 갱신되지 않으므로 화면 진입 시 서버에 물어봐야 한다.
 */
export interface TossAccessStatus {
  hasAccess: boolean;
  /**
   * 주문 실행 권한. 조회(`hasAccess`)와 기준이 다르다 — 조회는 `toss_access` 를 받은 가족 전원,
   * 주문은 ADMIN 만이다. "가족 자산을 볼 수 있다"와 "남의 계좌로 주문을 낼 수 있다"는 다른 권한이다.
   *
   * 이 값은 **화면 표시 제어용**이다. 조작해도 주문 엔드포인트가 403 을 낸다.
   */
  canTrade: boolean;
}

/** 관리자 화면에서 보는 "토스 접근이 부여된 회원" 한 명. */
export interface TossAccessGrant {
  memberId: number;
  email: string;
  nickname: string;
  profileUrl: string | null;
  /** 부여한 관리자의 id. 마이그레이션으로 승계된 행은 null 이다. */
  grantedBy: number | null;
  grantedAt: string;
}

/* ────────────────────────── 주문 ────────────────────────── */

export type TossOrderSide = 'BUY' | 'SELL';
/** 토스에 보내는 호가 유형. LOC 은 별도 유형이 아니라 `LIMIT` + `timeInForce: 'CLS'` 다. */
export type TossOrderType = 'LIMIT' | 'MARKET';
export type TossTimeInForce = 'DAY' | 'CLS';

/**
 * 화면에서 고르는 주문 방식.
 *
 * 토스 API 의 (orderType, timeInForce) 두 값을 화면에서는 한 개의 선택지로 다룬다 —
 * 사용자는 "지정가/시장가/LOC" 중 하나를 고르는 것이지 두 축을 조합하지 않는다.
 * `LOC` 는 미국 종목에서만 고를 수 있다.
 */
export type TossOrderMode = 'LIMIT' | 'MARKET' | 'LOC';

export type TossSecurityType = 'STOCK' | 'ETF' | 'ETN' | 'REIT' | (string & {});

/** 검색 결과 한 건. 현재가는 담지 않는다 — 시세는 종목을 고른 뒤 한 번만 받는다. */
export interface TossStockSearchResult {
  symbol: string;
  name: string;
  market: string;
  marketCountry: TossMarketCountry;
  currency: TossCurrency;
  securityType: TossSecurityType;
  /** LOC 선택지를 그릴지. 토스는 종가 주문을 미국 지정가에만 허용한다. */
  locSupported: boolean;
}

/**
 * 주문 화면을 채우는 값 한 벌.
 *
 * 실패한 항목은 `null` 로 온다. 0 으로 바꿔 그리지 말 것 —
 * "0원"과 "알 수 없음"은 다른 사실이고, 잔고를 0으로 보여 주는 건 거짓말이다.
 */
export interface TossOrderable {
  symbol: string;
  name: string;
  marketCountry: TossMarketCountry;
  currency: TossCurrency;
  securityType: TossSecurityType;
  locSupported: boolean;
  lastPrice: number | null;
  /** 국내 종목만. 미국은 가격 제한이 없어 항상 null 이다. */
  upperLimitPrice: number | null;
  lowerLimitPrice: number | null;
  /** 매수 화면에서만 채워진다. */
  cashBuyingPower: number | null;
  /** 매도 화면에서만 채워진다. */
  sellableQuantity: number | null;
}

/** 주문 시트가 들고 있는 입력 상태. 이 값이 바뀌면 멱등키를 새로 발급해야 한다. */
export interface TossOrderDraft {
  symbol: string;
  name: string;
  marketCountry: TossMarketCountry;
  currency: TossCurrency;
  securityType: TossSecurityType;
  locSupported: boolean;
  side: TossOrderSide;
  mode: TossOrderMode;
  /** 문자열로 들고 있는다 — 입력 중인 "70000." 같은 상태를 숫자로 바꾸면 커서가 튄다. */
  quantity: string;
  price: string;
}

export interface TossPlaceOrderRequest {
  owner: string;
  symbol: string;
  side: TossOrderSide;
  orderType: TossOrderType;
  timeInForce?: TossTimeInForce;
  quantity: string;
  price?: string;
  /**
   * 멱등키. **프론트가 만든다** — 서버가 만들면 재시도마다 값이 달라져 멱등성이 사라진다.
   * 토스 기준 10분 유효. 같은 키로 내용만 다른 주문을 보내면 422 가 난다.
   */
  clientOrderId: string;
  /** 1억원 이상 주문에 필요한 사용자 확인. */
  confirmHighValueOrder?: boolean;
}

export interface TossOrderResult {
  orderId: string;
  clientOrderId: string;
}

export type TossOpenOrderStatus =
  | 'PENDING'
  | 'PARTIAL_FILLED'
  | 'PENDING_CANCEL'
  | 'PENDING_REPLACE'
  | (string & {});

/** 체결을 기다리는 주문 한 건. */
export interface TossOpenOrder {
  orderId: string;
  symbol: string;
  /** 주문 응답에 종목명이 없어 서버가 따로 채운다. 조회 실패 시 심볼이 들어온다. */
  name: string;
  side: TossOrderSide;
  orderType: TossOrderType;
  timeInForce: TossTimeInForce;
  /** `LIMIT` + `CLS` 조합. 서버가 미리 풀어 주므로 화면이 다시 판정하지 않는다. */
  loc: boolean;
  status: TossOpenOrderStatus;
  currency: TossCurrency;
  /** 시장가 주문은 null. 0 으로 그리면 "0원에 주문"으로 읽힌다. */
  price: number | null;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  orderedAt: string;
  /** 취소 버튼을 그릴지. 이미 취소 요청이 나간 주문에는 false 다. */
  cancelable: boolean;
}
