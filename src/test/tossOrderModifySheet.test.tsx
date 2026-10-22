import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TossOpenOrder, TossOrderable } from '@/types/tossStock';

/**
 * 주문 정정 시트.
 *
 * 정정도 돈을 움직인다. 주문 시트와 같이 입력 → 확인 2단계를 거치고, 토스의 정정 규칙을 화면에서 먼저 지킨다 —
 * 국내는 가격·수량, 미국은 가격만 정정할 수 있다.
 */

vi.mock('@/lib/api', () => ({
  api: {
    getTossOrderable: vi.fn(),
    modifyTossOrder: vi.fn(),
  },
}));

const { api } = await import('@/lib/api');
const TossOrderModifySheet = (await import('@/components/tossStock/TossOrderModifySheet')).default;

const krOrder = (overrides: Partial<TossOpenOrder> = {}): TossOpenOrder => ({
  orderId: 'o-1',
  symbol: '005930',
  name: '삼성전자',
  side: 'BUY',
  orderType: 'LIMIT',
  timeInForce: 'DAY',
  loc: false,
  status: 'PARTIAL_FILLED',
  currency: 'KRW',
  price: 70000,
  quantity: 10,
  filledQuantity: 3,
  remainingQuantity: 7,
  orderedAt: '2026-10-22T09:30:00+09:00',
  cancelable: true,
  modifiable: true,
  ...overrides,
});

const usOrder = (overrides: Partial<TossOpenOrder> = {}): TossOpenOrder =>
  krOrder({
    orderId: 'o-2',
    symbol: 'AAPL',
    name: '애플',
    currency: 'USD',
    price: 185.5,
    quantity: 3,
    filledQuantity: 0,
    remainingQuantity: 3,
    ...overrides,
  });

const orderable = (overrides: Partial<TossOrderable> = {}): TossOrderable => ({
  symbol: '005930',
  name: '삼성전자',
  marketCountry: 'KR',
  currency: 'KRW',
  securityType: 'STOCK',
  locSupported: false,
  lastPrice: 70500,
  upperLimitPrice: 91000,
  lowerLimitPrice: 49000,
  cashBuyingPower: 5_000_000,
  sellableQuantity: null,
  holdingQuantity: null,
  averagePurchasePrice: null,
  sellCostRate: null,
  commissionRate: null,
  ...overrides,
});

const usOrderable = (): TossOrderable =>
  orderable({
    symbol: 'AAPL',
    name: '애플',
    marketCountry: 'US',
    currency: 'USD',
    locSupported: true,
    lastPrice: 186,
    upperLimitPrice: null,
    lowerLimitPrice: null,
  });

beforeEach(() => {
  vi.mocked(api.getTossOrderable).mockReset();
  vi.mocked(api.modifyTossOrder).mockReset();
  vi.mocked(api.getTossOrderable).mockResolvedValue(orderable());
  vi.mocked(api.modifyTossOrder).mockResolvedValue({ orderId: 'o-new' });
});

const renderSheet = (order: TossOpenOrder = krOrder()) => {
  const onModified = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <TossOrderModifySheet open onOpenChange={onOpenChange} owner="ME" order={order} onModified={onModified} />
  );
  return { onModified, onOpenChange };
};

/** 확인 단계로 넘어가 제출 잠금이 풀릴 때까지 기다린 뒤 정정을 보낸다. */
const confirmAndSubmit = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.click(screen.getByRole('button', { name: '정정 확인' }));
  await waitFor(() => expect(screen.getByRole('button', { name: '정정하기' })).toBeEnabled());
  await user.click(screen.getByRole('button', { name: '정정하기' }));
};

describe('입력', () => {
  it('원주문 가격과 미체결 잔량으로 시작한다', async () => {
    // 정정은 "지금 걸려 있는 주문"에서 출발한다. 현재가로 채우면 의도와 다른 가격으로 정정하기 쉽다.
    renderSheet();

    expect(await screen.findByLabelText('정정 가격')).toHaveValue('70000');
    expect(screen.getByLabelText('정정 수량')).toHaveValue('7');
    expect(screen.getByText(/원주문 ₩70,000 · 미체결 7주/)).toBeInTheDocument();
  });

  it('미국 주식은 수량 입력 없이 가격만 정정한다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(usOrderable());
    renderSheet(usOrder());

    expect(await screen.findByLabelText('정정 가격')).toHaveValue('185.5');
    expect(screen.queryByLabelText('정정 수량')).not.toBeInTheDocument();
    expect(screen.getByText('미국 주식은 가격만 정정할 수 있어요')).toBeInTheDocument();
  });

  it('시장가로 바꾸면 가격 입력이 사라진다', async () => {
    const user = userEvent.setup();
    renderSheet();
    await screen.findByLabelText('정정 가격');

    await user.click(screen.getByRole('radio', { name: '시장가' }));

    expect(screen.queryByLabelText('정정 가격')).not.toBeInTheDocument();
  });

  it('LOC 주문은 호가 유형을 바꿀 수 없다', async () => {
    // LOC 은 지정가 + 종가 조건이다. 시장가로 바꾸면 LOC 이 아니게 되어 토스가 받지 않는다.
    vi.mocked(api.getTossOrderable).mockResolvedValue(usOrderable());
    renderSheet(usOrder({ loc: true, timeInForce: 'CLS' }));
    await screen.findByLabelText('정정 가격');

    expect(screen.queryByRole('radio', { name: '시장가' })).not.toBeInTheDocument();
  });

  it('국내 정정 수량은 정수만 받는다', async () => {
    const user = userEvent.setup();
    renderSheet();
    const quantityInput = await screen.findByLabelText('정정 수량');

    await user.clear(quantityInput);
    await user.type(quantityInput, '1.5');

    expect(quantityInput).toHaveValue('15');
  });

  it('가격 스테퍼는 호가 단위로 움직인다', async () => {
    // 50,000~200,000원 구간의 호가 단위는 100원이다.
    const user = userEvent.setup();
    renderSheet();
    await screen.findByLabelText('정정 가격');

    await user.click(screen.getByRole('button', { name: '가격 올리기' }));

    expect(screen.getByLabelText('정정 가격')).toHaveValue('70100');
  });

  it('가격이나 수량이 비면 확인으로 넘어갈 수 없다', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.clear(await screen.findByLabelText('정정 수량'));

    expect(screen.getByRole('button', { name: '정정 확인' })).toBeDisabled();
  });
});

