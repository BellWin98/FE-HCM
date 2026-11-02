import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { KnowledgeNoteFormDialog } from '@/components/knowledge/KnowledgeNoteFormDialog';
import { QuickNoteFab } from '@/components/knowledge/QuickNoteFab';
import { useKnowledgeAccess } from '@/hooks/useKnowledgeAccess';
import type { KnowledgeNote, KnowledgeNoteInput } from '@/types/knowledgeNote';

export interface QuickNoteOpenOptions {
  /** 넘기면 수정 모드로 열린다. */
  note?: KnowledgeNote;
  /** 마지막 컨텍스트보다 우선하는 초기값(공유 시트, 주문 시트의 종목 등). */
  prefill?: Partial<KnowledgeNoteInput>;
  /** 저장·취소 어느 쪽으로든 다이얼로그가 닫힌 직후 한 번 호출된다. */
  onClosed?: () => void;
}

interface QuickNoteContextValue {
  openQuickNote: (options?: QuickNoteOpenOptions) => void;
}

// Provider 밖(권한 없는 화면, 기존 토스 시트 테스트)에서 불려도 터지지 않도록 no-op 이 기본값이다.
const QuickNoteContext = createContext<QuickNoteContextValue>({ openQuickNote: () => {} });

export const useQuickNote = (): QuickNoteContextValue => useContext(QuickNoteContext);

export const QuickNoteProvider = ({ children }: { children: ReactNode }) => {
  const { hasAccess } = useKnowledgeAccess();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<QuickNoteOpenOptions>({});
  // 열 때마다 바뀌는 폼 key. 닫힘 애니메이션 중(폼이 아직 마운트)에 다른 메모를 열어도 폼을 새로 만들어
  // 이전 메모의 값이 새 메모에 저장되지 않게 한다.
  const [openCount, setOpenCount] = useState(0);
  const optionsRef = useRef(options);

  const openQuickNote = useCallback(
    (next: QuickNoteOpenOptions = {}): void => {
      // 서버가 최종 차단하지만 화면에서도 권한 없는 사용자에게는 열지 않는다.
      if (!hasAccess) return;
      optionsRef.current = next;
      setOptions(next);
      setOpenCount((count) => count + 1);
      setOpen(true);
    },
    [hasAccess]
  );

  const handleOpenChange = useCallback((nextOpen: boolean): void => {
    setOpen(nextOpen);
    if (nextOpen) return;
    optionsRef.current.onClosed?.();
  }, []);

  const value = useMemo(() => ({ openQuickNote }), [openQuickNote]);

  return (
    <QuickNoteContext.Provider value={value}>
      {children}
      {hasAccess && (
        <>
          <QuickNoteFab onClick={() => openQuickNote()} />
          <KnowledgeNoteFormDialog
            open={open}
            onOpenChange={handleOpenChange}
            options={options}
            formKey={openCount}
          />
        </>
      )}
    </QuickNoteContext.Provider>
  );
};
