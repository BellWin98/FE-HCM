import { NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDraggablePosition } from '@/hooks/useDraggablePosition';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset';
import { cn } from '@/lib/utils';

/** 브라우저 툴바가 접히는 정도의 작은 변화는 키보드로 보지 않는다. */
const KEYBOARD_MIN_INSET = 120;

/** 사용자가 끌어서 옮긴 FAB 자리를 기억하는 localStorage 키. */
const POSITION_STORAGE_KEY = 'quickNoteFabPosition';

/** 상단 헤더(`sticky top-0 z-50`)가 FAB(z-40)을 덮으므로 그 아래까지만 옮길 수 있게 한다. */
const getHeaderBottom = (): number => document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;

/**
 * 모바일 전용 빠른 메모 버튼. 토스 새로고침 FAB 가 오른쪽(`right-4`)을 쓰므로 기본은 왼쪽 아래에 둔다.
 * 화면을 가릴 때는 끌어서 다른 자리로 옮길 수 있고, 옮긴 자리는 기억한다.
 */
export const QuickNoteFab = ({ onClick }: { onClick: () => void }) => {
  // iOS 는 fixed bottom 요소를 키보드 위로 띄우므로, 다른 화면에서 입력 중일 때 입력 칸을 가리지 않게 숨긴다.
  const { bottom } = useVisualViewportInset(true);
  const { position, handlers } = useDraggablePosition(POSITION_STORAGE_KEY, {
    getTopInset: getHeaderBottom,
  });
  if (bottom >= KEYBOARD_MIN_INSET) return null;

  return (
    <Button
      type="button"
      size="icon"
      aria-label="빠른 메모"
      aria-haspopup="dialog"
      onClick={onClick}
      {...handlers}
      // 끌어서 옮긴 자리는 런타임 좌표라 Tailwind 클래스로 표현할 수 없다.
      style={position ? { left: position.left, top: position.top } : undefined}
      className={cn(
        'fixed z-40 h-14 w-14 touch-none select-none rounded-full shadow-lg md:hidden',
        !position && 'left-4 bottom-safe',
      )}
    >
      <NotebookPen className="h-6 w-6" />
    </Button>
  );
};
