import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StockPortfolio } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { Layout } from '@/components/layout/Layout';
import StockAssetsTab from '@/components/stock/StockAssetsTab';
import StockProfitTab from '@/components/stock/StockProfitTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const StockPortfolioPage = () => {
  const { member } = useAuth();
  const isMobile = useIsMobile();
  const [portfolio, setPortfolio] = useState<StockPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assets' | 'profit'>('assets');
  const darkMode = false;

  const fetchPortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.getStockPortfolio()) as StockPortfolio;
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

  if (member?.role !== 'FAMILY' && member?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-500">접근 권한 없음</CardTitle>
            <CardDescription className="text-center text-gray-600">
              주식 현황 조회 서비스는 FAMILY 또는 ADMIN 권한이 필요한 서비스입니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading && !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">주식 현황을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-500">오류 발생</CardTitle>
            <CardDescription className="text-center text-gray-600">{error}</CardDescription>
          </CardHeader>
          <div className="p-4">
            <Button onClick={fetchPortfolio} className="w-full">
              다시 시도
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
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

  const pageBg = darkMode ? 'bg-gray-950' : 'bg-gray-50';

  return (
    <Layout>
      <div className={cn('min-h-screen min-h-[100dvh] overflow-x-hidden', pageBg, 'pb-safe-bottom')}>
        <div className="max-w-2xl mx-auto w-full overflow-x-hidden min-h-0">
          {/* 상단 탭: 자산 | 수익분석 */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'assets' | 'profit')}
            className="w-full"
          >
            <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
              <TabsList
                className={cn(
                  'w-full h-14 bg-transparent p-0 gap-0 rounded-none border-0',
                  'grid grid-cols-2'
                )}
              >
                <TabsTrigger
                  value="assets"
                  className={cn(
                    'rounded-none border-b-2 min-h-[56px] data-[state=inactive]:text-gray-500',
                    'data-[state=active]:border-red-500 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent',
                    'data-[state=inactive]:border-transparent'
                  )}
                >
                  자산
                </TabsTrigger>
                <TabsTrigger
                  value="profit"
                  className={cn(
                    'rounded-none border-b-2 min-h-[56px] data-[state=inactive]:text-gray-500',
                    'data-[state=active]:border-red-500 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent',
                    'data-[state=inactive]:border-transparent'
                  )}
                >
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
                  onNavigateToProfit={() => setActiveTab('profit')}
                  dark={darkMode}
                />
              </TabsContent>
              <TabsContent value="profit" className="mt-0">
                <StockProfitTab dark={darkMode} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default StockPortfolioPage;
