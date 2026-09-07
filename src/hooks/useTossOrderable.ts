import { useCallback, useEffect, useState } from 'react';
import type { TossOrderSide, TossOrderable } from '@/types/tossStock';
import { api } from '@/lib/api';

export type TossOrderableStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface TossOrderableState {
  orderable: TossOrderable | null;
  status: TossOrderableStatus;
  reload: () => void;
}

/**
 * 주문 화면을 채울 값(현재가·상하한가·매수가능금액·매도가능수량).
 *
 * 서버가 네 개의 토스 엔드포인트를 하나로 모아 주므로 여기서는 한 번만 부른다.
 * 캐시하지 않는다 — 주문 직전에 보는 값이라 신선함이 존재 이유다.
 *
 * 매수/매도를 바꾸면 다시 받는다. 매수 화면에는 매수가능금액이, 매도 화면에는 매도가능수량이
 * 채워지고 반대쪽은 null 로 오기 때문이다(안 쓸 값을 받으려고 외부 호출을 늘리지 않는다).
 */
export const useTossOrderable = (
  owner: string,
  symbol: string | null,
  side: TossOrderSide
): TossOrderableState => {
  const [orderable, setOrderable] = useState<TossOrderable | null>(null);
  const [status, setStatus] = useState<TossOrderableStatus>('idle');
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback((): void => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!symbol) {
      setOrderable(null);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    const run = async (): Promise<void> => {
      try {
        const data = await api.getTossOrderable(owner, symbol, side);
        if (cancelled) return;
        setOrderable(data);
        setStatus('loaded');
      } catch {
        if (cancelled) return;
        // 시세를 못 받았다고 주문 화면을 죽이지 않는다 — 가격을 직접 아는 사람은 그대로 주문할 수 있어야 한다.
        setStatus('error');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [owner, symbol, side, reloadToken]);

  return { orderable, status, reload };
};
