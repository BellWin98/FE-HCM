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
 * 그래서 화면은 통화를 합치지 않는다 — 세그먼트로 국내/해외 하나를 골라 그 통화로만 보여주고,
 * 손익률도 응답 값이 아니라 고른 통화 안에서 직접 계산한다. 환율은 금액 환산이 아니라
 * 참고 표기로만 쓴다(매수 시점 환율과 다르기 때문).
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
  cashBuyingPowerKrw: 412300,
  cashBuyingPowerUsd: 18.4,
  holdings: [holding(), nvidia()],
  lastUpdated: '2026-09-02T14:07:00',
});

/** 해외 종목은 있는데 환율 조회가 실패한 상태 — 참고 표기만 사라지고 나머지는 그대로여야 한다. */
const noRatePortfolio = (): TossPortfolio => ({
  ...mixedPortfolio(),
  usdKrwRate: null,
  usdKrwMidRate: null,
  usdKrwRateChangeType: null,
  usdKrwRateAsOf: null,
});

/** 국내만 보유한 계좌. 고를 통화가 하나뿐이라 세그먼트를 그리지 않는다. */
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
  cashBuyingPowerUsd: null,
  holdings: [holding()],
});

/**
 * 해외만 보유한 계좌. 백엔드가 `totalMarketValueKrw` 를 항상 non-null 로 내려주기 때문에
 * (값이 없으면 0) 합계만 보면 국내를 가진 것처럼 보인다 — 세그먼트는 보유 종목에서 파생돼야 한다.
 */
const overseasOnlyPortfolio = (): TossPortfolio => ({
  ...mixedPortfolio(),
  totalPurchaseAmountKrw: 0,
  totalMarketValueKrw: 0,
  totalProfitLossKrw: 0,
  dailyProfitLossKrw: 0,
  totalMarketValueAfterCostKrw: 0,
  totalProfitLossAfterCostKrw: 0,
  cashBuyingPowerKrw: 0,
  holdings: [nvidia()],
});

/** 국내 2종목 — 목록이 한 통화만 담을 때의 정렬 검증용. */
const twoDomesticPortfolio = (): TossPortfolio => ({
  ...domesticOnlyPortfolio(),
  holdings: [
    holding(),
    holding({ symbol: '000660', name: 'SK하이닉스', marketValue: 1500000, profitLossRate: 3.2 }),
  ],
});

const renderTab = (portfolio: TossPortfolio) =>
  render(<TossStockAssetsTab portfolio={portfolio} onRefresh={vi.fn()} loading={false} />);

