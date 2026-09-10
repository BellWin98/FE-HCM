import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TossPortfolio } from '@/types/tossStock';

/**
 * 새로고침 플로팅 버튼은 <b>자산 탭 안에</b> 있다.
 *
 * 화면에 고정(fixed)된 요소라 어디에 두든 같은 자리에 그려지므로, 페이지 최상단에 두고 싶은 유혹이 있다.
 * 그러면 수익분석 탭에서도 떠 있게 되는데, 그 탭은 기간을 골라 조회하는 화면이라 "새로고침"이 무엇을
 * 다시 받는다는 것인지 모호해진다. 자산 탭 안에 두면 비활성 TabsContent 가 언마운트되며 저절로 사라진다.
 */

vi.mock('@/lib/api', () => ({
  api: {
    getTossOwners: vi.fn(),
    getTossPortfolio: vi.fn(),
    getTossRealizedProfit: vi.fn().mockResolvedValue({
      owner: 'ME',
      ownerName: '나',
      period: '',
      totals: [],
      tradeCount: 0,
      trades: [],
      estimated: false,
    }),
  },
}));

vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useTossAccess', () => ({
  useTossAccess: () => ({ hasAccess: true, canTrade: false, isPending: false, isError: false }),
}));

vi.mock('@/hooks/useTossOpenOrders', () => ({
  useTossOpenOrders: () => ({
    orders: [],
    status: 'idle',
    reload: vi.fn(),
    cancel: vi.fn(),
    cancelingOrderId: null,
  }),
}));

const { api } = await import('@/lib/api');
const TossStockPortfolioPage = (await import('@/pages/TossStockPortfolioPage')).default;

const portfolio = (): TossPortfolio => ({
  owner: 'ME',
  ownerName: '나',
  totalPurchaseAmountKrw: 818400,
  totalPurchaseAmountUsd: null,
  totalMarketValueKrw: 880800,
  totalMarketValueUsd: null,
  totalProfitLossKrw: 62400,
  totalProfitLossUsd: null,
  totalProfitLossRate: 7.63,
  dailyProfitLossKrw: -3500,
  dailyProfitLossUsd: null,
  dailyProfitLossRate: -0.4,
  totalMarketValueAfterCostKrw: 878200,
  totalMarketValueAfterCostUsd: null,
  totalProfitLossAfterCostKrw: 60290,
  totalProfitLossAfterCostUsd: null,
  totalProfitLossRateAfterCost: 7.37,
  usdKrwRate: null,
  usdKrwMidRate: null,
  usdKrwRateChangeType: null,
  usdKrwRateAsOf: null,
  cashBuyingPowerKrw: 100000,
  cashBuyingPowerUsd: null,
  holdings: [],
  lastUpdated: '2026-09-10T10:00:00',
});

beforeEach(() => {
  vi.mocked(api.getTossOwners).mockReset().mockResolvedValue([{ owner: 'ME', displayName: '나' }]);
  vi.mocked(api.getTossPortfolio).mockReset().mockResolvedValue(portfolio());
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <TossStockPortfolioPage />
    </MemoryRouter>
  );

describe('새로고침 플로팅 버튼', () => {
  it('자산 탭에서는 떠 있고, 수익분석 탭으로 옮기면 사라진다', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByLabelText('새로고침')).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: '수익분석' }));
    await waitFor(() => expect(screen.queryByLabelText('새로고침')).not.toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: '자산' }));
    await waitFor(() => expect(screen.getByLabelText('새로고침')).toBeInTheDocument());
  });

  it('누르면 자산을 다시 받아온다', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(api.getTossPortfolio).toHaveBeenCalledTimes(1));

    await user.click(await screen.findByLabelText('새로고침'));

    await waitFor(() => expect(api.getTossPortfolio).toHaveBeenCalledTimes(2));
  });
});
