import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TossOrderable } from '@/types/tossStock';
import type { TossOrderTarget } from '@/components/tossStock/TossOrderSheet';

/**
 * 주문 시트.
 *
 * 이 화면은 돈을 움직인다. 그래서 여기 테스트가 지키는 것은 대부분 "일어나면 안 되는 일"이다 —
 * 국내 종목에 LOC 이 뜨는 것, 확인 없이 주문이 나가는 것, 한 번의 조작이 두 건이 되는 것.
 */

vi.mock('@/lib/api', () => ({
  api: {
    getTossOrderable: vi.fn(),
    placeTossOrder: vi.fn(),
  },
}));

const { api } = await import('@/lib/api');
const TossOrderSheet = (await import('@/components/tossStock/TossOrderSheet')).default;

const krTarget: TossOrderTarget = {
  symbol: '005930',
  name: '삼성전자',
  marketCountry: 'KR',
  securityType: 'STOCK',
  locSupported: false,
};

const usTarget: TossOrderTarget = {
  symbol: 'AAPL',
  name: '애플',
  marketCountry: 'US',
  securityType: 'STOCK',
  locSupported: true,
};

const orderable = (overrides: Partial<TossOrderable> = {}): TossOrderable => ({
  symbol: '005930',
  name: '삼성전자',
  marketCountry: 'KR',
  currency: 'KRW',
  securityType: 'STOCK',
  locSupported: false,
  lastPrice: 70000,
  upperLimitPrice: 91000,
  lowerLimitPrice: 49000,
  cashBuyingPower: 5_000_000,
  sellableQuantity: null,
  ...overrides,
});

beforeEach(() => {
  vi.mocked(api.getTossOrderable).mockReset();
  vi.mocked(api.placeTossOrder).mockReset();
  vi.mocked(api.getTossOrderable).mockResolvedValue(orderable());
  vi.mocked(api.placeTossOrder).mockResolvedValue({ orderId: 'o-1', clientOrderId: 'k-1' });
});

const renderSheet = (target: TossOrderTarget = krTarget, onOrderPlaced = vi.fn()) => {
  render(
    <TossOrderSheet
      open
      onOpenChange={vi.fn()}
      owner="ME"
      target={target}
      initialSide="BUY"
      onOrderPlaced={onOrderPlaced}
    />
  );
  return { onOrderPlaced };
};

/** 폼을 채우고 확인 단계까지 넘어간다. */
const fillAndConfirm = async (user: ReturnType<typeof userEvent.setup>, quantity = '10') => {
  await screen.findByLabelText('주문 가격');
  await user.type(screen.getByLabelText('주문 수량'), quantity);
  await user.click(screen.getByRole('button', { name: '매수 확인' }));
};

describe('주문 유형', () => {
  it('국내 종목에는 LOC 선택지를 그리지 않는다', async () => {
    // 토스는 종가 주문(CLS)을 미국 지정가에만 허용한다. 비활성이 아니라 아예 없어야 한다 —
    // 보이면 눌러 보게 되고, 눌러 보면 토스가 400 을 준다.
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');

    expect(screen.queryByRole('radio', { name: 'LOC' })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '지정가' })).toBeInTheDocument();
  });

  it('미국 종목에는 LOC 선택지를 그린다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(
      orderable({ symbol: 'AAPL', name: '애플', marketCountry: 'US', currency: 'USD', locSupported: true })
    );
    renderSheet(usTarget);

    expect(await screen.findByRole('radio', { name: 'LOC' })).toBeInTheDocument();
  });

  it('시장가를 고르면 가격 입력이 사라진다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');

    await user.click(screen.getByRole('radio', { name: '시장가' }));

    expect(screen.queryByLabelText('주문 가격')).not.toBeInTheDocument();
  });

  it('LOC 주문은 CLS 유효조건으로 나간다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(
      orderable({ symbol: 'AAPL', name: '애플', marketCountry: 'US', currency: 'USD', locSupported: true, lastPrice: 185.5 })
    );
    const user = userEvent.setup();
    renderSheet(usTarget);

    await user.click(await screen.findByRole('radio', { name: 'LOC' }));
    await fillAndConfirm(user);
    await waitFor(() => expect(screen.getByRole('button', { name: '주문하기' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: '주문하기' }));

    await waitFor(() =>
      expect(api.placeTossOrder).toHaveBeenCalledWith(
        expect.objectContaining({ orderType: 'LIMIT', timeInForce: 'CLS' })
      )
    );
  });
});