describe('토스 자산 탭 — 통화 세그먼트 히어로', () => {
  it('기본으로 국내 원화 자산을 한 덩어리로 보여준다', () => {
    renderTab(mixedPortfolio());

    const hero = screen.getByTestId('portfolio-hero');
    expect(hero).toHaveTextContent('국내 자산');
    expect(hero).toHaveTextContent('₩2,741,300');
    expect(hero).toHaveTextContent('-₩13,100');
    // -13,100 / 2,754,400 — 응답의 전체 손익률(+2.36%)이 아니라 국내 원금 대비로 직접 계산한다.
    expect(hero).toHaveTextContent('-0.48%');
  });

  it('해외를 고르면 히어로가 달러 한 덩어리로 바뀐다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await user.click(screen.getByRole('tab', { name: /해외/ }));

    const hero = screen.getByTestId('portfolio-hero');
    expect(hero).toHaveTextContent('해외 자산');
    expect(hero).toHaveTextContent('$2,400.60');
    expect(hero).toHaveTextContent('+$110.40');
    expect(hero).toHaveTextContent('+4.82%');
  });

  it('해외 히어로에는 원화가 한 글자도 없다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await user.click(screen.getByRole('tab', { name: /해외/ }));

    expect(screen.getByTestId('portfolio-hero')).not.toHaveTextContent('₩');
  });

  it('원화 환산 전체 기준인 응답 손익률은 통화 히어로에 쓰지 않는다', () => {
    renderTab(mixedPortfolio());

    // 국내는 -₩13,100 손실인데 +2.36% 를 붙이면 금액과 비율이 어긋난 줄이 된다.
    expect(screen.getByTestId('portfolio-hero')).not.toHaveTextContent('+2.36%');
  });

  it('오늘 손익·투자원금·현금 매수가능금액을 고른 통화로 나란히 보여준다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    const hero = () => screen.getByTestId('portfolio-hero');
    expect(hero()).toHaveTextContent('+₩18,700');
    expect(hero()).toHaveTextContent('₩2,754,400');
    expect(hero()).toHaveTextContent('₩412,300');

    await user.click(screen.getByRole('tab', { name: /해외/ }));

    expect(hero()).toHaveTextContent('+$21.30');
    expect(hero()).toHaveTextContent('$2,290.20');
    expect(hero()).toHaveTextContent('$18.40');
  });

  it('오늘 등락률도 응답 값이 아니라 고른 통화 안에서 계산한다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    // 18,700 / (2,741,300 - 18,700) = +0.69% — 응답의 전체 기준 +0.80% 가 아니다.
    expect(screen.getByTestId('portfolio-hero')).toHaveTextContent('+0.69%');

    await user.click(screen.getByRole('tab', { name: /해외/ }));

    // 21.30 / (2,400.60 - 21.30) = +0.90%
    expect(screen.getByTestId('portfolio-hero')).toHaveTextContent('+0.90%');
  });

  it('국내 종목이 없으면 세그먼트 없이 달러 히어로만 보여준다', () => {
    renderTab(overseasOnlyPortfolio());

    expect(screen.queryByTestId('currency-segment')).toBeNull();
    const hero = screen.getByTestId('portfolio-hero');
    expect(hero).toHaveTextContent('해외 자산');
    expect(hero).toHaveTextContent('$2,400.60');
  });
});

describe('토스 자산 탭 — 세그먼트가 히어로와 목록을 함께 바꾼다', () => {
  const rowIds = (): string[] =>
    screen.getAllByTestId(/^holding-row-/).map((row) => row.getAttribute('data-testid') ?? '');

  it('종목 수를 실은 국내·해외 세그먼트를 보여준다', () => {
    renderTab(mixedPortfolio());

    const segment = screen.getByTestId('currency-segment');
    expect(segment).toHaveTextContent('국내');
    expect(segment).toHaveTextContent('해외');
    expect(segment).toHaveTextContent('1종목');
    // 통화를 넘어 합산할 수 없으므로 "전체"라는 선택지는 존재하지 않는다.
    expect(segment).not.toHaveTextContent('전체');
  });

  it('국내를 고르면 국내 종목만 남는다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await user.click(screen.getByRole('tab', { name: /국내/ }));

    expect(rowIds()).toEqual(['holding-row-005930']);
  });

  it('해외를 고르면 해외 종목만 남고 히어로도 함께 바뀐다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await user.click(screen.getByRole('tab', { name: /해외/ }));

    // 목록만 좁히는 필터가 아니라 화면 전체가 한 통화를 가리킨다.
    expect(rowIds()).toEqual(['holding-row-NVDA']);
    expect(screen.getByTestId('portfolio-hero')).toHaveTextContent('$2,400.60');
  });

  it('환율을 못 받아도 통화별로 나눠 보는 것은 그대로 된다', async () => {
    const user = userEvent.setup();
    renderTab(noRatePortfolio());

    await user.click(screen.getByRole('tab', { name: /해외/ }));

    expect(rowIds()).toEqual(['holding-row-NVDA']);
    expect(screen.getByTestId('portfolio-hero')).toHaveTextContent('$2,400.60');
  });

  it('해외 종목이 없으면 세그먼트를 그리지 않는다', () => {
    renderTab(domesticOnlyPortfolio());

    expect(screen.queryByTestId('currency-segment')).toBeNull();
    expect(screen.getByTestId('portfolio-hero')).toHaveTextContent('국내 자산');
  });
});

