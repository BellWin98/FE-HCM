import type { FC } from 'react';
import { Download, Share2, SquarePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PwaInstallPlatform } from '@/hooks/usePwaInstallPrompt';

interface PwaInstallBannerProps {
  visible: boolean;
  platform: PwaInstallPlatform | null;
  onInstall: () => void;
  onClose: () => void;
}

export const PwaInstallBanner: FC<PwaInstallBannerProps> = ({ visible, platform, onInstall, onClose }) => {
  if (!visible || !platform) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:pb-6">
      <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-lg">
        <div className="flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Download className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold">헬창마을 앱으로 설치하기</p>
            <p className="mt-1 text-xs text-muted-foreground">
              홈 화면에 추가하면 앱처럼 빠르게 실행하고, 운동 알림 등 푸시 알림도 놓치지 않고 받을 수 있어요.
            </p>
            {platform === 'ios' && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                하단 공유 버튼
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                을 누른 뒤
                <SquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-medium text-foreground">홈 화면에 추가</span>를 선택해주세요.
              </p>
            )}
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="설치 안내 닫기"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2 border-t px-4 py-2.5 sm:px-5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            나중에
          </Button>
          {platform === 'android' && (
            <Button size="sm" onClick={onInstall}>
              <Download className="h-4 w-4" />
              앱 설치하기
            </Button>
          )}
          {platform === 'ios' && (
            <Button size="sm" onClick={onClose}>
              확인했어요
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
