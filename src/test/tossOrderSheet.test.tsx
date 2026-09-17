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
  holdingQuantity: null,
  averagePurchasePrice: null,
  sellCostRate: null,
  ...overrides,
});

/** 보유 중인 종목: 100주, 평단 65,000원. 현재가 70,000원이 가격에 자동으로 채워진다. */
const heldOrderable = (overrides: Partial<TossOrderable> = {}): TossOrderable =>
  orderable({ holdingQuantity: 100, averagePurchasePrice: 65000, sellableQuantity: 100, ...overrides });

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

describe('보유 종목 예상값', () => {
  it('보유하지 않은 종목에는 평균단가 관련 행을 그리지 않는다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');
    await user.type(screen.getByLabelText('주문 수량'), '10');

    expect(screen.queryByText('보유 평균단가')).not.toBeInTheDocument();
    expect(screen.queryByText('매수 후 예상 평균단가')).not.toBeInTheDocument();
    expect(screen.queryByText('예상 손익')).not.toBeInTheDocument();
  });

  it('보유 종목을 매수하면 평균단가와 매수 후 예상 평균단가를 보여준다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(heldOrderable());
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');

    // 입력 전에는 평단만 보이고 예상값은 비어 있다.
    expect(await screen.findByText('보유 평균단가')).toBeInTheDocument();
    expect(screen.getByText('₩65,000')).toBeInTheDocument();
    expect(screen.getByText('매수 후 예상 평균단가')).toBeInTheDocument();

    // (65,000 × 100 + 70,000 × 50) / 150 = 66,667
    await user.type(screen.getByLabelText('주문 수량'), '50');
    expect(screen.getByText('₩66,667')).toBeInTheDocument();
  });

  it('보유 종목을 매도하면 평균단가와 예상 손익·수익률을 보여준다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(heldOrderable());
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');
    await user.click(screen.getByRole('radio', { name: '매도' }));
    await screen.findByText('보유 평균단가');

    // (70,000 − 65,000) × 10 = +50,000, 5,000 / 65,000 = +7.69%
    await user.type(screen.getByLabelText('주문 수량'), '10');
    expect(screen.getByText('예상 손익')).toBeInTheDocument();
    expect(screen.getByText('+₩50,000 (+7.69%)')).toBeInTheDocument();
    expect(screen.queryByText('매수 후 예상 평균단가')).not.toBeInTheDocument();
    // 비용률이 없으면 세후 행은 그리지 않고 제외 사실만 적는다.
    expect(screen.queryByText('세후 예상 손익')).not.toBeInTheDocument();
    expect(screen.getByText('수수료·세금 제외')).toBeInTheDocument();
  });

  it('비용률이 있으면 수수료·세금을 뺀 세후 예상 손익도 보여준다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(heldOrderable({ sellCostRate: 0.00165 }));
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');
    await user.click(screen.getByRole('radio', { name: '매도' }));
    await screen.findByText('보유 평균단가');

    // 매도금액 700,000 × 0.00165 = 1,155 → 50,000 − 1,155 = 48,845, / 650,000 = +7.51%
    await user.type(screen.getByLabelText('주문 수량'), '10');
    expect(screen.getByText('+₩50,000 (+7.69%)')).toBeInTheDocument();
    expect(screen.getByText('세후 예상 손익')).toBeInTheDocument();
    expect(screen.getByText('+₩48,845 (+7.51%)')).toBeInTheDocument();
    expect(screen.getByText(/수수료·세금 약 ₩1,155/)).toBeInTheDocument();
    expect(screen.queryByText('수수료·세금 제외')).not.toBeInTheDocument();
  });

  it('시장가에서는 예상 평균단가·예상 손익을 그리지 않는다 — 체결가를 모른다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(heldOrderable());
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByText('보유 평균단가');
    await user.click(screen.getByRole('radio', { name: '시장가' }));
    await user.type(screen.getByLabelText('주문 수량'), '10');

    expect(screen.getByText('보유 평균단가')).toBeInTheDocument();
    expect(screen.queryByText('매수 후 예상 평균단가')).not.toBeInTheDocument();
    expect(screen.queryByText('예상 손익')).not.toBeInTheDocument();
  });

  it('확인 화면에도 같은 예상값을 보여준다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(heldOrderable());
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByText('보유 평균단가');
    await fillAndConfirm(user, '50');

    expect(screen.getByText('매수 후 예상 평균단가')).toBeInTheDocument();
    expect(screen.getByText('₩66,667')).toBeInTheDocument();
  });

  it('미국 종목은 달러로 표시한다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(
      heldOrderable({
        symbol: 'AAPL',
        marketCountry: 'US',
        currency: 'USD',
        locSupported: true,
        lastPrice: 200,
        upperLimitPrice: null,
        lowerLimitPrice: null,
        holdingQuantity: 1.5,
        averagePurchasePrice: 150,
      })
    );
    const user = userEvent.setup();
    renderSheet(usTarget);
    await screen.findByText('보유 평균단가');

    // (150 × 1.5 + 200 × 0.5) / 2 = 162.5
    await user.type(screen.getByLabelText('주문 수량'), '0.5');
    expect(screen.getByText('$162.50')).toBeInTheDocument();
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

