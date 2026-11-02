import { NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset';

/** 브라우저 툴바가 접히는 정도의 작은 변화는 키보드로 보지 않는다. */
const KEYBOARD_MIN_INSET = 120;

/** 모바일 전용 빠른 메모 버튼. 토스 새로고침 FAB 가 오른쪽(`right-4`)을 쓰므로 왼쪽에 둔다. */
export const QuickNoteFab = ({ onClick }: { onClick: () => void }) => {
  // iOS 는 fixed bottom 요소를 키보드 위로 띄우므로, 다른 화면에서 입력 중일 때 입력 칸을 가리지 않게 숨긴다.
  const { bottom } = useVisualViewportInset(true);
  if (bottom >= KEYBOARD_MIN_INSET) return null;

  return (
    <Button
      type="button"
      size="icon"
      aria-label="빠른 메모"
      aria-haspopup="dialog"
      onClick={onClick}
      className="fixed left-4 bottom-safe z-40 h-14 w-14 rounded-full shadow-lg md:hidden"
    >
      <NotebookPen className="h-6 w-6" />
    </Button>
  );
};
