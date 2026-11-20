/** 메모 내용 칸에서 코드를 적을 때 쓰는 편집 규칙. 모두 순수 함수이며 textarea 에 적용하는 것은 훅이 맡는다. */

export const INDENT_UNIT = '  ';

const FENCE = '```';

/** 커서 앞 내용이 이 패턴으로 끝나면 다음 줄을 한 단계 더 들여쓴다. */
const OPENER_PATTERN = /(?:[{([]|\b(?:BEGIN|THEN))\s*$/i;

/** value[start, end) 를 text 로 바꾸고, 바꾼 뒤 선택을 [selectionStart, selectionEnd] 로 둔다(바뀐 뒤 문자열 기준). */
export interface TextEdit {
  start: number;
  end: number;
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

const lineStartOf = (value: string, index: number): number => value.lastIndexOf('\n', index - 1) + 1;

const lineEndOf = (value: string, index: number): number => {
  const next = value.indexOf('\n', index);
  return next === -1 ? value.length : next;
};

/** 줄바꿈 한 번. 커서 앞 줄의 들여쓰기를 잇고, 여는 괄호·BEGIN·THEN 뒤면 한 단계 더 들여쓴다. */
export const newlineEdit = (value: string, selStart: number, selEnd: number): TextEdit => {
  const before = value.slice(lineStartOf(value, selStart), selStart);
  const indent = before.match(/^[ \t]*/)?.[0] ?? '';
  const extra = OPENER_PATTERN.test(before) ? INDENT_UNIT : '';
  const text = `\n${indent}${extra}`;
  const caret = selStart + text.length;
  return { start: selStart, end: selEnd, text, selectionStart: caret, selectionEnd: caret };
};

const outdentLine = (line: string): { line: string; removed: number } => {
  const removed = line.match(/^ {1,2}|^\t/)?.[0].length ?? 0;
  return { line: line.slice(removed), removed };
};

/**
 * 커서가 있는 줄 또는 선택한 줄들을 한 단계 들여쓰거나 내어쓴다. 줄 전체를 한 번에 바꿔 undo 한 번으로 되돌아가게 한다.
 * 내어쓸 공백이 하나도 없으면 null.
 */
export const indentEdit = (
  value: string,
  selStart: number,
  selEnd: number,
  direction: 'in' | 'out'
): TextEdit | null => {
  const collapsed = selStart === selEnd;
  // 선택 끝이 다음 줄 맨 앞이면 그 줄은 고른 것이 아니다.
  const effectiveEnd = !collapsed && value[selEnd - 1] === '\n' ? selEnd - 1 : selEnd;
  const blockStart = lineStartOf(value, selStart);
  const blockEnd = lineEndOf(value, effectiveEnd);
  const lines = value.slice(blockStart, blockEnd).split('\n');

  let text: string;
  let firstLineShift: number;
  if (direction === 'in') {
    text = lines.map((line) => `${INDENT_UNIT}${line}`).join('\n');
    firstLineShift = INDENT_UNIT.length;
  } else {
    const results = lines.map(outdentLine);
    if (results.every((result) => result.removed === 0)) return null;
    text = results.map((result) => result.line).join('\n');
    firstLineShift = -results[0].removed;
  }

  if (collapsed) {
    const caret = Math.max(blockStart, selStart + firstLineShift);
    return { start: blockStart, end: blockEnd, text, selectionStart: caret, selectionEnd: caret };
  }
  return { start: blockStart, end: blockEnd, text, selectionStart: blockStart, selectionEnd: blockStart + text.length };
};

/** 코드블록 펜스를 넣는다. 선택한 글이 있으면 감싸고 언어를 적을 수 있게 여는 펜스 뒤에 커서를 둔다. */
export const fenceEdit = (value: string, selStart: number, selEnd: number): TextEdit => {
  const prefix = selStart > 0 && value[selStart - 1] !== '\n' ? '\n' : '';
  const suffix = selEnd < value.length && value[selEnd] !== '\n' ? '\n' : '';
  const selected = value.slice(selStart, selEnd);
  const opening = selStart + prefix.length + FENCE.length;

  if (selected) {
    const text = `${prefix}${FENCE}\n${selected}\n${FENCE}${suffix}`;
    return { start: selStart, end: selEnd, text, selectionStart: opening, selectionEnd: opening };
  }
  const text = `${prefix}${FENCE}\n\n${FENCE}${suffix}`;
  return { start: selStart, end: selEnd, text, selectionStart: opening + 1, selectionEnd: opening + 1 };
};
