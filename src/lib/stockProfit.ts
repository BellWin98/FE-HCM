import type { TradingProfitLoss } from '@/types';

/**
 * 매도 거래의 취득원가. 한국투자증권 응답에서 매도금액(amount)과 실현손익(profitLoss)의
 * 차이가 곧 매입금액이므로, 수익률을 다시 집계할 때는 이 값을 분모로 써야 한다.
 */
const costBasisOf = (trade: TradingProfitLoss): number => trade.amount - trade.profitLoss;

/**
 * 실현손익 합계와 취득원가 합계로 수익률(%)을 계산한다.
 * 개별 거래의 수익률을 단순 평균하거나 첫 거래의 수익률을 대표값으로 쓰면 안 된다.
 */
export const computeProfitRate = (totalProfit: number, totalCostBasis: number): number => {
  if (!totalCostBasis) return 0;
  return (totalProfit / totalCostBasis) * 100;
};

export interface DailyProfitGroup {
  date: string;
  trades: TradingProfitLoss[];
  profit: number;
  rate: number;
  fee: number;
  tax: number;
}

/** 매도 거래만 거래일별로 묶고, 각 날짜의 손익·수익률·수수료·세금 합계를 낸다. 최신 날짜순. */
export const groupSellTradesByDate = (trades: TradingProfitLoss[] = []): DailyProfitGroup[] => {
  const buckets = new Map<string, TradingProfitLoss[]>();

  for (const trade of trades) {
    if (trade.tradeType !== 'SELL') continue;
    const bucket = buckets.get(trade.tradeDate);
    if (bucket) {
      bucket.push(trade);
    } else {
      buckets.set(trade.tradeDate, [trade]);
    }
  }

  return Array.from(buckets.entries())
    .map(([date, dateTrades]) => {
      const profit = dateTrades.reduce((sum, t) => sum + t.profitLoss, 0);
      const costBasis = dateTrades.reduce((sum, t) => sum + costBasisOf(t), 0);
      return {
        date,
        trades: dateTrades,
        profit,
        rate: computeProfitRate(profit, costBasis),
        fee: dateTrades.reduce((sum, t) => sum + t.fee, 0),
        tax: dateTrades.reduce((sum, t) => sum + t.tax, 0),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
};

export interface StockProfitGroup {
  code: string;
  name: string;
  profit: number;
  rate: number;
  fee: number;
  tax: number;
  count: number;
}

/** 매도 거래만 종목별로 합산한다. 손익·수수료·세금 모두 누적하고 수익률은 취득원가 기준으로 재계산한다. */
export const groupSellTradesByStock = (trades: TradingProfitLoss[] = []): StockProfitGroup[] => {
  const buckets = new Map<string, StockProfitGroup & { costBasis: number }>();

  for (const trade of trades) {
    if (trade.tradeType !== 'SELL') continue;
    const existing = buckets.get(trade.stockCode);
    if (existing) {
      existing.profit += trade.profitLoss;
      existing.fee += trade.fee;
      existing.tax += trade.tax;
      existing.costBasis += costBasisOf(trade);
      existing.count += 1;
    } else {
      buckets.set(trade.stockCode, {
        code: trade.stockCode,
        name: trade.stockName,
        profit: trade.profitLoss,
        rate: 0,
        fee: trade.fee,
        tax: trade.tax,
        costBasis: costBasisOf(trade),
        count: 1,
      });
    }
  }

  return Array.from(buckets.values())
    .map(({ costBasis, ...group }) => ({
      ...group,
      rate: computeProfitRate(group.profit, costBasis),
    }))
    .sort((a, b) => b.profit - a.profit);
};