describe('입력 검증', () => {
  it('수량이 없으면 확인 단계로 넘어갈 수 없다', async () => {
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');

    expect(screen.getByRole('button', { name: '매수 확인' })).toBeDisabled();
  });

  it('현재가를 가격 입력의 출발점으로 채운다', async () => {
    renderSheet(krTarget);

    expect(await screen.findByLabelText('주문 가격')).toHaveValue('70000');
  });

  it('가격을 지우면 다시 채워 넣지 않는다', async () => {
    // 자동 채움이 "비어 있으면 채운다"였을 때는, 다른 가격을 넣으려고 지우는 순간 곧바로
    // 현재가가 되돌아와 지울 수조차 없었다. 자동 채움은 편의이지 규칙이 아니다.
    const user = userEvent.setup();
    renderSheet(krTarget);
    const priceInput = await screen.findByLabelText('주문 가격');

    await user.clear(priceInput);

    expect(priceInput).toHaveValue('');
  });

  it('지운 뒤 직접 입력한 가격이 그대로 유지된다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    const priceInput = await screen.findByLabelText('주문 가격');

    await user.clear(priceInput);
    await user.type(priceInput, '68000');

    expect(priceInput).toHaveValue('68000');
  });

  it('가격을 비운 채 스테퍼를 누르면 현재가를 기준으로 삼는다', async () => {
    // 0 에서 한 칸(국내 1원)이 되면 아무 쓸모가 없다. 현재가로 돌아올 길을 남긴다.
    const user = userEvent.setup();
    renderSheet(krTarget);
    const priceInput = await screen.findByLabelText('주문 가격');
    await user.clear(priceInput);

    await user.click(screen.getByRole('button', { name: '가격 올리기' }));

    expect(priceInput).toHaveValue('70100');
  });

  it('종목이 같으면 매수/매도를 바꿔도 입력한 가격을 유지한다', async () => {
    // 매수↔매도 전환은 주문가능정보를 다시 받는다. 그때 가격이 현재가로 되돌아가면 안 된다.
    const user = userEvent.setup();
    renderSheet(krTarget);
    const priceInput = await screen.findByLabelText('주문 가격');
    await user.clear(priceInput);
    await user.type(priceInput, '68000');

    await user.click(screen.getByRole('radio', { name: '매도' }));

    expect(await screen.findByLabelText('주문 가격')).toHaveValue('68000');
  });

  it('가격 스테퍼는 호가 단위만큼 움직인다', async () => {
    // 7만원 구간의 호가 단위는 100원이다.
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');

    await user.click(screen.getByRole('button', { name: '가격 올리기' }));

    expect(screen.getByLabelText('주문 가격')).toHaveValue('70100');
  });

  it('예상 주문금액을 수량 × 가격으로 보여준다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');

    await user.type(screen.getByLabelText('주문 수량'), '10');

    expect(screen.getByText('₩700,000')).toBeInTheDocument();
  });
});

describe('확인 단계', () => {
  it('확인 단계를 거치지 않고는 주문이 나가지 않는다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');
    await user.type(screen.getByLabelText('주문 수량'), '10');

    // 폼 단계에는 제출 버튼 자체가 없다.
    expect(screen.queryByRole('button', { name: '주문하기' })).not.toBeInTheDocument();
    expect(api.placeTossOrder).not.toHaveBeenCalled();
  });

  it('확인 화면에 종목·구분·유형·수량·가격을 모두 보여준다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    await fillAndConfirm(user);

    expect(screen.getByText('삼성전자 (005930)')).toBeInTheDocument();
    expect(screen.getByText('매수')).toBeInTheDocument();
    expect(screen.getByText('지정가')).toBeInTheDocument();
    expect(screen.getByText('10주')).toBeInTheDocument();
  });

  it('확인 화면에 들어온 직후에는 제출을 잠가 둔다', async () => {
    // "확인"을 누른 손가락이 같은 자리의 "주문하기"에 그대로 떨어지는 사고를 막는다.
    const user = userEvent.setup();
    renderSheet(krTarget);
    await fillAndConfirm(user);

    expect(screen.getByRole('button', { name: '주문하기' })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole('button', { name: '주문하기' })).toBeEnabled(), {
      timeout: 2000,
    });
  });

  it('뒤로 가면 입력을 그대로 유지한다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    await fillAndConfirm(user);

    await user.click(screen.getByRole('button', { name: '뒤로' }));

    expect(screen.getByLabelText('주문 수량')).toHaveValue('10');
  });
});