describe('입력 제한', () => {
  const usOrderable = () =>
    orderable({
      symbol: 'AAPL',
      marketCountry: 'US',
      currency: 'USD',
      locSupported: true,
      lastPrice: 200,
      upperLimitPrice: null,
      lowerLimitPrice: null,
    });

  it('가격 입력은 숫자만 받는다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    const priceInput = await screen.findByLabelText('주문 가격');

    await user.clear(priceInput);
    await user.type(priceInput, '7a0,0-0e0');

    expect(priceInput).toHaveValue('70000');
  });

  it('국내 종목 가격은 소수점을 받지 않는다 — 원화 호가는 정수다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    const priceInput = await screen.findByLabelText('주문 가격');

    await user.clear(priceInput);
    await user.type(priceInput, '700.5');

    expect(priceInput).toHaveValue('7005');
  });

  it('미국 종목 가격은 소수점 넷째 자리까지만 받는다 — 1달러 미만 호가 단위가 0.0001 이다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(usOrderable());
    const user = userEvent.setup();
    renderSheet(usTarget);
    const priceInput = await screen.findByLabelText('주문 가격');

    await user.clear(priceInput);
    await user.type(priceInput, '0.123456');

    expect(priceInput).toHaveValue('0.1234');
  });

  it('수량 입력은 숫자만 받는다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');
    const quantityInput = screen.getByLabelText('주문 수량');

    await user.type(quantityInput, '1a0.5');

    expect(quantityInput).toHaveValue('105');
  });

  it('가격과 수량 입력은 자릿수 상한이 있다', async () => {
    const user = userEvent.setup();
    renderSheet(krTarget);
    const priceInput = await screen.findByLabelText('주문 가격');
    const quantityInput = screen.getByLabelText('주문 수량');

    expect(priceInput).toHaveAttribute('maxlength', '12');
    expect(quantityInput).toHaveAttribute('maxlength', '12');

    await user.clear(priceInput);
    await user.type(priceInput, '1234567890123456');
    await user.type(quantityInput, '1234567890123456');

    expect(priceInput).toHaveValue('123456789012');
    expect(quantityInput).toHaveValue('123456789012');
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

describe('소수점 수량', () => {
  const usOrderable = (overrides: Partial<TossOrderable> = {}) =>
    orderable({
      symbol: 'AAPL',
      name: '애플',
      marketCountry: 'US',
      currency: 'USD',
      locSupported: true,
      lastPrice: 200,
      cashBuyingPower: 1000,
      ...overrides,
    });

  it('미국 종목은 소수점 수량을 입력해 그대로 주문한다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(usOrderable());
    const user = userEvent.setup();
    renderSheet(usTarget);
    await screen.findByLabelText('주문 가격');

    const quantityInput = screen.getByLabelText('주문 수량');
    expect(quantityInput).toHaveAttribute('inputmode', 'decimal');
    await user.type(quantityInput, '1.5');
    expect(quantityInput).toHaveValue('1.5');

    await user.click(screen.getByRole('button', { name: '매수 확인' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '주문하기' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: '주문하기' }));

    await waitFor(() =>
      expect(api.placeTossOrder).toHaveBeenCalledWith(expect.objectContaining({ quantity: '1.5' }))
    );
  });

  it('미국 종목의 소수점 수량은 여섯째 자리까지만 받는다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(usOrderable());
    const user = userEvent.setup();
    renderSheet(usTarget);
    await screen.findByLabelText('주문 가격');

    const quantityInput = screen.getByLabelText('주문 수량');
    await user.type(quantityInput, '1.23456789');

    expect(quantityInput).toHaveValue('1.234567');
  });

  it('소수점을 두 번 찍어도 하나만 남는다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(usOrderable());
    const user = userEvent.setup();
    renderSheet(usTarget);
    await screen.findByLabelText('주문 가격');

    const quantityInput = screen.getByLabelText('주문 수량');
    await user.type(quantityInput, '1.2.5');

    expect(quantityInput).toHaveValue('1.25');
  });

  it('국내 종목은 소수점을 입력해도 정수만 남는다', async () => {
    // 토스는 국내 종목에 소수점 수량을 받지 않는다. 서버에서 400 을 받기 전에 입력 단계에서 막는다.
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');

    const quantityInput = screen.getByLabelText('주문 수량');
    expect(quantityInput).toHaveAttribute('inputmode', 'numeric');
    await user.type(quantityInput, '1.5');

    expect(quantityInput).toHaveValue('15');
  });

  it('미국 종목 매도의 최대 버튼은 보유 소수점 수량을 그대로 채운다', async () => {
    // 내림해 버리면 0.7주 보유자는 "최대"를 눌러도 0주가 되어 전량 매도를 할 수 없다.
    vi.mocked(api.getTossOrderable).mockResolvedValue(usOrderable({ sellableQuantity: 2.345 }));
    const user = userEvent.setup();
    renderSheet(usTarget);
    await screen.findByLabelText('주문 가격');

    await user.click(screen.getByRole('radio', { name: '매도' }));
    await user.click(screen.getByRole('button', { name: '최대' }));

    expect(screen.getByLabelText('주문 수량')).toHaveValue('2.345');
  });

  it('미국 종목 매수의 최대 버튼은 주문가능금액을 소수점 수량으로 채운다', async () => {
    // $1,000 ÷ $200 = 5 지만 $1,000 ÷ $300 = 3.333333… 이므로 여섯째 자리에서 내린다.
    vi.mocked(api.getTossOrderable).mockResolvedValue(usOrderable({ lastPrice: 300 }));
    const user = userEvent.setup();
    renderSheet(usTarget);
    await screen.findByLabelText('주문 가격');

    await user.click(screen.getByRole('button', { name: '최대' }));

    expect(screen.getByLabelText('주문 수량')).toHaveValue('3.333333');
  });

  it('국내 종목 매도의 최대 버튼은 정수로 내린다', async () => {
    vi.mocked(api.getTossOrderable).mockResolvedValue(orderable({ sellableQuantity: 12.9 }));
    const user = userEvent.setup();
    renderSheet(krTarget);
    await screen.findByLabelText('주문 가격');

    await user.click(screen.getByRole('radio', { name: '매도' }));
    await user.click(screen.getByRole('button', { name: '최대' }));

    expect(screen.getByLabelText('주문 수량')).toHaveValue('12');
  });
});
