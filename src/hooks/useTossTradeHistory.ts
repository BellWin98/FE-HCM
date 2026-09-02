import { useCallback, useEffect, useRef, useState } from 'react';
import type { TossTrade } from '@/types/tossStock';
import { api } from '@/lib/api';

/** 계좌 개설 이전이어도 무해한 조회 시작일. */
const TRADE_HISTORY_START_DATE = '2020-01-01';

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface TossTradeHistory {
  trades: TossTrade[];
  /** 원가를 추정으로 메운 체결이 섞여 있는지. 화면에 밝혀야 한다. */
  estimated: boolean;
  /** 처음 호출될 때만 실제로 조회한다. 이후 호출은 무시된다. */
  load: () => void;
}

/**
 * 종목을 펼쳤을 때 보여줄 거래 내역을 <b>필요해질 때</b> 한 번만 불러온다.
 *
 * 이 데이터는 줄을 펼친 종목에만 쓰이는데, 계좌 개설 이후 전체 주문을 페이징으로 훑어야
 * 만들어지는 무거운 응답이다(토스 주문내역은 앱에서 낸 주문까지 전부 반환한다).
 * 탭에 들어오자마자 받으면 펼치지 않는 대부분의 경우에 그 비용이 통째로 버려진다.
 *
 * 종목마다 따로 받지 않고 한 벌을 공유하는 이유는 조회 API 가 종목 단위 필터를 받지 않기 때문이다 —
 * 어차피 한 번은 전체를 받아야 하므로, 두 번째 종목부터는 이미 받아 둔 것을 쓴다.
 */
export const useTossTradeHistory = (owner: string): TossTradeHistory => {
  const [trades, setTrades] = useState<TossTrade[]>([]);
  const [estimated, setEstimated] = useState(false);
  const requestedOwnerRef = useRef<string | null>(null);

  // 계좌를 바꾸면 이전 사람의 거래가 남지 않도록 비우고, 다시 요청할 수 있게 되돌린다.
  useEffect(() => {
    requestedOwnerRef.current = null;
    setTrades([]);
    setEstimated(false);
  }, [owner]);

  const load = useCallback((): void => {
    if (requestedOwnerRef.current === owner) return;
    requestedOwnerRef.current = owner;

    const fetchTrades = async (): Promise<void> => {
      try {
        const data = await api.getTossRealizedProfit({
          owner,
          startDate: TRADE_HISTORY_START_DATE,
          endDate: formatDateLocal(new Date()),
        });
        // 응답이 오는 사이 계좌가 바뀌었으면 남의 거래를 그리지 않는다.
        if (requestedOwnerRef.current !== owner) return;
        setTrades(data.trades);
        setEstimated(data.estimated);
      } catch {
        // 자산 화면 자체는 유효하므로 조용히 넘어가되, 다음 펼침에서 다시 시도할 수 있게 되돌린다.
        if (requestedOwnerRef.current === owner) requestedOwnerRef.current = null;
      }
    };

    fetchTrades();
  }, [owner]);

  return { trades, estimated, load };
};
