import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TossPortfolio } from '@/types/tossStock';

/**
 * 계좌 전환 세그먼트.
 *
 * 페이지는 계좌를 바꿀 때 이전 사람의 자산이 잠시 남아 보이지 않도록 `portfolio` 를 즉시 비우고,
 * 다시 받아오는 일은 `selectedOwner` 를 의존성으로 갖는 effect 에 맡긴다.
 * 그래서 <b>이미 선택된 계좌를 다시 누르면</b> 값이 그대로라 effect 가 돌지 않고,
 * 비워 둔 자산만 남아 "데이터 없음" 화면에 갇힌다 — 다른 계좌를 누르기 전까지 빠져나올 수 없다.
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
const OwnerSegmentControl = (await import('@/components/tossStock/OwnerSegmentControl')).default;

const portfolio = (owner: string, ownerName: string): TossPortfolio => ({
  owner,
  ownerName,
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
  lastUpdated: '2026-09-09T10:00:00',
});

beforeEach(() => {
  vi.mocked(api.getTossOwners).mockReset().mockResolvedValue([
    { owner: 'ME', displayName: '나' },
    { owner: 'MOM', displayName: '엄마' },
  ]);
  vi.mocked(api.getTossPortfolio)
    .mockReset()
    .mockImplementation((owner: string) =>
      Promise.resolve(portfolio(owner, owner === 'ME' ? '나' : '엄마'))
    );
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <TossStockPortfolioPage />
    </MemoryRouter>
  );

describe('계좌 전환 세그먼트', () => {
  it('이미 선택된 계좌를 다시 눌러도 자산 화면이 유지된다', async () => {
    const user = userEvent.setup();
    renderPage();

    const selected = await screen.findByRole('tab', { name: '나' });
    await waitFor(() => expect(screen.queryByText('데이터 없음')).not.toBeInTheDocument());

    // 같은 탭을 한 번 더 — 바뀐 것이 없으므로 화면도 그대로여야 한다.
    await user.click(selected);

    await waitFor(() => expect(screen.queryByText('데이터 없음')).not.toBeInTheDocument());
    expect(screen.queryByText('주식 현황 데이터가 없습니다.')).not.toBeInTheDocument();
  });

  it('다른 계좌로 바꾸면 그 계좌의 자산을 다시 받아온다', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('tab', { name: '나' });
    await waitFor(() => expect(api.getTossPortfolio).toHaveBeenCalledWith('ME'));

    await user.click(screen.getByRole('tab', { name: '엄마' }));

    await waitFor(() => expect(api.getTossPortfolio).toHaveBeenCalledWith('MOM'));
    await waitFor(() => expect(screen.queryByText('데이터 없음')).not.toBeInTheDocument());
  });
});

describe('OwnerSegmentControl', () => {
  it('이미 선택된 탭을 다시 눌러도 onChange 를 부르지 않는다', async () => {
    // 바뀐 게 없는데 변경 이벤트를 내보내면, 받는 쪽은 "계좌가 바뀌었다"고 믿고 화면을 비운다.
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <OwnerSegmentControl
        owners={[
          { owner: 'ME', displayName: '나' },
          { owner: 'MOM', displayName: '엄마' },
        ]}
        value="ME"
        onChange={handleChange}
      />
    );

    await user.click(screen.getByRole('tab', { name: '나' }));

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('다른 탭을 누르면 onChange 를 부른다', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <OwnerSegmentControl
        owners={[
          { owner: 'ME', displayName: '나' },
          { owner: 'MOM', displayName: '엄마' },
        ]}
        value="ME"
        onChange={handleChange}
      />
    );

    await user.click(screen.getByRole('tab', { name: '엄마' }));

    expect(handleChange).toHaveBeenCalledExactlyOnceWith('MOM');
  });
});
