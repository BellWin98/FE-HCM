import React from 'react';
import type { TossAccountOwner } from '@/types/tossStock';
import { cn } from '@/lib/utils';

interface OwnerSegmentControlProps {
  owners: TossAccountOwner[];
  value: string;
  onChange: (owner: string) => void;
}

/**
 * 계좌 소유자(나 / 엄마 / …) 전환 세그먼트.
 * 소유자 목록은 백엔드 설정에서 내려오므로, 아빠 계좌를 추가해도 이 컴포넌트는 수정할 필요가 없다.
 */
const OwnerSegmentControl: React.FC<OwnerSegmentControlProps> = ({ owners, value, onChange }) => {
  // 계좌가 하나뿐이면 전환할 대상이 없다.
  if (owners.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="계좌 선택"
      className="inline-flex w-full rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {owners.map((owner) => {
        const selected = owner.owner === value;
        return (
          <button
            key={owner.owner}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(owner.owner)}
            className={cn(
              'flex-1 min-h-[44px] px-4 py-2 text-sm font-medium transition-colors',
              selected
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            {owner.displayName}
          </button>
        );
      })}
    </div>
  );
};

export default OwnerSegmentControl;
