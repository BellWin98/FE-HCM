import { NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** 모바일 전용 빠른 메모 버튼. 토스 새로고침 FAB 가 오른쪽(`right-4`)을 쓰므로 왼쪽에 둔다. */
export const QuickNoteFab = ({ onClick }: { onClick: () => void }) => (
  <Button
    type="button"
    size="icon"
    aria-label="빠른 메모"
    onClick={onClick}
    className="fixed left-4 bottom-safe z-40 h-14 w-14 rounded-full shadow-lg md:hidden"
  >
    <NotebookPen className="h-6 w-6" />
  </Button>
);
