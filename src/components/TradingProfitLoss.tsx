import React, { useState, useEffect } from 'react';
import { TradingProfitLossSummary, TradingProfitLossPeriod } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TradingProfitLossProps {
  className?: string;
}

const TradingProfitLoss: React.FC<TradingProfitLossProps> = ({ className }) => {
  const isMobile = useIsMobile();
  const [summary, setSummary] = useState<TradingProfitLossSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  // Local date helpers to avoid timezone shifting
  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const parseLocalDate = (value: string) => {
    const [y, m, d] = value.split('-').map((v) => parseInt(v, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const [period, setPeriod] = useState<TradingProfitLossPeriod>({
    // startDate: formatDateLocal(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // 30일 전
    // endDate: formatDateLocal(new Date()), // 오늘
    // periodType: 'CUSTOM'
    startDate: formatDateLocal(new Date()), 
    endDate: formatDateLocal(new Date()),
    periodType: 'DAILY'     
  });
  const [appliedPeriod, setAppliedPeriod] = useState<TradingProfitLossPeriod>({
    startDate: period.startDate,
    endDate: period.endDate,
    periodType: period.periodType
  });
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  const fetchTradingProfitLoss = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTradingProfitLoss(appliedPeriod) as TradingProfitLossSummary;
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '매매손익 현황을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradingProfitLoss();
  }, [appliedPeriod]);

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

  const getTradeTypeColor = (type: 'BUY' | 'SELL') => {
    return type === 'BUY' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
  };

  const getTradeTypeText = (type: 'BUY' | 'SELL') => {
    return type === 'BUY' ? '매수' : '매도';
  };

  const handlePeriodTypeChange = (value: string) => {
    const today = new Date();
    let startDate: Date;
    
    switch (value) {
      case 'DAILY':
        startDate = new Date(today);
        setPeriod({
          startDate: formatDateLocal(startDate),
          endDate: formatDateLocal(today),
          periodType: 'DAILY'
        });
        setAppliedPeriod({
          startDate: formatDateLocal(startDate),
          endDate: formatDateLocal(today),
          periodType: 'DAILY'
        });
        setValidationError(null);
        return;
      case 'WEEKLY':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        setPeriod({
          startDate: formatDateLocal(startDate),
          endDate: formatDateLocal(today),
          periodType: 'WEEKLY'
        });
        setAppliedPeriod({
          startDate: formatDateLocal(startDate),
          endDate: formatDateLocal(today),
          periodType: 'WEEKLY'
        });
        setValidationError(null);
        return;
      case 'MONTHLY':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        setPeriod({
          startDate: formatDateLocal(startDate),
          endDate: formatDateLocal(today),
          periodType: 'MONTHLY'
        });
        setAppliedPeriod({
          startDate: formatDateLocal(startDate),
          endDate: formatDateLocal(today),
          periodType: 'MONTHLY'
        });
        setValidationError(null);
        return;
      case 'YEARLY':
        startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        setPeriod({
          startDate: formatDateLocal(startDate),
          endDate: formatDateLocal(today),
          periodType: 'YEARLY'
        });
        setAppliedPeriod({
          startDate: formatDateLocal(startDate),
          endDate: formatDateLocal(today),
          periodType: 'YEARLY'
        });
        setValidationError(null);
        return;
      case 'CUSTOM':
        // 날짜는 유지하고 타입만 CUSTOM으로 변경하여 달력 노출
        setPeriod(prev => ({ ...prev, periodType: 'CUSTOM' }));
        setValidationError(null);
        return;
      default:
        return;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>매매손익 현황</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600 mt-2">매매손익 현황을 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>매매손익 현황</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTradingProfitLoss} variant="outline">
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>매매손익 현황</span>
            </CardTitle>
            <CardDescription>
              {summary?.period || `${period.startDate} ~ ${period.endDate}`} 기간의 매매손익 현황입니다.
            </CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Select value={period.periodType} onValueChange={handlePeriodTypeChange}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">일간</SelectItem>
                <SelectItem value="WEEKLY">주간</SelectItem>
                <SelectItem value="MONTHLY">월간</SelectItem>
                <SelectItem value="YEARLY">연간</SelectItem>
                <SelectItem value="CUSTOM">직접선택</SelectItem>
              </SelectContent>
            </Select>
            
            {period.periodType === 'CUSTOM' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Popover open={showDatePicker === 'start'} onOpenChange={(open) => setShowDatePicker(open ? 'start' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(parseLocalDate(period.startDate), 'yyyy-MM-dd', { locale: ko })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={parseLocalDate(period.startDate)}
                      onSelect={(date) => {
                        if (date) {
                          setPeriod(prev => ({ ...prev, startDate: formatDateLocal(date) }));
                          setShowDatePicker(null);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover open={showDatePicker === 'end'} onOpenChange={(open) => setShowDatePicker(open ? 'end' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(parseLocalDate(period.endDate), 'yyyy-MM-dd', { locale: ko })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={parseLocalDate(period.endDate)}
                      onSelect={(date) => {
                        if (date) {
                          setPeriod(prev => ({ ...prev, endDate: formatDateLocal(date) }));
                          setShowDatePicker(null);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* 검증 메시지 */}
                {validationError && (
                  <div className="text-sm text-red-600">{validationError}</div>
                )}

                {/* CUSTOM 조회 버튼 */}
                <Button
                  variant="default"
                  onClick={() => {
                    const start = parseLocalDate(period.startDate);
                    const end = parseLocalDate(period.endDate);
                    if (start > end) {
                      setValidationError('조회 시작일자는 조회 종료일자보다 이후일 수 없습니다.');
                      return;
                    }
                    setValidationError(null);
                    setAppliedPeriod({ ...period });
                  }}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  조회
                </Button>
              </div>
            )}
            
            <Button onClick={fetchTradingProfitLoss} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!summary ? (
          <div className="text-center py-8 text-gray-500">
            매매손익 데이터가 없습니다.
          </div>
        ) : (
          <div className="space-y-6">
            {/* 요약 정보 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 매수금액</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(summary.totalBuyAmount)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 매도금액</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.totalSellAmount)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">실현손익</CardTitle>
                  <div className="flex items-center space-x-1">
                    {getProfitLossIcon(summary.totalProfitLoss)}
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getProfitLossColor(summary.totalProfitLoss)}`}>
                    {formatCurrency(summary.totalProfitLoss)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">수익률</CardTitle>
                  <div className="flex items-center space-x-1">
                    {getProfitLossIcon(summary.totalProfitLossRate)}
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getProfitLossColor(summary.totalProfitLossRate)}`}>
                    {formatPercentage(summary.totalProfitLossRate)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 수수료 및 세금 정보 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">총 수수료</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{formatCurrency(summary.totalFee)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">총 세금</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{formatCurrency(summary.totalTax)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">총 거래건수</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{summary.tradeCount}건</div>
                </CardContent>
              </Card>
            </div>

            {/* 거래 내역 */}
            {summary.trades.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">거래 내역 ({summary.trades.length}건)</h3>
                <div className="space-y-2">
                  {summary.trades.map((trade, index) => (
                    <div key={index}>
                      {isMobile ? (
                        // 모바일 레이아웃
                        <div className="p-4 bg-white rounded-lg border space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base">{trade.stockName}</h4>
                              <p className="text-sm text-gray-600">{trade.stockCode}</p>
                            </div>
                            <Badge className={getTradeTypeColor(trade.tradeType)}>
                              {getTradeTypeText(trade.tradeType)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm text-gray-600">매매일</p>
                              <p className="font-medium text-sm">{trade.tradeDate}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">수량</p>
                              <p className="font-medium text-sm">{trade.quantity.toLocaleString()}주</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">단가</p>
                              <p className="font-medium text-sm">{formatCurrency(trade.price)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">거래금액</p>
                              <p className="font-medium text-sm">{formatCurrency(trade.amount)}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2 border-t">
                            <div>
                              <p className="text-sm text-gray-600">손익</p>
                              <div className="flex items-center space-x-1">
                                {getProfitLossIcon(trade.profitLoss)}
                                <p className={`font-semibold ${getProfitLossColor(trade.profitLoss)}`}>
                                  {formatCurrency(trade.profitLoss)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">수익률</p>
                              <div className="flex items-center space-x-1 justify-end">
                                {getProfitLossIcon(trade.profitLossRate)}
                                <p className={`font-semibold ${getProfitLossColor(trade.profitLossRate)}`}>
                                  {formatPercentage(trade.profitLossRate)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                            <span>수수료: {formatCurrency(trade.fee)}</span>
                            <span>세금: {formatCurrency(trade.tax)}</span>
                          </div>
                        </div>
                      ) : (
                        // 데스크톱 레이아웃
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h4 className="font-semibold text-base">{trade.stockName}</h4>
                                <p className="text-sm text-gray-600">{trade.stockCode}</p>
                              </div>
                              <Badge className={getTradeTypeColor(trade.tradeType)}>
                                {getTradeTypeText(trade.tradeType)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">매매일</p>
                              <p className="font-medium">{trade.tradeDate}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">수량</p>
                              <p className="font-medium">{trade.quantity.toLocaleString()}주</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">단가</p>
                              <p className="font-medium">{formatCurrency(trade.price)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">거래금액</p>
                              <p className="font-medium">{formatCurrency(trade.amount)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">실현손익</p>
                              <div className="flex items-center space-x-1">
                                {getProfitLossIcon(trade.profitLoss)}
                                <p className={`font-semibold ${getProfitLossColor(trade.profitLoss)}`}>
                                  {formatCurrency(trade.profitLoss)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">수익률</p>
                              <div className="flex items-center space-x-1">
                                {getProfitLossIcon(trade.profitLossRate)}
                                <p className={`font-semibold ${getProfitLossColor(trade.profitLossRate)}`}>
                                  {formatPercentage(trade.profitLossRate)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">수수료/세금</p>
                              <p className="font-medium text-sm">
                                {formatCurrency(trade.fee)} / {formatCurrency(trade.tax)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {index < summary.trades.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingProfitLoss;
