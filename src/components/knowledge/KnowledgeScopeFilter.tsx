import { Button } from '@/components/ui/button';
import type { KnowledgeNoteScope } from '@/types/knowledgeNote';

export const ADMIN_DEFAULT_SCOPES: KnowledgeNoteScope[] = ['MINE', 'PUBLIC'];

const ADMIN_SCOPE_OPTIONS: { scope: KnowledgeNoteScope; label: string }[] = [
  { scope: 'MINE', label: '내 메모' },
  { scope: 'PUBLIC', label: '공개 메모' },
  { scope: 'PRIVATE', label: '비공개 메모' },
];

interface KnowledgeScopeFilterProps {
  isAdmin: boolean;
  canWrite: boolean;
  value: KnowledgeNoteScope[];
  onChange: (next: KnowledgeNoteScope[]) => void;
}

export const KnowledgeScopeFilter = ({ isAdmin, canWrite, value, onChange }: KnowledgeScopeFilterProps) => {
  if (!isAdmin && !canWrite) return null;

  if (!isAdmin) {
    const mineOnly = value.includes('MINE');
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mineOnly ? 'default' : 'outline'}
          aria-pressed={mineOnly}
          onClick={() => onChange(mineOnly ? [] : ['MINE'])}
        >
          내 메모만 보기
        </Button>
      </div>
    );
  }

  const handleToggle = (scope: KnowledgeNoteScope): void => {
    if (!value.includes(scope)) {
      onChange([...value, scope]);
      return;
    }
    // 마지막 하나는 해제할 수 없다 (빈 선택은 일반 유저 기본 조회와 의미가 다르다).
    if (value.length === 1) return;
    onChange(value.filter((s) => s !== scope));
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        {ADMIN_SCOPE_OPTIONS.map(({ scope, label }) => {
          const selected = value.includes(scope);
          return (
            <Button
              key={scope}
              type="button"
              size="sm"
              variant={selected ? 'default' : 'outline'}
              aria-pressed={selected}
              onClick={() => handleToggle(scope)}
            >
              {label}
            </Button>
          );
        })}
      </div>
      {value.includes('PRIVATE') && (
        <p className="text-xs text-muted-foreground">다른 유저의 비공개 메모도 표시됩니다</p>
      )}
    </div>
  );
};
