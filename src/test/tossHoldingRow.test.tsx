import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { TossHolding } from '@/types/tossStock';

/**
 * 보유 종목 한 줄.
 *
 * 기존에는 "현재가 / 평가금" 토글이 배타적이라 평단·현재가와 평가금·손익을 동시에 볼 수 없었다.
 * 셋을 한 줄에 담고, 그 자리를 세전/세후 전환이 대신한다.
 * 해외 종목은 달러가 주(主)이되 원화를 병기해 국내 종목과 크기를 견줄 수 있게 한다.
 */

const TossHoldingListItem = (await import('@/components/tossStock/TossHoldingListItem')).default;

const samsung = (): TossHolding => ({
  symbol: '005930',
  name: '삼성전자',
  marketCountry: 'KR',
  currency: 'KRW',
  quantity: 12,
  lastPrice: 73400,
  averagePurchasePrice: 68200,
  purchaseAmount: 818400,
  marketValue: 880800,
  marketValueAfterCost: 878200,
  profitLoss: 62400,
  profitLossAfterCost: 60290,
  profitLossRate: 7.63,
  profitLossRateAfterCost: 7.37,
  dailyProfitLoss: -3500,
  dailyProfitLossRate: -0.4,
  commission: 2110,
  tax: 0,
});

const nvidia = (): TossHolding => ({
  ...samsung(),
  symbol: 'NVDA',
  name: '엔비디아',
  marketCountry: 'US',
  currency: 'USD',
  quantity: 8,
  lastPrice: 141.6,
  averagePurchasePrice: 118.2,
  purchaseAmount: 945.6,
  marketValue: 1132.8,
  marketValueAfterCost: 1127.3,
  profitLoss: 187.2,
  profitLossAfterCost: 183.9,
  profitLossRate: 19.8,
  profitLossRateAfterCost: 19.45,
  dailyProfitLoss: 37.2,
  dailyProfitLossRate: 3.4,
  commission: 5.5,
  tax: 0,
});

const renderRow = (
  holding: TossHolding,
  overrides: { costBasis?: 'preCost' | 'afterCost'; usdKrwRate?: number | null } = {}
) =>
  render(
    <TossHoldingListItem
      holding={holding}
      costBasis={overrides.costBasis ?? 'preCost'}
      usdKrwRate={overrides.usdKrwRate === undefined ? 1382.4 : overrides.usdKrwRate}
      isMobile={false}
      trades={[]}
    />
  );

describe('토스 보유 종목 줄', () => {
  it('수량·평단·현재가와 평가금·손익을 토글 없이 한 번에 보여준다', () => {
    renderRow(samsung());

    const row = screen.getByTestId('holding-row-005930');
    expect(row).toHaveTextContent('12주');
    expect(row).toHaveTextContent('₩68,200');
    expect(row).toHaveTextContent('₩73,400');
    expect(row).toHaveTextContent('₩880,800');
    expect(row).toHaveTextContent('+₩62,400');
    expect(row).toHaveTextContent('+7.63%');
  });

  it('오늘 등락률을 함께 보여준다', () => {
    renderRow(samsung());

    expect(screen.getByTestId('holding-row-005930')).toHaveTextContent('오늘 -0.40%');
  });

  it('해외 종목은 달러를 주로 두고 원화 환산 금액을 병기한다', () => {
    renderRow(nvidia());

    const row = screen.getByTestId('holding-row-NVDA');
    expect(row).toHaveTextContent('$1,132.80');
    // 1,132.80 × 1,382.4 = 1,565,982.72
    expect(row).toHaveTextContent('₩1,565,983');
    expect(row).toHaveTextContent('+$187.20');
  });

  it('환율이 없으면 원화 병기를 생략한다', () => {
    renderRow(nvidia(), { usdKrwRate: null });

    const row = screen.getByTestId('holding-row-NVDA');
    expect(row).toHaveTextContent('$1,132.80');
    expect(row).not.toHaveTextContent('₩1,565,983');
  });

  it('국내와 해외를 배지로 구분한다', () => {
    renderRow(samsung());
    expect(screen.getByTestId('holding-row-005930')).toHaveTextContent('KR');

    renderRow(nvidia());
    expect(screen.getByTestId('holding-row-NVDA')).toHaveTextContent('US');
  });

  it('세후 기준에서는 비용 공제 후 평가금과 손익으로 바뀐다', () => {
    renderRow(samsung(), { costBasis: 'afterCost' });

    const row = screen.getByTestId('holding-row-005930');
    expect(row).toHaveTextContent('₩878,200');
    expect(row).toHaveTextContent('+₩60,290');
    expect(row).toHaveTextContent('+7.37%');
    expect(row).not.toHaveTextContent('+₩62,400');
  });

  it('펼치면 오늘 손익 금액과 수수료·세금을 보여준다', async () => {
    const user = userEvent.setup();
    renderRow(samsung());

    await user.click(screen.getByRole('button', { name: /삼성전자/ }));

    expect(screen.getByText('오늘 손익')).toBeInTheDocument();
    expect(screen.getByTestId('holding-daily-profit')).toHaveTextContent('-₩3,500');
    expect(screen.getByTestId('holding-commission')).toHaveTextContent('₩2,110');
  });
});

