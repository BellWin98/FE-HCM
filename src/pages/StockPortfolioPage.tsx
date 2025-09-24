import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StockPortfolio, StockHolding } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import StockChart from '@/components/StockChart';
import TradingProfitLoss from '@/components/TradingProfitLoss';
import { useIsMobile } from '@/hooks/use-mobile';

const StockPortfolioPage = () => {
  const { member } = useAuth();
  const isMobile = useIsMobile();
  const [portfolio, setPortfolio] = useState<StockPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStockPortfolio() as StockPortfolio;
      setPortfolio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '주식 현황을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // FAMILY 또는 ADMIN 권한 체크
  if (member?.role !== 'FAMILY' && member?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">접근 권한 없음</CardTitle>
            <CardDescription className="text-center">
              주식 현황 조회 서비스는 FAMILY 또는 ADMIN 권한이 필요한 서비스입니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
    if (amount > 0) return 'text-red-600';
    if (amount < 0) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getProfitLossIcon = (amount: number) => {
    if (amount > 0) return <TrendingUp className="h-4 w-4" />;
    if (amount < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">주식 현황을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">오류 발생</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchPortfolio} className="w-full">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">데이터 없음</CardTitle>
            <CardDescription className="text-center">
              주식 현황 데이터가 없습니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* 헤더 */}
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">가족 주식 현황</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              마지막 업데이트: {new Date(portfolio.lastUpdated).toLocaleString('ko-KR')}
            </p>
          </div>
          <Button 
            onClick={fetchPortfolio} 
            disabled={loading} 
            className={`flex items-center space-x-2 ${isMobile ? 'w-full' : ''}`}
            size={isMobile ? 'sm' : 'default'}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </Button>
        </div>   

        {/* 포트폴리오 요약 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">금일 예수금</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolio.depositToday)}</div>
            </CardContent>
          </Card>       

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">D+2 예수금</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolio.depositD2)}</div>
            </CardContent>
          </Card>           

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 매입금액</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolio.totalBuyValue)}</div>
            </CardContent>
          </Card>   

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 손익</CardTitle>
              <div className="flex items-center space-x-1">
                {getProfitLossIcon(portfolio.totalProfitLoss)}
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getProfitLossColor(portfolio.totalProfitLoss)}`}>
                {formatCurrency(portfolio.totalProfitLoss)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">수익률</CardTitle>
              <div className="flex items-center space-x-1">
                {getProfitLossIcon(portfolio.totalProfitLossRate)}
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getProfitLossColor(portfolio.totalProfitLossRate)}`}>
                {formatPercentage(portfolio.totalProfitLossRate)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 평가금액</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolio.totalMarketValue)}</div>
            </CardContent>
          </Card>          
        </div>

        {/* 차트 및 분석 */}
        <StockChart holdings={portfolio.holdings} totalMarketValue={portfolio.totalMarketValue} />

        {/* 보유 종목 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>보유 종목 ({portfolio.holdings.length}개)</span>
            </CardTitle>
            <CardDescription>
              현재 보유 중인 주식 종목들의 상세 정보입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {portfolio.holdings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                보유 중인 주식이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {portfolio.holdings.map((holding, index) => (
                  <div key={holding.stockCode}>
                    {isMobile ? (
                      // 모바일 레이아웃
                      <div className="p-4 bg-white rounded-lg border space-y-4">
                        {/* 종목 정보 */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{holding.stockName}</h3>
                            <p className="text-sm text-gray-600">{holding.stockCode}</p>
                          </div>
                          <Badge variant="secondary">{holding.sector}</Badge>
                        </div>
                        
                        {/* 수량 및 가격 정보 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">현재가</p>
                            <p className="font-semibold text-sm">{formatCurrency(holding.currentPrice)}</p>
                          </div>  
                          <div>
                            <p className="text-sm text-gray-600">평균단가</p>
                            <p className="font-semibold text-sm">{formatCurrency(holding.averagePrice)}</p>
                          </div>                                                  
                          <div>
                            <p className="text-sm text-gray-600">매입금액</p>
                            <p className="font-semibold text-sm">{formatCurrency(holding.purchasePrice)}</p>
                          </div>                          
                          <div>
                            <p className="text-sm text-gray-600">평가금액</p>
                            <p className="font-semibold text-sm">{formatCurrency(holding.marketValue)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">보유수량</p>
                            <p className="font-semibold">{holding.quantity.toLocaleString()}주</p>
                          </div>                          
                        </div>
                        
                        {/* 손익 정보 */}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <div>
                            <p className="text-sm text-gray-600">손익</p>
                            <div className="flex items-center space-x-1">
                              {getProfitLossIcon(holding.profitLoss)}
                              <p className={`font-semibold ${getProfitLossColor(holding.profitLoss)}`}>
                                {formatCurrency(holding.profitLoss)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">수익률</p>
                            <div className="flex items-center space-x-1 justify-end">
                              {getProfitLossIcon(holding.profitLossRate)}
                              <p className={`font-semibold ${getProfitLossColor(holding.profitLossRate)}`}>
                                {formatPercentage(holding.profitLossRate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 데스크톱 레이아웃
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h3 className="font-semibold text-lg">{holding.stockName}</h3>
                              <p className="text-sm text-gray-600">{holding.stockCode}</p>
                            </div>
                            <Badge variant="secondary">{holding.sector}</Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">현재가</p>
                            <p className="font-semibold">{formatCurrency(holding.currentPrice)}</p>
                          </div>                          
                          <div className="text-right">
                            <p className="text-sm text-gray-600">평균단가</p>
                            <p className="font-semibold">{formatCurrency(holding.averagePrice)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">매입금액</p>
                            <p className="font-semibold">{formatCurrency(holding.purchasePrice)}</p>
                          </div>                          
                          <div className="text-right">
                            <p className="text-sm text-gray-600">평가금액</p>
                            <p className="font-semibold">{formatCurrency(holding.marketValue)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">보유수량</p>
                            <p className="font-semibold">{holding.quantity.toLocaleString()}주</p>
                          </div>                          
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-600">손익</p>
                            <div className="flex items-center space-x-1">
                              {getProfitLossIcon(holding.profitLoss)}
                              <p className={`font-semibold ${getProfitLossColor(holding.profitLoss)}`}>
                                {formatCurrency(holding.profitLoss)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-600">수익률</p>
                            <div className="flex items-center space-x-1">
                              {getProfitLossIcon(holding.profitLossRate)}
                              <p className={`font-semibold ${getProfitLossColor(holding.profitLossRate)}`}>
                                {formatPercentage(holding.profitLossRate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {index < portfolio.holdings.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>  

        {/* 매매손익 현황 */}
        <TradingProfitLoss />           
      </div>
    </div>
  );
};

export default StockPortfolioPage;
