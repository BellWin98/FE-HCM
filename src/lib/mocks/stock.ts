import { StockPortfolio, StockHolding } from '@/types';

const mockHoldings: StockHolding[] = [
  {
    stockCode: '005930',
    stockName: '삼성전자',
    quantity: 120,
    averagePrice: 67000,
    currentPrice: 72000,
    marketValue: 120 * 72000,
    profitLoss: (72000 - 67000) * 120,
    profitLossRate: ((72000 - 67000) / 67000) * 100,
    sector: '전자'
  },
  {
    stockCode: '000660',
    stockName: 'SK하이닉스',
    quantity: 30,
    averagePrice: 150000,
    currentPrice: 132000,
    marketValue: 30 * 132000,
    profitLoss: (132000 - 150000) * 30,
    profitLossRate: ((132000 - 150000) / 150000) * 100,
    sector: '반도체'
  },
  {
    stockCode: '035420',
    stockName: 'NAVER',
    quantity: 10,
    averagePrice: 210000,
    currentPrice: 225000,
    marketValue: 10 * 225000,
    profitLoss: (225000 - 210000) * 10,
    profitLossRate: ((225000 - 210000) / 210000) * 100,
    sector: '인터넷'
  },
  {
    stockCode: '051910',
    stockName: 'LG화학',
    quantity: 5,
    averagePrice: 480000,
    currentPrice: 455000,
    marketValue: 5 * 455000,
    profitLoss: (455000 - 480000) * 5,
    profitLossRate: ((455000 - 480000) / 480000) * 100,
    sector: '화학'
  },
  {
    stockCode: '035720',
    stockName: '카카오',
    quantity: 25,
    averagePrice: 58000,
    currentPrice: 61200,
    marketValue: 25 * 61200,
    profitLoss: (61200 - 58000) * 25,
    profitLossRate: ((61200 - 58000) / 58000) * 100,
    sector: '인터넷'
  }
];

const totals = mockHoldings.reduce(
  (acc, h) => {
    acc.totalMarketValue += h.marketValue;
    acc.totalProfitLoss += h.profitLoss;
    return acc;
  },
  { totalMarketValue: 0, totalProfitLoss: 0 }
);

const mockPortfolio: StockPortfolio = {
  totalMarketValue: totals.totalMarketValue,
  totalProfitLoss: totals.totalProfitLoss,
  totalProfitLossRate:
    totals.totalMarketValue === 0
      ? 0
      : (totals.totalProfitLoss / (totals.totalMarketValue - totals.totalProfitLoss)) * 100,
  holdings: mockHoldings,
  lastUpdated: new Date().toISOString(),
};

export const getMockStockPortfolio = async (): Promise<StockPortfolio> => {
  // simulate network latency
  await new Promise((res) => setTimeout(res, 300));
  return mockPortfolio;
};

export const getMockStockPrice = async (stockCode: string) => {
  await new Promise((res) => setTimeout(res, 150));
  const found = mockHoldings.find((h) => h.stockCode === stockCode);
  return found?.currentPrice ?? 0;
};
