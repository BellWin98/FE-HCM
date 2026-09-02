import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TossRealizedProfit, TossTrade } from '@/types/tossStock';

/**
 * 수익분석 탭.
 *
 * 실현손익이 붙는 것은 매도뿐인데 매수까지 같은 리스트에 나열하면 손익 칸이 빈 줄이 절반이다.
 * 또 한 종목을 나눠 팔면 같은 이름이 반복되므로 종목 단위로 묶는다.
 */

vi.mock('@/lib/api', () => ({
  api: { getTossRealizedProfit: vi.fn() },
}));

const { api } = await import('@/lib/api');
const TossStockProfitTab = (await import('@/components/tossStock/TossStockProfitTab')).default;

const trade = (overrides: Partial<TossTrade> = {}): TossTrade => ({
  symbol: 'NVDA',
  name: '엔비디아',
  tradeDate: '2026-09-01',
  tradeType: 'SELL',
  currency: 'USD',
  quantity: 2,
  price: 141.6,
  amount: 283.2,
  profitLoss: 46.8,
  profitLossRate: 19.8,
  fee: 0.5,
  tax: 0,
  estimated: false,
  ...overrides,
});

const summary = (trades: TossTrade[]): TossRealizedProfit => ({
  owner: 'A',
  ownerName: '이재훈',
  period: '',
  totals: [
    {
      currency: 'USD',
      totalBuyAmount: 945.6,
      totalSellAmount: 283.2,
      totalProfitLoss: 46.8,
      totalProfitLossRate: 19.8,
      totalFee: 1.7,
      totalTax: 0,
      tradeCount: 2,
    },
  ],
  tradeCount: trades.length,
  trades,
  estimated: false,
});

const allTrades = (): TossTrade[] => [
  trade(),
  trade({ tradeDate: '2026-09-02', quantity: 1, amount: 141.6, profitLoss: 23.4 }),
  trade({ tradeDate: '2026-08-15', tradeType: 'BUY', quantity: 8, price: 118.2, amount: 945.6, profitLoss: 0, profitLossRate: 0 }),
  trade({
    symbol: '005930',
    name: '삼성전자',
    tradeDate: '2026-08-20',
    currency: 'KRW',
    quantity: 5,
    price: 73400,
    amount: 367000,
    profitLoss: -12000,
    profitLossRate: -3.16,
    fee: 500,
    tax: 800,
  }),
];

beforeEach(() => {
  vi.mocked(api.getTossRealizedProfit).mockReset();
  vi.mocked(api.getTossRealizedProfit).mockResolvedValue(summary(allTrades()));
});

const renderTab = () => render(<TossStockProfitTab owner="A" />);

describe('수익분석 탭 — 매도 중심으로 보여주기', () => {
  it('기본으로 매도만 보여준다', async () => {
    renderTab();

    expect(await screen.findByTestId('trade-group-NVDA')).toBeInTheDocument();
    // 매수는 실현손익이 없어 기본 화면에서는 접어 둔다.
    expect(screen.queryByText(/구매/)).toBeNull();
  });

  it('전체 거래를 고르면 매수도 건수에 포함된다', async () => {
    const user = userEvent.setup();
    renderTab();
    const group = await screen.findByTestId('trade-group-NVDA');
    expect(group).not.toHaveTextContent('매수');

    await user.click(screen.getByRole('button', { name: '전체 거래' }));

    expect(screen.getByTestId('trade-group-NVDA')).toHaveTextContent('매수 1건');
  });

  it('종목별로 묶어 실현손익 합계와 매도 건수를 보여준다', async () => {
    renderTab();

    const group = await screen.findByTestId('trade-group-NVDA');
    // 46.80 + 23.40 = 70.20
    expect(group).toHaveTextContent('+$70.20');
    expect(group).toHaveTextContent('매도 2건');

    const samsung = screen.getByTestId('trade-group-005930');
    expect(samsung).toHaveTextContent('-₩12,000');
    expect(samsung).toHaveTextContent('매도 1건');
  });

  it('종목을 펼치면 체결 하나하나를 보여준다', async () => {
    const user = userEvent.setup();
    renderTab();

    const group = await screen.findByTestId('trade-group-NVDA');
    await user.click(screen.getByRole('button', { name: /엔비디아/ }));

    expect(group).toHaveTextContent('2026-09-01');
    expect(group).toHaveTextContent('2026-09-02');
  });
});

describe('수익분석 탭 — 기간 이동', () => {
  it('오늘이 포함된 기간에서는 다음 기간으로 넘어갈 수 없다', async () => {
    renderTab();
    await screen.findByTestId('trade-group-NVDA');

    expect(screen.getByRole('button', { name: '다음 기간' })).toBeDisabled();
  });

  it('이전 기간으로 간 뒤에는 다음 기간으로 돌아올 수 있다', async () => {
    const user = userEvent.setup();
    renderTab();
    await screen.findByTestId('trade-group-NVDA');

    await user.click(screen.getByRole('button', { name: '이전 기간' }));

    expect(screen.getByRole('button', { name: '다음 기간' })).toBeEnabled();
  });
});

describe('수익분석 탭 — 빈 기간 안내', () => {
  it('거래가 없으면 어느 기간인지 밝혀서 알려준다', async () => {
    vi.mocked(api.getTossRealizedProfit).mockResolvedValue(summary([]));
    renderTab();

    // "이 기간에는 거래 내역이 없습니다" 만으로는 조회 실패인지 진짜 없는지 알 수 없다.
    expect(await screen.findByText(/매도한 종목이 없어요/)).toBeInTheDocument();
  });
});
