import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { TossOpenOrder } from '@/types/tossStock';
import TossOpenOrdersSection from '@/components/tossStock/TossOpenOrdersSection';

/**
 * 미체결 주문 섹션.
 *
 * 주문을 낼 수 있게 된 이상, 낸 것이 살아 있는지 정확히 보여야 한다 —
 * 여기가 틀리면 사용자는 같은 주문을 한 번 더 낸다.
 */

const order = (overrides: Partial<TossOpenOrder> = {}): TossOpenOrder => ({
  orderId: 'o-1',
  symbol: '005930',
  name: '삼성전자',
  side: 'BUY',
  orderType: 'LIMIT',
  timeInForce: 'DAY',
  loc: false,
  status: 'PENDING',
  currency: 'KRW',
  price: 70000,
  quantity: 10,
  filledQuantity: 0,
  remainingQuantity: 10,
  orderedAt: '2026-09-07T09:30:00+09:00',
  cancelable: true,
  ...overrides,
});

const renderSection = (orders: TossOpenOrder[], cancelingOrderId: string | null = null) => {
  const onCancel = vi.fn();
  render(
    <TossOpenOrdersSection orders={orders} onCancel={onCancel} cancelingOrderId={cancelingOrderId} />
  );
  return { onCancel };
};

describe('TossOpenOrdersSection', () => {
  it('미체결이 없으면 섹션 자체를 그리지 않는다', () => {
    // 빈 카드가 상시로 자리를 차지하면 정작 주문이 걸렸을 때의 신호가 묻힌다.
    renderSection([]);

    expect(screen.queryByRole('region', { name: '미체결 주문' })).not.toBeInTheDocument();
  });

  it('건수를 머리글에 보여준다', () => {
    renderSection([order(), order({ orderId: 'o-2' })]);

    expect(screen.getByRole('button', { name: /미체결 주문 2건/ })).toBeInTheDocument();
  });

  it('매수·매도와 종목명, 수량, 가격을 보여준다', () => {
    renderSection([order()]);

    expect(screen.getByText('매수')).toBeInTheDocument();
    expect(screen.getByText('삼성전자')).toBeInTheDocument();
    expect(screen.getByText(/10주 · ₩70,000/)).toBeInTheDocument();
  });

  it('부분 체결은 몇 주 중 몇 주가 체결됐는지 보여준다', () => {
    renderSection([order({ status: 'PARTIAL_FILLED', filledQuantity: 3, remainingQuantity: 7 })]);

    expect(screen.getByText(/10주 중 3주 체결/)).toBeInTheDocument();
  });

  it('LOC 주문은 배지로 구분한다', () => {
    renderSection([order({ loc: true, timeInForce: 'CLS' })]);

    expect(screen.getByText('LOC')).toBeInTheDocument();
  });

  it('시장가 주문은 가격을 그리지 않는다', () => {
    // 0 으로 채워 그리면 "0원에 주문"으로 읽힌다.
    renderSection([order({ orderType: 'MARKET', price: null })]);

    expect(screen.getByText('10주')).toBeInTheDocument();
    expect(screen.queryByText(/₩0/)).not.toBeInTheDocument();
  });

  it('취소는 확인 단계를 거친 뒤에만 실행된다', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderSection([order()]);

    await user.click(screen.getByRole('button', { name: '취소' }));

    // 다이얼로그가 열렸을 뿐 아직 아무것도 취소되지 않았다.
    expect(screen.getByText('주문을 취소할까요?')).toBeInTheDocument();
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '주문 취소' }));

    expect(onCancel).toHaveBeenCalledWith('o-1');
  });

  it('확인 다이얼로그에서 닫으면 취소하지 않는다', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderSection([order()]);

    await user.click(screen.getByRole('button', { name: '취소' }));
    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('이미 취소 요청이 나간 주문에는 취소 버튼을 그리지 않는다', () => {
    renderSection([order({ status: 'PENDING_CANCEL', cancelable: false })]);

    expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument();
    expect(screen.getByText('취소 요청됨')).toBeInTheDocument();
  });

  it('취소 진행 중에는 버튼을 잠근다', () => {
    renderSection([order()], 'o-1');

    expect(screen.getByRole('button', { name: '취소 중' })).toBeDisabled();
  });
});
