import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TossHolding, TossPortfolio } from '@/types/tossStock';

/**
 * 토스증권 자산 탭의 통화 표기.
 *
 * 토스 응답에서 `...Krw` 는 국내 종목만, `...Usd` 는 해외 종목만 담은 값이고,
 * `totalProfitLossRate` 만 국내+해외를 환율로 원화 환산한 전체 기준이다
 * (toss-api.json 의 `OverviewProfitLoss.rate`). 두 모집단이 다르므로 금액과 비율을
 * "-₩13,100 (+2.36%)" 처럼 한 괄호에 묶으면 손실인데 플러스 수익률인 줄이 그대로 나온다.
 *
 * 백엔드가 환율을 붙여 `...InKrw` 를 채워 주면 계좌 전체를 한 숫자로 보여줄 수 있고,
 * 환율을 못 받았을 때만 통화별 분리 표시로 물러난다.
 */

vi.mock('@/lib/api', () => ({
  api: {
    getTossRealizedProfit: vi.fn().mockResolvedValue({
      owner: 'A',
      ownerName: '이재훈',
      period: '',
      totals: [],
      tradeCount: 0,
      trades: [],
      estimated: false,
    }),
  },
}));

const { api } = await import('@/lib/api');
const TossStockAssetsTab = (await import('@/components/tossStock/TossStockAssetsTab')).default;

beforeEach(() => {
  vi.mocked(api.getTossRealizedProfit).mockClear();
});

