import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TossStockSearchResult } from '@/types/tossStock';

/**
 * 종목 검색 시트.
 *
 * 서버가 유니버스를 들고 있어 이 호출에는 외부 API 왕복이 없지만, 디바운스는 그대로 필요하다 —
 * 절약이 아니라 **순서** 때문이다. 요청을 연달아 보내면 `삼`의 응답이 `삼성전자`의 응답보다
 * 늦게 도착해 화면이 되감긴다.
 */

vi.mock('@/lib/api', () => ({
  api: { searchTossStocks: vi.fn() },
}));

const { api } = await import('@/lib/api');
const TossStockSearchSheet = (await import('@/components/tossStock/TossStockSearchSheet')).default;

const stock = (overrides: Partial<TossStockSearchResult> = {}): TossStockSearchResult => ({
  symbol: '005930',
  name: '삼성전자',
  market: 'KOSPI',
  marketCountry: 'KR',
  currency: 'KRW',
  securityType: 'STOCK',
  locSupported: false,
  ...overrides,
});

beforeEach(() => {
  vi.mocked(api.searchTossStocks).mockReset();
  vi.mocked(api.searchTossStocks).mockResolvedValue([stock()]);
});

const renderSheet = (onSelect = vi.fn()) => {
  render(<TossStockSearchSheet open onOpenChange={vi.fn()} onSelect={onSelect} />);
  return { onSelect, input: screen.getByRole('searchbox', { name: '종목 검색' }) };
};

describe('TossStockSearchSheet', () => {
  it('두 글자 미만은 검색하지 않는다', async () => {
    const user = userEvent.setup();
    const { input } = renderSheet();

    await user.type(input, '삼');

    // 한 글자 질의는 결과가 너무 넓어(수백 건) 사용자에게 쓸모가 없다.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(api.searchTossStocks).not.toHaveBeenCalled();
  });

  it('연속으로 입력해도 요청은 한 번만 나간다', async () => {
    const user = userEvent.setup();
    const { input } = renderSheet();

    await user.type(input, '삼성전자');
    await screen.findByRole('option');

    expect(api.searchTossStocks).toHaveBeenCalledTimes(1);
    expect(api.searchTossStocks).toHaveBeenCalledWith('삼성전자');
  });

  it('검색 결과에 종목명과 코드를 보여준다', async () => {
    const user = userEvent.setup();
    const { input } = renderSheet();

    await user.type(input, '삼성');

    const option = await screen.findByRole('option');
    expect(option).toHaveTextContent('삼성전자');
    expect(option).toHaveTextContent('005930');
  });

  it('결과를 고르면 종목 정보를 그대로 전달한다', async () => {
    const user = userEvent.setup();
    const { onSelect, input } = renderSheet();

    await user.type(input, '삼성');
    await user.click(await screen.findByRole('option'));

    // 주문 시트가 LOC 노출 여부를 정하려면 marketCountry·locSupported 가 함께 넘어가야 한다.
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: '005930', marketCountry: 'KR', locSupported: false })
    );
  });

  it('질의를 지우면 이전 결과가 남지 않는다', async () => {
    const user = userEvent.setup();
    const { input } = renderSheet();

    await user.type(input, '삼성');
    await screen.findByRole('option');

    await user.clear(input);

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('결과가 없으면 검색 결과 없음을 알린다', async () => {
    vi.mocked(api.searchTossStocks).mockResolvedValue([]);
    const user = userEvent.setup();
    const { input } = renderSheet();

    await user.type(input, '없는종목');

    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('검색에 실패하면 빈 결과가 아니라 실패를 알린다', async () => {
    // 유니버스가 아직 준비되지 않았을 수 있다(부팅 직후). "결과 없음"으로 뭉뚱그리면
    // 사용자는 그런 종목이 없는 줄 안다.
    vi.mocked(api.searchTossStocks).mockRejectedValue(new Error('준비 중'));
    const user = userEvent.setup();
    const { input } = renderSheet();

    await user.type(input, '삼성');

    expect(await screen.findByText(/다시 시도해주세요/)).toBeInTheDocument();
  });

  it('미국 종목은 US 배지로 구분된다', async () => {
    vi.mocked(api.searchTossStocks).mockResolvedValue([
      stock({ symbol: 'AAPL', name: '애플', market: 'NASDAQ', marketCountry: 'US', currency: 'USD', locSupported: true }),
    ]);
    const user = userEvent.setup();
    const { input } = renderSheet();

    await user.type(input, 'AAPL');

    expect(await screen.findByRole('option')).toHaveTextContent('US');
  });
});