describe('토스 보유 종목 상세 — 해외 종목 원화 병기', () => {
  const expandNvidia = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /엔비디아/ }));
  };

  it('상세의 모든 금액에 원화 환산을 나란히 붙인다', async () => {
    renderRow(nvidia());
    await expandNvidia();

    // 환율 1,382.4 기준.
    expect(screen.getByTestId('holding-average-price')).toHaveTextContent('₩163,400');
    expect(screen.getByTestId('holding-market-value')).toHaveTextContent('₩1,565,983');
    expect(screen.getByTestId('holding-profit-loss')).toHaveTextContent('+₩258,785');
    expect(screen.getByTestId('holding-purchase-amount')).toHaveTextContent('₩1,307,197');
    expect(screen.getByTestId('holding-daily-profit')).toHaveTextContent('+₩51,425');
    expect(screen.getByTestId('holding-profit-after-cost')).toHaveTextContent('+₩254,223');
    expect(screen.getByTestId('holding-commission')).toHaveTextContent('₩7,603');
    expect(screen.getByTestId('holding-tax')).toHaveTextContent('₩0');
  });

  it('거래통화 금액은 그대로 주(主)로 남는다', async () => {
    renderRow(nvidia());
    await expandNvidia();

    expect(screen.getByTestId('holding-market-value')).toHaveTextContent('$1,132.80');
    expect(screen.getByTestId('holding-purchase-amount')).toHaveTextContent('$945.60');
    expect(screen.getByTestId('holding-commission')).toHaveTextContent('$5.50');
  });

  it('손익률은 통화와 무관하므로 한 번만 보여준다', async () => {
    renderRow(nvidia());
    await expandNvidia();

    const profit = screen.getByTestId('holding-profit-loss');
    expect(profit.textContent?.match(/\+19\.80%/g)).toHaveLength(1);
  });

  it('원화가 현재 환율 기준이라는 것을 밝힌다', async () => {
    renderRow(nvidia());
    await expandNvidia();

    // 투자 원금·수수료는 과거 금액이라 오늘 환율로 환산한 값이 매수 시점과 다르다.
    expect(screen.getByText(/현재 환율/)).toBeInTheDocument();
    expect(screen.getByText(/매수 시점/)).toBeInTheDocument();
  });

  it('환율이 없으면 원화 열을 아예 그리지 않는다', async () => {
    renderRow(nvidia(), { usdKrwRate: null });
    await expandNvidia();

    expect(screen.getByTestId('holding-purchase-amount')).toHaveTextContent('$945.60');
    expect(screen.getByTestId('holding-detail')).not.toHaveTextContent('₩');
    expect(screen.queryByText(/현재 환율/)).toBeNull();
  });

  it('국내 종목은 이미 원화라 열을 늘리지 않는다', async () => {
    const user = userEvent.setup();
    renderRow(samsung());

    await user.click(screen.getByRole('button', { name: /삼성전자/ }));

    expect(screen.getByTestId('holding-purchase-amount')).toHaveTextContent('₩818,400');
    expect(screen.queryByText('원화 환산')).toBeNull();
    expect(screen.queryByText(/현재 환율/)).toBeNull();
  });
});
