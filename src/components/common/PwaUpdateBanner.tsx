import type { FC } from 'react';
import { cn } from '@/lib/utils';

interface PwaUpdateBannerProps {
  visible: boolean;
  onUpdate: () => void;
  onClose?: () => void;
}

export const PwaUpdateBanner: FC<PwaUpdateBannerProps> = ({ visible, onUpdate, onClose }) => {
  if (!visible) {
    return null;
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onUpdate();
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:pb-6">
      <div className="w-full max-w-md rounded-lg bg-slate-900 text-slate-50 shadow-lg ring-1 ring-slate-800">
        <div className="flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
          <div className="flex-1 text-sm">
            <p className="font-medium">새 버전이 준비되었습니다.</p>
            <p className="mt-1 text-xs text-slate-300">
              최신 기능과 버그 수정을 적용하려면 지금 새로고침을 진행해 주세요.
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-full',
                'text-slate-300 hover:bg-slate-800 hover:text-slate-50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
              )}
              aria-label="업데이트 배너 닫기"
              onClick={onClose}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onClose();
                }
              }}
            >
              <span className="text-lg leading-none">&times;</span>
            </button>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-800 px-4 py-2.5 sm:px-5">
          {onClose && (
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              onClick={onClose}
            >
              나중에
            </button>
          )}
          <button
            type="button"
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            onClick={onUpdate}
            onKeyDown={handleKeyDown}
            aria-label="지금 업데이트 적용 후 새로고침"
          >
            지금 업데이트
          </button>
        </div>
      </div>
    </div>
  );
};

