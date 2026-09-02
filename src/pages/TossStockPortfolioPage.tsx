import React, { useState, useEffect, useCallback } from 'react';
import type { TossAccountOwner, TossPortfolio } from '@/types/tossStock';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import OwnerSegmentControl from '@/components/tossStock/OwnerSegmentControl';
import TossStockAssetsTab from '@/components/tossStock/TossStockAssetsTab';
import TossStockProfitTab from '@/components/tossStock/TossStockProfitTab';

type StockTab = 'assets' | 'profit';

const TAB_TRIGGER_CLASS = cn(
  'rounded-none border-b-2 min-h-[56px] data-[state=inactive]:text-gray-500',
  'data-[state=active]:border-red-500 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent',
  'data-[state=inactive]:border-transparent'
);

/**
 * 토스증권 자산 화면.
 * 한국투자증권 화면(`/stock/portfolio`)과는 별도 라우트이며 데이터 소스도 완전히 분리되어 있다.
 */
const TossStockPortfolioPage = () => {
  const [owners, setOwners] = useState<TossAccountOwner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<TossPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StockTab>('assets');

  // 연동된 계좌 목록을 먼저 받아 첫 번째 소유자를 선택한다.
  useEffect(() => {
    let cancelled = false;

    const fetchOwners = async (): Promise<void> => {
      try {
        const data = await api.getTossOwners();
        if (cancelled) return;
        setOwners(data);
        setSelectedOwner(data[0]?.owner ?? null);
        if (data.length === 0) setError('연동된 토스증권 계좌가 없습니다.');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '계좌 목록을 불러오지 못했습니다.');
        }
      }
    };

    fetchOwners();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPortfolio = useCallback(async (): Promise<void> => {
    if (!selectedOwner) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.getTossPortfolio(selectedOwner);
      setPortfolio(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '주식 현황을 불러오는데 실패했습니다.';
      setError(message);
      // 이미 표시 중인 데이터가 있으면 화면을 갈아끼우지 않고 토스트로만 알린다.
      setPortfolio((current) => {
        if (current) {
          toast({ title: '새로고침 실패', description: message, variant: 'destructive' });
        }
        return current;
      });
    } finally {
      setLoading(false);
    }
  }, [selectedOwner]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleOwnerChange = (owner: string) => {
    // 계좌를 바꾸면 이전 사람의 자산이 잠시 남아 보이지 않도록 즉시 비운다.
    setSelectedOwner(owner);
    setPortfolio(null);
  };
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
              <Button onClick={fetchPortfolio} className="w-full" disabled={loading || !selectedOwner}>
                다시 시도
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    if (!portfolio || !selectedOwner) {
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
            <TossStockAssetsTab
              portfolio={portfolio}
              onRefresh={fetchPortfolio}
              loading={loading}
            />
          </TabsContent>
          <TabsContent value="profit" className="mt-0">
            <TossStockProfitTab owner={selectedOwner} />
          </TabsContent>
        </div>
      </Tabs>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen min-h-[100dvh] overflow-x-hidden bg-gray-50 pb-safe-bottom">
        <div className="max-w-2xl mx-auto w-full overflow-x-hidden min-h-0">
          {owners.length > 1 && selectedOwner && (
            <div className="px-4 pt-4">
              <OwnerSegmentControl owners={owners} value={selectedOwner} onChange={handleOwnerChange} />
            </div>
          )}
          {renderBody()}
        </div>
      </div>
    </Layout>
  );
};

export default TossStockPortfolioPage;
