import React from 'react';
import { cn } from '@/lib/utils';
import { STOCK_BORDER } from '@/lib/stockTheme';
import type { TossMarketSegment } from '@/lib/tossPortfolio';

export interface TossSegmentOption {
  value: TossMarketSegment;
  label: string;
  count: number;
}

interface TossCurrencySegmentProps {
  segments: TossSegmentOption[];
  value: TossMarketSegment;
  onChange: (value: TossMarketSegment) => void;
}

/**
 * 국내(원화) / 해외(달러) 전환 세그먼트.
 *
 * 목록만 좁히는 필터가 아니라 <b>화면 전체</b>를 지배한다 — 요약도 목록도 고른 통화 하나만
 * 가리킨다. 통화를 넘어 합산하지 않기로 한 이상 "전체"라는 선택지는 존재할 수 없다.
 */
const TossCurrencySegment: React.FC<TossCurrencySegmentProps> = ({
  segments,
  value,
  onChange,
}) => {
  // 한쪽 통화만 보유한 계좌에는 전환할 대상이 없다.
  if (segments.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="통화 선택"
      data-testid="currency-segment"
      className={cn('inline-flex w-full rounded-lg border overflow-hidden', STOCK_BORDER)}
    >
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <button
            key={segment.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(segment.value)}
            className={cn(
              'flex-1 min-w-0 min-h-[56px] px-3 py-2 text-left transition-colors',
              selected
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <span className="block text-sm font-semibold">{segment.label}</span>
            <span className="block text-[11px] tabular-nums truncate opacity-80">
              {segment.count}종목
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default TossCurrencySegment;
