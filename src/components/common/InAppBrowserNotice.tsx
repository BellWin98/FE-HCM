import { Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

interface InAppBrowserNoticeProps {
  visible: boolean;
  onClose: () => void;
}

export const InAppBrowserNotice = ({ visible, onClose }: InAppBrowserNoticeProps) => {
  if (!visible) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast('링크가 복사되었어요. 사파리·크롬·삼성 인터넷에 붙여넣어 열어주세요.');
    } catch {
      toast.error('복사에 실패했어요. 주소창을 길게 눌러 직접 복사해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4">
      <div className="relative w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 text-center shadow-lg">
        <button
          type="button"
          onClick={onClose}
          aria-label="안내 닫기"
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-base font-semibold">화면이 제대로 보이지 않나요?</p>
        <p className="text-sm text-muted-foreground">
          카카오톡·인스타그램·스레드 등의 인앱 브라우저에서는 일부 화면이 정상적으로 표시되지 않을 수
          있어요. 오른쪽 상단·하단 메뉴(⋮ 또는 ⋯)에서 <b>다른 브라우저로 열기</b>를 선택하거나, 아래
          버튼으로 링크를 복사해 사파리(Safari)·크롬(Chrome)·삼성 인터넷에서 열어주세요.
        </p>
        <Button className="w-full" onClick={handleCopyLink}>
          <Copy className="mr-2 h-4 w-4" />
          링크 복사하기
        </Button>
      </div>
    </div>
  );
};
