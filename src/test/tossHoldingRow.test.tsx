import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { TossHolding } from '@/types/tossStock';

/**
 * 보유 종목 한 줄.
 *
 * 모든 금액은 종목의 거래통화로만 보여준다 — 원화 병기는 하지 않는다. 평단·투자원금·손익은
 * 매수 시점 환율로 확정된 과거 금액이라 오늘 환율로 환산하면 어느 쪽도 아닌 값이 되기 때문이다.
 *
 * 펼친 상세는 매수/매도 판단에 쓰는 값(현재가·평단·평단 대비 위치·손익·오늘)을 위에 두고,
 * 비용과 거래 내역은 한 번 더 접어 첫 화면을 짧게 유지한다.
 */

const TossHoldingListItem = (await import('@/components/tossStock/TossHoldingListItem')).default;

const samsung = (overrides: Partial<TossHolding> = {}): TossHolding => ({
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
  ...overrides,
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

interface RenderOverrides {
  costBasis?: 'preCost' | 'afterCost';
  onLoadTrades?: () => void;
}

const renderRow = (holding: TossHolding, overrides: RenderOverrides = {}) =>
  render(
    <TossHoldingListItem
      holding={holding}
      costBasis={overrides.costBasis ?? 'preCost'}
      isMobile={false}
      trades={[]}
      onLoadTrades={overrides.onLoadTrades}
    />
  );

const expand = async (name: RegExp) => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name }));
  return user;
};

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

  it('해외 종목은 달러만 보여주고 원화를 섞지 않는다', () => {
    renderRow(nvidia());

    const row = screen.getByTestId('holding-row-NVDA');
    expect(row).toHaveTextContent('$1,132.80');
    expect(row).toHaveTextContent('+$187.20');
    // 오늘 환율로 환산한 원화는 매수 시점 환율과 달라 어느 쪽도 아닌 값이다 — 아예 쓰지 않는다.
    expect(row).not.toHaveTextContent('₩');
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

  it('수량·평단·현재가에 각각 라벨을 붙여 보여준다', () => {
    renderRow(samsung());

    const strip = screen.getByTestId('holding-price-strip');
    expect(strip).toHaveTextContent('수량');
    expect(strip).toHaveTextContent('12주');
    expect(strip).toHaveTextContent('평단');
    expect(strip).toHaveTextContent('₩68,200');
    expect(strip).toHaveTextContent('현재가');
    expect(strip).toHaveTextContent('₩73,400');
  });
});

describe('토스 보유 종목 상세 — 판단 지표 우선', () => {
  it('현재가와 평단을 맨 위에 둔다', async () => {
    renderRow(samsung());
    await expand(/삼성전자/);

    expect(screen.getByTestId('holding-last-price')).toHaveTextContent('₩73,400');
    expect(screen.getByTestId('holding-average-price')).toHaveTextContent('₩68,200');
  });

  it('평가손익과 오늘 손익을 나란히 보여준다', async () => {
    renderRow(samsung());
    await expand(/삼성전자/);

    expect(screen.getByText('오늘 손익')).toBeInTheDocument();
    expect(screen.getByTestId('holding-profit-loss')).toHaveTextContent('+₩62,400');
    expect(screen.getByTestId('holding-daily-profit')).toHaveTextContent('-₩3,500');
  });

  it('보유 수량과 투자 원금·평가금액을 함께 보여준다', async () => {
    renderRow(samsung());
    await expand(/삼성전자/);

    expect(screen.getByTestId('holding-quantity')).toHaveTextContent('12주');
    expect(screen.getByTestId('holding-purchase-amount')).toHaveTextContent('₩818,400');
    expect(screen.getByTestId('holding-market-value')).toHaveTextContent('₩880,800');
  });

  it('수수료·세금은 접혀 있고 열어야 보인다', async () => {
    renderRow(samsung());
    const user = await expand(/삼성전자/);

    expect(screen.queryByTestId('holding-commission')).toBeNull();

    await user.click(screen.getByRole('button', { name: '수수료·세금' }));

    expect(screen.getByTestId('holding-commission')).toHaveTextContent('₩2,110');
    expect(screen.getByTestId('holding-tax')).toHaveTextContent('₩0');
    // 세전을 보고 있으므로 여기에는 반대쪽 기준인 세후 손익이 온다.
    expect(screen.getByTestId('holding-counterpart-profit')).toHaveTextContent('세후 손익');
    expect(screen.getByTestId('holding-counterpart-profit')).toHaveTextContent('+₩60,290');
  });

  it('거래 내역은 접혀 있고, 열었을 때 비로소 조회한다', async () => {
    const onLoadTrades = vi.fn();
    renderRow(samsung(), { onLoadTrades });
    const user = await expand(/삼성전자/);

    // 줄을 펼친 것만으로는 계좌 전체 주문을 훑지 않는다.
    expect(onLoadTrades).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '거래 내역' }));

    expect(onLoadTrades).toHaveBeenCalledTimes(1);
    expect(screen.getByText('거래 내역이 없습니다.')).toBeInTheDocument();
  });

  it('해외 종목 상세에도 원화가 한 글자도 없다', async () => {
    renderRow(nvidia());
    const user = await expand(/엔비디아/);
    await user.click(screen.getByRole('button', { name: '수수료·세금' }));

    const detail = screen.getByTestId('holding-detail');
    expect(detail).toHaveTextContent('$1,132.80');
    expect(detail).toHaveTextContent('$945.60');
    expect(detail).toHaveTextContent('$5.50');
    expect(detail).not.toHaveTextContent('₩');
  });

  it('세후 기준에서는 상세의 평가손익·평가금액도 함께 바뀐다', async () => {
    renderRow(samsung(), { costBasis: 'afterCost' });
    const user = await expand(/삼성전자/);

    expect(screen.getByTestId('holding-profit-loss')).toHaveTextContent('+₩60,290');
    expect(screen.getByTestId('holding-profit-loss')).toHaveTextContent('+7.37%');
    expect(screen.getByTestId('holding-market-value')).toHaveTextContent('₩878,200');

    // 세전 값은 화면 어디에도 섞여 있으면 안 된다 — 반대쪽 기준은 비용 블록 안에만 둔다.
    expect(screen.getByTestId('holding-profit-loss')).not.toHaveTextContent('+₩62,400');

    await user.click(screen.getByRole('button', { name: '수수료·세금' }));

    expect(screen.getByTestId('holding-counterpart-profit')).toHaveTextContent('세전 손익');
    expect(screen.getByTestId('holding-counterpart-profit')).toHaveTextContent('+₩62,400');
  });

  it('국내 종목 상세는 원화 그대로다', async () => {
    renderRow(samsung());
    await expand(/삼성전자/);

    expect(screen.getByTestId('holding-purchase-amount')).toHaveTextContent('₩818,400');
    expect(screen.getByTestId('holding-detail')).not.toHaveTextContent('$');
  });
});