describe('고액 주문', () => {
  it('1억원 이상이면 확인 체크박스 없이 제출할 수 없다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    // 70,000 × 2,000 = 1억 4천만원
    await fillAndConfirm(user, '2000');

    expect(screen.getByText('1억원 이상 주문입니다.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: '주문하기' })).toBeDisabled());
  });

  it('체크하면 confirmHighValueOrder=true 로 주문한다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    await fillAndConfirm(user, '2000');

    await user.click(screen.getByLabelText('금액을 확인했습니다'));
    await waitFor(() => expect(screen.getByRole('button', { name: '주문하기' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: '주문하기' }));

    await waitFor(() =>
      expect(api.placeTossOrder).toHaveBeenCalledWith(
        expect.objectContaining({ confirmHighValueOrder: true })
      )
    );
  });

  it('1억 미만 주문에는 확인 체크박스를 띄우지 않는다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    await fillAndConfirm(user, '10');

    expect(screen.queryByText('1억원 이상 주문입니다.')).not.toBeInTheDocument();
  });
});

describe('제출', () => {
  it('주문에 성공하면 상위에 알린다', async () => {
    const user = userEvent.setup();
    const { onOrderPlaced } = renderSheet(krTarget);
    await fillAndConfirm(user);
    await waitFor(() => expect(screen.getByRole('button', { name: '주문하기' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: '주문하기' }));

    await waitFor(() => expect(onOrderPlaced).toHaveBeenCalled());
  });

  it('멱등키를 실어 보낸다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    await fillAndConfirm(user);
    await waitFor(() => expect(screen.getByRole('button', { name: '주문하기' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: '주문하기' }));

    await waitFor(() => expect(api.placeTossOrder).toHaveBeenCalled());
    const request = vi.mocked(api.placeTossOrder).mock.calls[0][0];
    // 토스 제약: ^[a-zA-Z0-9\-_]+$, 최대 36자.
    expect(request.clientOrderId).toMatch(/^[a-zA-Z0-9\-_]{1,36}$/);
  });

  it('제출에 실패해도 시트를 닫지 않고 오류를 보여준다', async () => {
    // 입력을 잃으면 사용자가 처음부터 다시 쳐야 한다.
    vi.mocked(api.placeTossOrder).mockRejectedValue(new Error('주문 가능 금액이 부족합니다.'));
    const user = userEvent.setup();
    renderSheet(krTarget);
    await fillAndConfirm(user);
    await waitFor(() => expect(screen.getByRole('button', { name: '주문하기' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: '주문하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('주문 가능 금액이 부족합니다.');
    expect(screen.getByRole('button', { name: '주문하기' })).toBeInTheDocument();
  });

  it('서버가 금액 확인을 요구하면 체크박스를 드러낸다', async () => {
    // 우리 추정이 빗나가는 경우(USD 주문 등)를 위한 사후 경로다.
    vi.mocked(api.placeTossOrder).mockRejectedValue(
      new Error('1억원 이상 주문은 금액 확인이 필요합니다.')
    );
    const user = userEvent.setup();
    renderSheet(krTarget);
    await fillAndConfirm(user);
    await waitFor(() => expect(screen.getByRole('button', { name: '주문하기' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: '주문하기' }));

    expect(await screen.findByLabelText('금액을 확인했습니다')).toBeInTheDocument();
  });
});

describe('입력 지우기', () => {
  it('가격 지우기 버튼을 누르면 가격 입력이 비워진다', async () => {
    // 자동 채움된 현재가를 한 자리씩 지우게 두지 않는다.
    const user = userEvent.setup();
    renderSheet(krTarget);
    const priceInput = await screen.findByLabelText('주문 가격');

    await user.click(screen.getByRole('button', { name: '가격 지우기' }));

    expect(priceInput).toHaveValue('');
  });

  it('가격이 비어 있으면 지우기 버튼을 그리지 않는다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    const priceInput = await screen.findByLabelText('주문 가격');

    await user.clear(priceInput);

    expect(screen.queryByRole('button', { name: '가격 지우기' })).not.toBeInTheDocument();
  });

  it('수량 지우기 버튼을 누르면 수량 입력이 비워진다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');
    const quantityInput = screen.getByLabelText('주문 수량');
    await user.type(quantityInput, '10');

    await user.click(screen.getByRole('button', { name: '수량 지우기' }));

    expect(quantityInput).toHaveValue('');
  });

  it('수량이 비어 있으면 지우기 버튼을 그리지 않는다', async () => {
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');

    expect(screen.queryByRole('button', { name: '수량 지우기' })).not.toBeInTheDocument();
  });

  it('수량·가격 입력은 브라우저가 이전 입력값을 제안하지 않게 한다', async () => {
    // 남의 계좌 화면에서 내가 전에 넣은 수량이 자동완성으로 튀어나오면 오입력의 지름길이다.
    renderSheet(krTarget);

    expect(await screen.findByLabelText('주문 가격')).toHaveAttribute('autocomplete', 'off');
    expect(screen.getByLabelText('주문 수량')).toHaveAttribute('autocomplete', 'off');
  });
});
