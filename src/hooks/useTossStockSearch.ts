import { useCallback, useEffect, useRef, useState } from 'react';
import type { TossStockSearchResult } from '@/types/tossStock';
import { api } from '@/lib/api';

/** 타이핑이 멎기를 기다리는 시간. 한 글자마다 요청을 보내면 응답이 뒤섞여 도착한다. */
const DEBOUNCE_MS = 250;

/** 한 글자 질의는 결과가 너무 넓어 쓸모가 없다(`삼` → 수백 건). */
const MIN_QUERY_LENGTH = 2;

export type TossStockSearchStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface TossStockSearch {
  query: string;
  setQuery: (query: string) => void;
  results: TossStockSearchResult[];
  status: TossStockSearchStatus;
  reset: () => void;
}

/**
 * 종목 검색.
 *
 * 서버가 유니버스를 메모리에 들고 있어 이 호출에는 외부 API 왕복이 없다. 그래도 디바운스를 두는 이유는
 * 네트워크 절약보다 **순서** 때문이다 — 요청을 연달아 보내면 `삼`의 응답이 `삼성전자`의 응답보다
 * 늦게 도착해 화면이 되감기는 일이 생긴다.
 *
 * 디바운스만으로는 그 경합이 완전히 사라지지 않으므로(느린 응답 하나가 뒤늦게 도착할 수 있다)
 * 요청마다 순번을 매겨 **가장 마지막 질의의 응답만** 반영한다.
 */
export const useTossStockSearch = (): TossStockSearch => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TossStockSearchResult[]>([]);
  const [status, setStatus] = useState<TossStockSearchStatus>('idle');

  // 늦게 도착한 이전 질의의 응답이 최신 결과를 덮어쓰지 않게 하는 순번.
  const requestSeqRef = useRef(0);

  const reset = useCallback((): void => {
    requestSeqRef.current += 1;
    setQuery('');
    setResults([]);
    setStatus('idle');
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      // 진행 중이던 요청의 결과도 버린다 — 지운 질의의 결과가 뒤늦게 뜨면 안 된다.
      requestSeqRef.current += 1;
      setResults([]);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    const timer = setTimeout(() => {
      const seq = ++requestSeqRef.current;

      const run = async (): Promise<void> => {
        try {
          const data = await api.searchTossStocks(trimmed);
          if (seq !== requestSeqRef.current) return;
          setResults(data);
          setStatus('loaded');
        } catch {
          if (seq !== requestSeqRef.current) return;
          // 유니버스가 아직 준비되지 않았을 수도 있다(부팅 직후). 화면이 재시도를 안내한다.
          setResults([]);
          setStatus('error');
        }
      };

      run();
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results, status, reset };
};