const holding = (overrides: Partial<TossHolding> = {}): TossHolding => ({
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

const nvidia = (): TossHolding =>
  holding({
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

/** 국내는 손실(-₩13,100), 해외는 이익(+$110.40)이라 전체 환산 손익률만 플러스가 되는 계좌. */
const mixedPortfolio = (): TossPortfolio => ({
  owner: 'A',
  ownerName: '이재훈',
  totalPurchaseAmountKrw: 2754400,
  totalPurchaseAmountUsd: 2290.2,
  totalMarketValueKrw: 2741300,
  totalMarketValueUsd: 2400.6,
  totalProfitLossKrw: -13100,
  totalProfitLossUsd: 110.4,
  totalProfitLossRate: 2.36,
  dailyProfitLossKrw: 18700,
  dailyProfitLossUsd: 21.3,
  dailyProfitLossRate: 0.8,
  totalMarketValueAfterCostKrw: 2735000,
  totalMarketValueAfterCostUsd: 2394.1,
  totalProfitLossAfterCostKrw: -19400,
  totalProfitLossAfterCostUsd: 104.9,
  totalProfitLossRateAfterCost: 2.12,
  usdKrwRate: 1382.4,
  usdKrwMidRate: 1375,
  usdKrwRateChangeType: 'UP',
  usdKrwRateAsOf: '2026-09-02T14:07:00+09:00',
  totalPurchaseAmountInKrw: 5920372,
  totalMarketValueInKrw: 6059889,
  totalProfitLossInKrw: 139517,
  totalProfitLossAfterCostInKrw: 125614,
  dailyProfitLossInKrw: 48145,
  overseasWeightPercent: 54.76,
  cashBuyingPowerKrw: 412300,
  cashBuyingPowerUsd: 18.4,
  holdings: [holding(), nvidia()],
  lastUpdated: '2026-09-02T14:07:00',
});

/** 해외 종목은 있는데 환율 조회가 실패한 상태 — 합쳐서 보여줄 수 없다. */
const noRatePortfolio = (): TossPortfolio => ({
  ...mixedPortfolio(),
  usdKrwRate: null,
  usdKrwMidRate: null,
  usdKrwRateChangeType: null,
  usdKrwRateAsOf: null,
  totalPurchaseAmountInKrw: null,
  totalMarketValueInKrw: null,
  totalProfitLossInKrw: null,
  totalProfitLossAfterCostInKrw: null,
  dailyProfitLossInKrw: null,
  overseasWeightPercent: null,
});

/** 해외 종목이 없으면 환산할 것이 없으므로 국내 금액이 그대로 전체가 된다. */
const domesticOnlyPortfolio = (): TossPortfolio => ({
  ...mixedPortfolio(),
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
  totalPurchaseAmountInKrw: 818400,
  totalMarketValueInKrw: 880800,
  totalProfitLossInKrw: 62400,
  totalProfitLossAfterCostInKrw: 60290,
  dailyProfitLossInKrw: -3500,
  overseasWeightPercent: 0,
  cashBuyingPowerUsd: null,
  holdings: [holding()],
});

const renderTab = (portfolio: TossPortfolio) =>
  render(
    <TossStockAssetsTab
      portfolio={portfolio}
      onRefresh={vi.fn()}
      loading={false}
      onNavigateToProfit={vi.fn()}
    />
  );

describe('토스 자산 탭 — 총자산 한 숫자로 보여주기', () => {
  it('환산 합계가 있으면 총자산과 전체 손익을 한 덩어리로 보여준다', () => {
    renderTab(mixedPortfolio());

    const hero = screen.getByTestId('portfolio-hero');
    expect(hero).toHaveTextContent('총자산');
    expect(hero).toHaveTextContent('₩6,059,889');
    expect(hero).toHaveTextContent('+₩139,517');
    expect(hero).toHaveTextContent('+2.36%');
  });

  it('세후 손익을 히어로에 함께 보여준다', () => {
    renderTab(mixedPortfolio());

    const hero = screen.getByTestId('portfolio-hero');
    expect(hero).toHaveTextContent('세후');
    expect(hero).toHaveTextContent('+₩125,614');
    expect(hero).toHaveTextContent('+2.12%');
  });

  it('오늘 손익·투자원금·현금 매수가능금액을 원화 환산 기준으로 나란히 보여준다', () => {
    renderTab(mixedPortfolio());

    const hero = screen.getByTestId('portfolio-hero');
    expect(hero).toHaveTextContent('+₩48,145');
    expect(hero).toHaveTextContent('₩5,920,372');
    expect(hero).toHaveTextContent('₩412,300');
  });

  it('국내와 해외의 비중·평가금·수익률을 각각 보여준다', () => {
    renderTab(mixedPortfolio());

    const domestic = screen.getByTestId('leg-domestic');
    expect(domestic).toHaveTextContent('45.2%');
    expect(domestic).toHaveTextContent('₩2,741,300');
    // 전체 손익률(+2.36%)이 아니라 국내만의 손익률이어야 한다.
    expect(domestic).toHaveTextContent('-0.48%');

    const overseas = screen.getByTestId('leg-overseas');
    expect(overseas).toHaveTextContent('54.8%');
    expect(overseas).toHaveTextContent('$2,400.60');
    expect(overseas).toHaveTextContent('+4.82%');
  });

  it('해외 종목이 없으면 국내/해외 비중을 그리지 않는다', () => {
    renderTab(domesticOnlyPortfolio());

    const hero = screen.getByTestId('portfolio-hero');
    expect(hero).toHaveTextContent('₩880,800');
    expect(hero).toHaveTextContent('+₩62,400');
    expect(screen.queryByTestId('leg-domestic')).toBeNull();
    expect(screen.queryByTestId('leg-overseas')).toBeNull();
  });
});

describe('토스 자산 탭 — 환율을 못 받으면 통화별로 분리한다', () => {
  it('국내 손익 금액에 전체 손익률을 괄호로 붙이지 않는다', () => {
    renderTab(noRatePortfolio());

    expect(screen.queryByTestId('portfolio-hero')).toBeNull();
    // "-₩13,100 (+2.36%)" 처럼 국내 금액과 전체 비율이 한 덩어리로 묶이면 안 된다.
    expect(screen.queryByText(/-₩13,100\s*\(/)).toBeNull();
    expect(screen.queryByText(/₩18,700\s*\(/)).toBeNull();
  });

  it('손익률을 전체(원화 환산) 기준이라고 밝힌다', () => {
    renderTab(noRatePortfolio());

    expect(screen.getByText('전체 수익률')).toBeInTheDocument();
    expect(screen.getByText('+2.36%')).toBeInTheDocument();
    expect(screen.getByText(/원화 환산/)).toBeInTheDocument();
  });

  it('국내와 해외 손익 금액을 각각 보여준다', () => {
    renderTab(noRatePortfolio());

    expect(screen.getByTestId('total-profit-domestic')).toHaveTextContent('-₩13,100');
    expect(screen.getByTestId('total-profit-overseas')).toHaveTextContent('+$110.40');
  });

  it('오늘 손익도 국내와 해외를 나눠 보여주고 비율은 전체 기준으로 표시한다', () => {
    renderTab(noRatePortfolio());

    const daily = screen.getByTestId('daily-profit-card');
    expect(daily).toHaveTextContent('+₩18,700');
    expect(daily).toHaveTextContent('+$21.30');
    expect(daily).toHaveTextContent('전체 +0.80%');
  });
});

describe('토스 자산 탭 — 전체/국내/해외 필터', () => {
  const rowIds = (): string[] =>
    screen.getAllByTestId(/^holding-row-/).map((row) => row.getAttribute('data-testid') ?? '');

  it('해외 종목이 있으면 종목 수와 소계를 실은 세그먼트를 보여준다', () => {
    renderTab(mixedPortfolio());

    const segment = screen.getByTestId('market-filter');
    expect(segment).toHaveTextContent('전체');
    expect(segment).toHaveTextContent('2종목');
    expect(segment).toHaveTextContent('국내');
    expect(segment).toHaveTextContent('₩2,741,300');
    expect(segment).toHaveTextContent('해외');
    expect(segment).toHaveTextContent('$2,400.60');
  });

  it('국내를 고르면 국내 종목만 남는다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await user.click(screen.getByRole('button', { name: /^국내/ }));

    expect(rowIds()).toEqual(['holding-row-005930']);
  });

  it('해외를 고르면 해외 종목만 남는다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await user.click(screen.getByRole('button', { name: /^해외/ }));

    expect(rowIds()).toEqual(['holding-row-NVDA']);
  });

  it('필터를 바꿔도 히어로는 계좌 전체를 가리킨다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await user.click(screen.getByRole('button', { name: /^해외/ }));

    // 목록만 좁히는 것이지 계좌가 바뀌는 것이 아니다.
    expect(screen.getByTestId('portfolio-hero')).toHaveTextContent('₩6,059,889');
  });

  it('환율이 없어도 통화별로 나눠 보는 것은 가능하다', async () => {
    const user = userEvent.setup();
    renderTab(noRatePortfolio());

    await user.click(screen.getByRole('button', { name: /^해외/ }));

    expect(rowIds()).toEqual(['holding-row-NVDA']);
  });

  it('해외 종목이 없으면 필터를 그리지 않는다', () => {
    renderTab(domesticOnlyPortfolio());

    expect(screen.queryByTestId('market-filter')).toBeNull();
  });

  it('고른 시장에 종목이 없으면 계좌가 빈 것처럼 말하지 않는다', async () => {
    const user = userEvent.setup();
    // 해외만 보유한 계좌 — 국내를 골라도 계좌 자체가 빈 것은 아니다.
    renderTab({
      ...mixedPortfolio(),
      totalMarketValueKrw: 0,
      holdings: [nvidia()],
    });

    await user.click(screen.getByRole('button', { name: /^국내/ }));

    expect(screen.getByText('국내 종목이 없어요.')).toBeInTheDocument();
    expect(screen.queryByText('보유 중인 주식이 없습니다.')).toBeNull();
  });
});

describe('토스 자산 탭 — 통화가 섞인 목록 정렬', () => {
  const rowNames = (): string[] =>
    screen.getAllByTestId(/^holding-row-/).map((row) => row.getAttribute('data-testid') ?? '');

  it('평가금 순 정렬은 원화 환산 기준으로 한다', () => {
    // ₩880,800 vs $1,132.80 을 숫자 그대로 비교하면 해외 종목이 항상 바닥에 깔린다.
    // 환산하면 엔비디아는 ₩1,565,983 이라 삼성전자보다 위여야 한다.
    renderTab(mixedPortfolio());

    expect(rowNames()).toEqual(['holding-row-NVDA', 'holding-row-005930']);
  });

  it('환율이 없으면 통화를 섞어 정렬하지 않고 국내를 먼저 묶는다', () => {
    renderTab(noRatePortfolio());

    expect(rowNames()).toEqual(['holding-row-005930', 'holding-row-NVDA']);
  });

  it('수익률 정렬은 통화와 무관하므로 환율 없이도 전체를 함께 정렬한다', async () => {
    const user = userEvent.setup();
    renderTab(noRatePortfolio());

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: '총 수익률 높은 순' }));

    // 엔비디아 +19.80% > 삼성전자 +7.63%
    expect(rowNames()).toEqual(['holding-row-NVDA', 'holding-row-005930']);
  });
});

