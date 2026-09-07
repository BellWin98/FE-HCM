import { useCallback, useEffect, useRef, useState } from 'react';
import type { TossOpenOrder } from '@/types/tossStock';
import { api } from '@/lib/api';

export type TossOpenOrdersStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface TossOpenOrders {
  orders: TossOpenOrder[];
  status: TossOpenOrdersStatus;
  reload: () => void;
  cancel: (orderId: string) => Promise<void>;
  cancelingOrderId: string | null;
}

/**
 * 체결을 기다리는 주문.
 *
 * 주문을 낼 수 있게 된 이상 낸 것이 살아 있는지 볼 수단이 반드시 있어야 한다 —
 * 없으면 사용자는 같은 주문을 한 번 더 낸다. 그래서 캐시하지 않고 필요할 때마다 새로 받는다.
 *
 * 조회 권한만 있는 회원은 이 API 에서 403 을 받는다(주문 API 는 ADMIN 전용). 호출 자체를 막기 위해
 * `enabled` 로 껐다 켤 수 있게 해 두었다 — 403 을 받아 놓고 에러를 그리면 화면이 시끄러워진다.
 */
export const useTossOpenOrders = (owner: string, enabled = true): TossOpenOrders => {
  const [orders, setOrders] = useState<TossOpenOrder[]>([]);
  const [status, setStatus] = useState<TossOpenOrdersStatus>('idle');
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // 계좌를 바꾸는 사이에 도착한 이전 소유자의 응답을 그리지 않기 위한 표식.
  const activeOwnerRef = useRef(owner);

  const reload = useCallback((): void => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    activeOwnerRef.current = owner;

    if (!enabled || !owner) {
      setOrders([]);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    const run = async (): Promise<void> => {
      try {
        const data = await api.getTossOpenOrders(owner);
        if (cancelled || activeOwnerRef.current !== owner) return;
        setOrders(data);
        setStatus('loaded');
      } catch {
        if (cancelled || activeOwnerRef.current !== owner) return;
        setOrders([]);
        setStatus('error');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [owner, enabled, reloadToken]);

  const cancel = useCallback(
    async (orderId: string): Promise<void> => {
      setCancelingOrderId(orderId);
      try {
        await api.cancelTossOrder(owner, orderId);
        // 낙관적으로 지우지 않는다. 취소는 접수일 뿐이고 원장 반영은 토스가 한다 —
        // 목록에서 미리 지웠다가 취소가 거부되면 사용자는 없어진 줄 아는 주문을 그대로 갖게 된다.
        reload();
      } finally {
        setCancelingOrderId(null);
      }
    },
    [owner, reload]
  );

  return { orders, status, reload, cancel, cancelingOrderId };
};
