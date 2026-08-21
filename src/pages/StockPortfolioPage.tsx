import React, { useState, useEffect, useCallback } from 'react';
import type { StockPortfolio } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import StockAssetsTab from '@/components/stock/StockAssetsTab';
import StockProfitTab from '@/components/stock/StockProfitTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type StockTab = 'assets' | 'profit';

const TAB_TRIGGER_CLASS = cn(
  'rounded-none border-b-2 min-h-[56px] data-[state=inactive]:text-gray-500',
  'data-[state=active]:border-red-500 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent',
  'data-[state=inactive]:border-transparent'
);

const StockPortfolioPage = () => {
  const [portfolio, setPortfolio] = useState<StockPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StockTab>('assets');

  const fetchPortfolio = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStockPortfolio();
      setPortfolio(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '주식 현황을 불러오는데 실패했습니다.';
      setError(message);
      // 이미 표시 중인 데이터가 있으면 화면을 갈아끼우지 않고 토스트로만 알린다.
      // (에러를 조용히 삼키면 사용자가 새로고침이 성공한 것으로 오해한다)
      setPortfolio((current) => {
        if (current) {
          toast({ title: '새로고침 실패', description: message, variant: 'destructive' });
        }
        return current;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleNavigateToProfit = () => setActiveTab('profit');
  const handleTabChange = (value: string) => setActiveTab(value as StockTab);

  const renderBody = () => {
    if (loading && !portfolio) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">주식 현황을 불러오는 중...</p>
        </div>
      );
    }

    if (error && !portfolio) {
      return (
        <div className="flex items-center justify-center py-16">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-center text-red-500">오류 발생</CardTitle>
              <CardDescription className="text-center text-gray-600">{error}</CardDescription>
            </CardHeader>
            <div className="p-4">
              <Button onClick={fetchPortfolio} className="w-full" disabled={loading}>
                다시 시도
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    if (!portfolio) {
      return (
        <div className="flex items-center justify-center py-16">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-center">데이터 없음</CardTitle>
              <CardDescription className="text-center text-gray-600">
                주식 현황 데이터가 없습니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    return (
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
          <TabsList className="w-full h-14 bg-transparent p-0 gap-0 rounded-none border-0 grid grid-cols-2">
            <TabsTrigger value="assets" className={TAB_TRIGGER_CLASS}>
              자산
            </TabsTrigger>
            <TabsTrigger value="profit" className={TAB_TRIGGER_CLASS}>
              수익분석
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="px-4 pt-4">
          <TabsContent value="assets" className="mt-0">
            <StockAssetsTab
              portfolio={portfolio}
              onRefresh={fetchPortfolio}
              loading={loading}
              onNavigateToProfit={handleNavigateToProfit}
            />
          </TabsContent>
          <TabsContent value="profit" className="mt-0">
            <StockProfitTab />
          </TabsContent>
        </div>
      </Tabs>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen min-h-[100dvh] overflow-x-hidden bg-gray-50 pb-safe-bottom">
        <div className="max-w-2xl mx-auto w-full overflow-x-hidden min-h-0">{renderBody()}</div>
      </div>
    </Layout>
  );
};

export default StockPortfolioPage;