describe('토스 자산 탭 — 거래 내역은 펼칠 때만 조회한다', () => {
  it('종목을 펼치기 전에는 거래 내역을 조회하지 않는다', () => {
    renderTab(mixedPortfolio());

    // 이 데이터는 줄을 펼쳤을 때만 쓰이는데, 계좌 개설 이후 전체 주문을 훑는 무거운 호출이다.
    expect(api.getTossRealizedProfit).not.toHaveBeenCalled();
  });

  it('종목을 여럿 펼쳐도 거래 내역은 한 번만 조회한다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await user.click(screen.getByRole('button', { name: /삼성전자/ }));
    await user.click(screen.getByRole('button', { name: /엔비디아/ }));

    expect(api.getTossRealizedProfit).toHaveBeenCalledTimes(1);
  });

  it('추정 원가가 섞인 계좌에서는 펼친 거래 내역에 안내를 붙인다', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getTossRealizedProfit).mockResolvedValueOnce({
      owner: 'A',
      ownerName: '이재훈',
      period: '',
      totals: [],
      tradeCount: 0,
      trades: [],
      estimated: true,
    });
    renderTab(mixedPortfolio());

    await user.click(screen.getByRole('button', { name: /삼성전자/ }));

    expect(await screen.findByText(/추정치/)).toBeInTheDocument();
  });
});

describe('토스 자산 탭 — 환율 표기', () => {
  it('환산 금액을 보여줄 때는 적용 환율과 기준 시각을 함께 보여준다', () => {
    renderTab(mixedPortfolio());

    const stamp = screen.getByTestId('data-freshness');
    expect(stamp).toHaveTextContent('1,382.4');
    expect(stamp).toHaveTextContent('14:07');
  });

  it('해외 종목이 없으면 환율을 표시하지 않는다', () => {
    renderTab(domesticOnlyPortfolio());

    const stamp = screen.getByTestId('data-freshness');
    expect(stamp).toHaveTextContent('14:07');
    expect(within(stamp).queryByText(/USD|\$1 =/)).toBeNull();
  });
});
