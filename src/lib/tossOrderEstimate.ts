/**
 * 주문 시트의 예상값 계산.
 *
 * 보유 중인 종목을 사고팔 때 "이 주문이 내 포지션을 어떻게 바꾸는가"를 미리 보여주기 위한 순수 함수다.
 *
 * 수수료·세금은 세율표를 들고 계산하지 않는다 — 표를 복제하면 제도 개정에 낡는다. 대신 서버가 토스의
 * 보유 종목 비용 추정치에서 만든 <b>비용률</b>(매도금액 대비)을 받아 이 주문 금액에 비례시킨다.
 * 비용률이 없으면 세후 값은 null 로 두고 세전 값만 보여준다.
 *
 * 입력이 아직 없을 때(수량·가격이 0)는 null 을 준다. 0 을 돌려주면 "예상 손익 ₩0"으로 그려져
 * 마치 본전 매도처럼 읽힌다.
 */

/** 현재 보유분. 서버가 보유 종목에만 채워 주는 값이다. */
export interface TossHeldPosition {
  quantity: number;
  averagePrice: number;
}

/** 매수 후 평균단가 = 가중평균. 주문 수량·가격이 없으면 null. */
export const estimateBuyAveragePrice = (
  held: TossHeldPosition,
  orderPrice: number,
  orderQuantity: number
): number | null => {
  if (orderPrice <= 0 || orderQuantity <= 0) return null;
  const totalQuantity = held.quantity + orderQuantity;
  if (totalQuantity <= 0) return null;
  return (held.averagePrice * held.quantity + orderPrice * orderQuantity) / totalQuantity;
};

export interface TossSellEstimate {
  /** (주문가 − 평단) × 수량. */
  profitLoss: number;
  /** 평단 대비 %. 평단이 0 이면 나눌 수 없어 null. */
  profitLossRate: number | null;
  /** 예상 수수료+세금 = 매도금액 × 비용률. 비용률이 없으면 null. */
  cost: number | null;
  /** 세후 손익 = 세전 손익 − 비용. 비용률이 없으면 null. */
  profitLossAfterCost: number | null;
  /** 세후 수익률(%) = 세후 손익 / 매입금액. 비용률이 없거나 평단이 0 이면 null. */
  profitLossRateAfterCost: number | null;
}

/**
 * 매도 예상 손익. 주문 수량·가격이 없으면 null.
 * @param sellCostRate 매도금액 대비 수수료+세금 비율(소수비율). 서버가 토스 추정치로 만든 값이다.
 */
export const estimateSellProfit = (
  held: TossHeldPosition,
  orderPrice: number,
  orderQuantity: number,
  sellCostRate: number | null = null
): TossSellEstimate | null => {
  if (orderPrice <= 0 || orderQuantity <= 0) return null;
  const perShare = orderPrice - held.averagePrice;
  const profitLoss = perShare * orderQuantity;
  const purchaseAmount = held.averagePrice * orderQuantity;
  const cost = sellCostRate != null ? orderPrice * orderQuantity * sellCostRate : null;
  const profitLossAfterCost = cost != null ? profitLoss - cost : null;
  return {
    profitLoss,
    profitLossRate: purchaseAmount > 0 ? (profitLoss / purchaseAmount) * 100 : null,
    cost,
    profitLossAfterCost,
    profitLossRateAfterCost:
      profitLossAfterCost != null && purchaseAmount > 0 ? (profitLossAfterCost / purchaseAmount) * 100 : null,
  };
};
