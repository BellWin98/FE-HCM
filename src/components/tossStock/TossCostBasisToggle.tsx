import React from 'react';
import { cn } from '@/lib/utils';
import { STOCK_TEXT_MUTED, STOCK_SEGMENT_ACTIVE } from '@/lib/stockTheme';
import type { TossCostBasis } from '@/lib/tossPortfolio';

interface TossCostBasisToggleProps {
  value: TossCostBasis;
  onChange: (value: TossCostBasis) => void;
}

const OPTIONS: { value: TossCostBasis; label: string }[] = [
  { value: 'preCost', label: '세전' },
  { value: 'afterCost', label: '세후' },
];

/**
 * 세전 / 세후 전환.
 *
 * 요약 카드 머리에 두는 이유는 이 토글이 목록만이 아니라 <b>화면 전체</b>의 기준이기 때문이다 —
 * 목록 위에 두면 자기보다 위에 있는 총자산·평가손익을 바꾸는 컨트롤이 되어 관계가 보이지 않는다.
 */
const TossCostBasisToggle: React.FC<TossCostBasisToggleProps> = ({ value, onChange }) => (
  <div
    role="group"
    aria-label="손익 기준"
    className="inline-flex shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 text-xs"
  >
    {OPTIONS.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        aria-pressed={value === option.value}
        className={cn(
          'px-3 min-h-[36px] font-medium transition-colors',
          value === option.value ? STOCK_SEGMENT_ACTIVE : STOCK_TEXT_MUTED
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default TossCostBasisToggle;
