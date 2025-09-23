import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { StockHolding } from '@/types';

interface StockChartProps {
  holdings: StockHolding[];
  totalMarketValue: number;
}

const StockChart: React.FC<StockChartProps> = ({ holdings, totalMarketValue }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`;
  };

  const getProfitLossColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProfitLossIcon = (amount: number) => {
    if (amount > 0) return <TrendingUp className="h-4 w-4" />;
    if (amount < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  // 섹터별 집계
  const sectorData = holdings.reduce((acc, holding) => {
    if (!acc[holding.sector]) {
      acc[holding.sector] = {
        totalValue: 0,
        totalProfitLoss: 0,
        count: 0,
        holdings: []
      };
    }
    acc[holding.sector].totalValue += holding.marketValue;
    acc[holding.sector].totalProfitLoss += holding.profitLoss;
    acc[holding.sector].count += 1;
    acc[holding.sector].holdings.push(holding);
    return acc;
  }, {} as Record<string, { totalValue: number; totalProfitLoss: number; count: number; holdings: StockHolding[] }>);

  const sectorArray = Object.entries(sectorData).map(([sector, data]) => ({
    sector,
    ...data,
    percentage: (data.totalValue / totalMarketValue) * 100
  })).sort((a, b) => b.totalValue - a.totalValue);

  return (
    <div className="space-y-6">
      {/* 섹터별 분포 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>섹터별 분포</span>
          </CardTitle>
          <CardDescription>
            보유 종목의 섹터별 평가금액 분포입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sectorArray.map((sector) => (
              <div key={sector.sector} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{sector.sector}</Badge>
                    <span className="text-sm text-gray-600">
                      {sector.count}개 종목
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(sector.totalValue)}</div>
                    <div className={`text-sm ${getProfitLossColor(sector.totalProfitLoss)}`}>
                      {formatCurrency(sector.totalProfitLoss)}
                    </div>
                  </div>
                </div>
                <Progress value={sector.percentage} className="h-2" />
                <div className="text-xs text-gray-500">
                  {sector.percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 상위 보유 종목 */}
      <Card>
        <CardHeader>
          <CardTitle>상위 보유 종목</CardTitle>
          <CardDescription>
            평가금액 기준 상위 5개 종목입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {holdings
              .sort((a, b) => b.marketValue - a.marketValue)
              .slice(0, 5)
              .map((holding, index) => (
                <div key={holding.stockCode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{holding.stockName}</div>
                      <div className="text-sm text-gray-600">{holding.stockCode}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(holding.marketValue)}</div>
                    <div className={`text-sm flex items-center space-x-1 ${getProfitLossColor(holding.profitLoss)}`}>
                      {getProfitLossIcon(holding.profitLoss)}
                      <span>{formatCurrency(holding.profitLoss)}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* 수익률 분포 */}
      <Card>
        <CardHeader>
          <CardTitle>수익률 분포</CardTitle>
          <CardDescription>
            보유 종목들의 수익률 현황입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {holdings.filter(h => h.profitLossRate > 0).length}
              </div>
              <div className="text-sm text-green-600">수익 종목</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {holdings.filter(h => h.profitLossRate < 0).length}
              </div>
              <div className="text-sm text-red-600">손실 종목</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {holdings.filter(h => h.profitLossRate === 0).length}
              </div>
              <div className="text-sm text-gray-600">보합 종목</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockChart;
