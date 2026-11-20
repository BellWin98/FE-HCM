import { useEffect, useRef } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { fenceEdit, indentEdit, newlineEdit } from '@/lib/codeEditing';
import type { TextEdit } from '@/lib/codeEditing';

/**
 * 편집 결과를 textarea 에 적용한다. 가능하면 execCommand 로 넣어 브라우저 undo 기록을 살리고,
 * 지원하지 않으면(jsdom 등) 값을 직접 바꾼 뒤 input 이벤트를 보내 React onChange 가 불리게 한다.
 */
export const applyTextEdit = (textarea: HTMLTextAreaElement, edit: TextEdit): void => {
  textarea.focus();
  textarea.setSelectionRange(edit.start, edit.end);
  const command = edit.text ? 'insertText' : 'delete';
  const applied =
    edit.start === edit.end && !edit.text
      ? true
      : typeof document.execCommand === 'function' && document.execCommand(command, false, edit.text);
  if (!applied) {
    textarea.setRangeText(edit.text, edit.start, edit.end);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd);
};

const MODIFIER_KEYS = ['Shift', 'Control', 'Alt', 'Meta'];

interface CodeTextareaControls {
  handleKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  insertFence: () => void;
  indent: () => void;
  outdent: () => void;
  /**
   * 내용 칸에서 Esc 가 눌렸을 때 부른다. 처음이면 "다음 Tab 은 칸 이동" 을 켜고 true(이 Esc 는 삼킨다),
   * 이미 켜져 있으면 false(두 번째 Esc 는 원래대로 다이얼로그를 닫는다).
   */
  armEscape: () => boolean;
}

/** 메모 내용 칸의 코드 편집(자동 들여쓰기, Tab, 도구줄 명령)을 연결한다. */
export const useCodeTextarea = (ref: RefObject<HTMLTextAreaElement>): CodeTextareaControls => {
  // Esc 를 누른 직후의 Tab 한 번은 들여쓰기 대신 칸 이동에 맡긴다(키보드로 빠져나갈 길).
  const escapeArmedRef = useRef(false);

  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return undefined;
    // React 의 onBeforeInput 은 inputType 을 주지 않아 네이티브 리스너를 쓴다.
    // 안드로이드 IME 는 Enter 를 keyCode 229 로 보내므로 keydown 이 아니라 beforeinput 으로 줄바꿈을 잡는다.
    const handleBeforeInput = (event: InputEvent): void => {
      if (event.inputType !== 'insertLineBreak' && event.inputType !== 'insertParagraph') return;
      // 취소할 수 없는 입력(일부 안드로이드 IME)에서 우리 줄바꿈까지 넣으면 두 번 들어간다 — 브라우저에 맡긴다.
      if (event.isComposing || !event.cancelable) return;
      event.preventDefault();
      applyTextEdit(textarea, newlineEdit(textarea.value, textarea.selectionStart, textarea.selectionEnd));
    };
    textarea.addEventListener('beforeinput', handleBeforeInput);
    return () => textarea.removeEventListener('beforeinput', handleBeforeInput);
  }, [ref]);

  const run = (makeEdit: (value: string, start: number, end: number) => TextEdit | null): void => {
    const textarea = ref.current;
    if (!textarea) return;
    const edit = makeEdit(textarea.value, textarea.selectionStart, textarea.selectionEnd);
    if (edit) applyTextEdit(textarea, edit);
  };

  const indent = (): void => run((value, start, end) => indentEdit(value, start, end, 'in'));
  const outdent = (): void => run((value, start, end) => indentEdit(value, start, end, 'out'));
  const insertFence = (): void => run(fenceEdit);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Esc 는 다이얼로그의 Esc 처리(armEscape)가 맡는다 — Radix 가 캡처 단계에서 먼저 받는다.
    if (event.key === 'Escape') return;
    // Shift+Tab 의 Shift 처럼 조합키만 눌린 것은 Esc 대기 상태를 풀지 않는다.
    if (MODIFIER_KEYS.includes(event.key)) return;
    if (event.key !== 'Tab') {
      escapeArmedRef.current = false;
      return;
    }
    if (escapeArmedRef.current) {
      escapeArmedRef.current = false;
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (event.shiftKey) {
      outdent();
      return;
    }
    indent();
  };

  const armEscape = (): boolean => {
    if (escapeArmedRef.current) return false;
    escapeArmedRef.current = true;
    return true;
  };

  return { handleKeyDown, insertFence, indent, outdent, armEscape };
};
