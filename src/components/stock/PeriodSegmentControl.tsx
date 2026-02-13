import React from 'react';
import { cn } from '@/lib/utils';

export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ALL';

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'DAILY', label: '일' },
  { value: 'WEEKLY', label: '주' },
  { value: 'MONTHLY', label: '월' },
  { value: 'YEARLY', label: '년' },
  { value: 'ALL', label: '전체' },
];

interface PeriodSegmentControlProps {
  value: PeriodType;
  onChange: (value: PeriodType) => void;
  dark?: boolean;
}

const PeriodSegmentControl: React.FC<PeriodSegmentControlProps> = ({ value, onChange, dark }) => {
  const baseClass = dark
    ? 'text-gray-400 hover:text-gray-200'
    : 'text-gray-600 hover:text-gray-900';
  const activeClass = dark
    ? 'bg-gray-700 text-white'
    : 'bg-gray-200 text-gray-900';

  return (
    <div className="flex gap-1 p-1 rounded-lg min-h-[44px] overflow-x-auto">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 min-w-0 min-h-[40px] px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors shrink-0',
            value === opt.value ? activeClass : baseClass
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default PeriodSegmentControl;
