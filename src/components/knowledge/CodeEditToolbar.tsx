import type { MouseEvent } from 'react';
import { Code, IndentDecrease, IndentIncrease } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeEditToolbarProps {
  onInsertFence: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  disabled?: boolean;
}

// 버튼이 포커스를 가져가면 내용 칸의 커서 위치를 잃고 모바일 키보드가 내려간다.
const keepFocus = (event: MouseEvent<HTMLButtonElement>): void => event.preventDefault();

const TOOLS = [
  { label: '코드블록 넣기', Icon: Code, key: 'fence' },
  { label: '들여쓰기', Icon: IndentIncrease, key: 'indent' },
  { label: '내어쓰기', Icon: IndentDecrease, key: 'outdent' },
] as const;

/** 메모 내용 칸 위의 코드 편집 도구줄. Tab 이 없는 폰 키보드를 위한 것이다. */
export const CodeEditToolbar = ({ onInsertFence, onIndent, onOutdent, disabled }: CodeEditToolbarProps) => {
  const actions = { fence: onInsertFence, indent: onIndent, outdent: onOutdent };
  return (
    <div role="toolbar" aria-label="코드 편집" className="flex items-center gap-0.5">
      {TOOLS.map(({ label, Icon, key }) => (
        <Button
          key={key}
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          title={label}
          disabled={disabled}
          className="h-7 w-7 text-muted-foreground"
          onMouseDown={keepFocus}
          onClick={actions[key]}
        >
          <Icon aria-hidden="true" className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
};