describe('확인과 제출', () => {
  it('확인 단계를 거치지 않고는 정정이 나가지 않는다', async () => {
    renderSheet();
    await screen.findByLabelText('정정 가격');

    expect(screen.queryByRole('button', { name: '정정하기' })).not.toBeInTheDocument();
    expect(api.modifyTossOrder).not.toHaveBeenCalled();
  });

  it('확인 화면에 바뀌기 전과 후를 함께 보여준다', async () => {
    const user = userEvent.setup();
    renderSheet();
    const priceInput = await screen.findByLabelText('정정 가격');
    await user.clear(priceInput);
    await user.type(priceInput, '71000');

    await user.click(screen.getByRole('button', { name: '정정 확인' }));

    expect(screen.getByText('₩70,000 → ₩71,000')).toBeInTheDocument();
    expect(screen.getByText('7주 → 7주')).toBeInTheDocument();
  });

  it('국내 정정은 유형·수량·가격을 실어 보내고, 끝나면 시트를 닫는다', async () => {
    const user = userEvent.setup();
    const { onModified, onOpenChange } = renderSheet();
    const priceInput = await screen.findByLabelText('정정 가격');
    await user.clear(priceInput);
    await user.type(priceInput, '71000');
    const quantityInput = screen.getByLabelText('정정 수량');
    await user.clear(quantityInput);
    await user.type(quantityInput, '5');

    await confirmAndSubmit(user);

    await waitFor(() =>
      expect(api.modifyTossOrder).toHaveBeenCalledWith('o-1', {
        owner: 'ME',
        symbol: '005930',
        orderType: 'LIMIT',
        quantity: '5',
        price: '71000',
        confirmHighValueOrder: false,
      })
    );
    expect(onModified).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('미국 정정은 수량을 보내지 않는다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(usOrderable());
    const user = userEvent.setup();
    renderSheet(usOrder());
    await screen.findByLabelText('정정 가격');

    await confirmAndSubmit(user);

    await waitFor(() => expect(api.modifyTossOrder).toHaveBeenCalled());
    expect(vi.mocked(api.modifyTossOrder).mock.calls[0][1]).not.toHaveProperty('quantity');
    expect(vi.mocked(api.modifyTossOrder).mock.calls[0][1]).toMatchObject({ price: '185.5', orderType: 'LIMIT' });
  });

  it('시장가 정정은 가격을 보내지 않는다', async () => {
    const user = userEvent.setup();
    renderSheet();
    await screen.findByLabelText('정정 가격');
    await user.click(screen.getByRole('radio', { name: '시장가' }));

    await confirmAndSubmit(user);

    await waitFor(() => expect(api.modifyTossOrder).toHaveBeenCalled());
    expect(vi.mocked(api.modifyTossOrder).mock.calls[0][1]).not.toHaveProperty('price');
    expect(vi.mocked(api.modifyTossOrder).mock.calls[0][1]).toMatchObject({ orderType: 'MARKET', quantity: '7' });
  });

  it('1억원 이상으로 정정하면 금액 확인을 받아야 보낼 수 있다', async () => {
    // 1,500주 × ₩71,000 = ₩106,500,000
    const user = userEvent.setup();
    renderSheet();
    const priceInput = await screen.findByLabelText('정정 가격');
    await user.clear(priceInput);
    await user.type(priceInput, '71000');
    const quantityInput = screen.getByLabelText('정정 수량');
    await user.clear(quantityInput);
    await user.type(quantityInput, '1500');
    await user.click(screen.getByRole('button', { name: '정정 확인' }));

    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(screen.getByRole('button', { name: '정정하기' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: '금액을 확인했습니다' }));
    await user.click(screen.getByRole('button', { name: '정정하기' }));

    await waitFor(() =>
      expect(api.modifyTossOrder).toHaveBeenCalledWith('o-1', expect.objectContaining({ confirmHighValueOrder: true }))
    );
  });

  it('정정이 거부되면 시트를 닫지 않고 이유를 보여준다', async () => {
    vi.mocked(api.modifyTossOrder).mockRejectedValue(
      new Error('이미 체결·취소·정정된 주문입니다. 미체결 주문을 새로고침해 확인해주세요.')
    );
    const user = userEvent.setup();
    const { onModified, onOpenChange } = renderSheet();
    await screen.findByLabelText('정정 가격');

    await confirmAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 체결·취소·정정된 주문입니다');
    expect(onModified).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