describe('토스 자산 탭 — 세전/세후는 화면 전체가 한 기준을 따른다', () => {
  const rowIds = (): string[] =>
    screen.getAllByTestId(/^holding-row-/).map((row) => row.getAttribute('data-testid') ?? '');

  it('세후를 고르면 요약의 총자산과 평가손익이 함께 바뀐다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await user.click(screen.getByRole('button', { name: '세후' }));

    const hero = screen.getByTestId('portfolio-hero');
    expect(hero).toHaveTextContent('₩2,735,000');
    expect(hero).toHaveTextContent('-₩19,400');
    expect(hero).toHaveTextContent('-0.70%');
    // 세전 값이 남아 있으면 같은 카드 안에서 기준이 갈린다.
    expect(hero).not.toHaveTextContent('-₩13,100');
  });

  it('요약과 목록이 같은 기준으로 동시에 바뀐다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    const row = () => screen.getByTestId('holding-row-005930');
    expect(screen.getByTestId('portfolio-hero')).toHaveTextContent('₩2,741,300');
    expect(row()).toHaveTextContent('₩880,800');

    await user.click(screen.getByRole('button', { name: '세후' }));

    // 요약만, 혹은 목록만 바뀌면 같은 화면 안에서 기준이 갈린다.
    expect(screen.getByTestId('portfolio-hero')).toHaveTextContent('₩2,735,000');
    expect(row()).toHaveTextContent('₩878,200');
    expect(row()).not.toHaveTextContent('₩880,800');
  });

  it('통화를 바꿔도 고른 기준은 유지된다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await user.click(screen.getByRole('button', { name: '세후' }));
    await user.click(screen.getByRole('tab', { name: /해외/ }));

    const hero = screen.getByTestId('portfolio-hero');
    expect(hero).toHaveTextContent('$2,394.10');
    expect(hero).toHaveTextContent('+$104.90');
    expect(rowIds()).toEqual(['holding-row-NVDA']);
    expect(screen.getByTestId('holding-row-NVDA')).toHaveTextContent('$1,127.30');
  });
});

describe('토스 자산 탭 — 단일 통화 목록 정렬', () => {
  const rowIds = (): string[] =>
    screen.getAllByTestId(/^holding-row-/).map((row) => row.getAttribute('data-testid') ?? '');

  it('목록이 한 통화만 담으므로 평가금을 그대로 비교한다', () => {
    // ₩1,500,000(하이닉스) > ₩880,800(삼성전자). 환산이 끼어들 자리가 없다.
    renderTab(twoDomesticPortfolio());

    expect(rowIds()).toEqual(['holding-row-000660', 'holding-row-005930']);
  });

  it('수익률 정렬은 통화와 무관하므로 그대로 동작한다', async () => {
    const user = userEvent.setup();
    renderTab(twoDomesticPortfolio());

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: '총 수익률 높은 순' }));

    // 삼성전자 +7.63% > 하이닉스 +3.20%
    expect(rowIds()).toEqual(['holding-row-005930', 'holding-row-000660']);
  });
});

describe('토스 자산 탭 — 거래 내역은 열었을 때만 조회한다', () => {
  const openTrades = async (user: ReturnType<typeof userEvent.setup>, name: RegExp) => {
    await user.click(screen.getByRole('button', { name }));
    await user.click(screen.getByRole('button', { name: '거래 내역' }));
  };

  it('종목을 펼치기 전에는 거래 내역을 조회하지 않는다', () => {
    renderTab(mixedPortfolio());

    // 이 데이터는 계좌 개설 이후 전체 주문을 훑는 무거운 호출이다.
    expect(api.getTossRealizedProfit).not.toHaveBeenCalled();
  });

  it('줄을 펼치기만 해서는 조회하지 않는다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await user.click(screen.getByRole('button', { name: /삼성전자/ }));

    // 판단만 하고 닫는 경우가 대부분이라, 트리거는 거래 내역을 실제로 열 때다.
    expect(api.getTossRealizedProfit).not.toHaveBeenCalled();
  });

  it('종목을 여럿 열어도 거래 내역은 한 번만 조회한다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await openTrades(user, /삼성전자/);
    await user.click(screen.getByRole('tab', { name: /해외/ }));
    await openTrades(user, /엔비디아/);

    expect(api.getTossRealizedProfit).toHaveBeenCalledTimes(1);
  });

  it('추정 원가가 섞인 계좌에서는 열어 본 거래 내역에 안내를 붙인다', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getTossRealizedProfit).mockResolvedValueOnce({
      owner: 'A',
      ownerName: '이재훈',
      period: '',
      totals: [],
      tradeCount: 1,
      trades: [
        {
          symbol: '005930',
          name: '삼성전자',
          tradeDate: '2026-08-20',
          tradeType: 'SELL',
          currency: 'KRW',
          quantity: 3,
          price: 73900,
          amount: 221700,
          profitLoss: 17100,
          profitLossRate: 8.36,
          fee: 332,
          tax: 443,
          estimated: true,
        },
      ],
      estimated: true,
    });
    renderTab(mixedPortfolio());

    await openTrades(user, /삼성전자/);

    expect(await screen.findByText(/추정치/)).toBeInTheDocument();
  });
});

describe('토스 자산 탭 — 거래 내역을 기다리는 동안', () => {
  const openTrades = async (user: ReturnType<typeof userEvent.setup>, name: RegExp) => {
    await user.click(screen.getByRole('button', { name }));
    await user.click(screen.getByRole('button', { name: '거래 내역' }));
  };

  it('응답 전에는 "없음"이라고 말하지 않고 불러오는 중임을 보여준다', async () => {
    const user = userEvent.setup();
    // 응답을 붙잡아 두어 로딩 상태를 관찰한다.
    vi.mocked(api.getTossRealizedProfit).mockReturnValueOnce(new Promise(() => {}));
    renderTab(mixedPortfolio());

    await openTrades(user, /삼성전자/);

    expect(screen.getByTestId('trades-loading')).toBeInTheDocument();
    // 받아 보기도 전에 없다고 하면 사용자가 거래가 없는 줄 안다.
    expect(screen.queryByText('거래 내역이 없습니다.')).toBeNull();
    // 정렬할 것이 없는데 컨트롤만 떠 있으면 데이터가 있는 줄 안다.
    expect(screen.queryByRole('button', { name: '최신순' })).toBeNull();
  });

  it('받아 보니 비어 있으면 그때 "없음"이라고 말한다', async () => {
    const user = userEvent.setup();
    renderTab(mixedPortfolio());

    await openTrades(user, /삼성전자/);

    expect(await screen.findByText('거래 내역이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByTestId('trades-loading')).toBeNull();
  });

  it('조회에 실패하면 없다고 하지 않고 다시 시도할 길을 준다', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getTossRealizedProfit).mockRejectedValueOnce(new Error('네트워크 오류'));
    renderTab(mixedPortfolio());

    await openTrades(user, /삼성전자/);

    expect(await screen.findByTestId('trades-error')).toBeInTheDocument();
    expect(screen.queryByText('거래 내역이 없습니다.')).toBeNull();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    // 실패했으니 같은 계좌라도 다시 조회한다.
    expect(api.getTossRealizedProfit).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('거래 내역이 없습니다.')).toBeInTheDocument();
  });
});

describe('토스 자산 탭 — 환율 표기', () => {
  it('금액 환산에는 쓰지 않지만 참고 환율과 기준 시각은 보여준다', () => {
    renderTab(mixedPortfolio());

    const stamp = screen.getByTestId('data-freshness');
    expect(stamp).toHaveTextContent('1,382.4');
    expect(stamp).toHaveTextContent('14:07');
  });

  it('환율 등락 방향을 함께 보여준다', () => {
    renderTab(mixedPortfolio());

    expect(screen.getByTestId('data-freshness')).toHaveTextContent('▲');
  });

  it('해외 종목이 없으면 환율을 표시하지 않는다', () => {
    renderTab(domesticOnlyPortfolio());

    const stamp = screen.getByTestId('data-freshness');
    expect(stamp).toHaveTextContent('14:07');
    expect(within(stamp).queryByText(/USD|\$1 =/)).toBeNull();
  });
});
