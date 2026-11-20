import { describe, expect, it } from 'vitest';
import { fenceEdit, indentEdit, newlineEdit } from '@/lib/codeEditing';
import type { TextEdit } from '@/lib/codeEditing';

/** `|` 는 커서, `[ ]` 는 선택 범위를 뜻한다. */
const parse = (marked: string): { value: string; start: number; end: number } => {
  const caret = marked.indexOf('|');
  if (caret >= 0) {
    return { value: marked.replace('|', ''), start: caret, end: caret };
  }
  const open = marked.indexOf('[');
  const close = marked.indexOf(']');
  const value = marked.replace('[', '').replace(']', '');
  return { value, start: open, end: close - 1 };
};

const render = (value: string, start: number, end: number): string =>
  start === end
    ? `${value.slice(0, start)}|${value.slice(start)}`
    : `${value.slice(0, start)}[${value.slice(start, end)}]${value.slice(end)}`;

const run = (marked: string, edit: (value: string, start: number, end: number) => TextEdit | null): string | null => {
  const { value, start, end } = parse(marked);
  const result = edit(value, start, end);
  if (!result) return null;
  const next = value.slice(0, result.start) + result.text + value.slice(result.end);
  return render(next, result.selectionStart, result.selectionEnd);
};

describe('newlineEdit', () => {
  it('윗줄 들여쓰기를 이어 간다', () => {
    expect(run('  SELECT *|', newlineEdit)).toBe('  SELECT *\n  |');
  });

  it('여는 괄호로 끝나면 한 단계 더 들여쓴다', () => {
    expect(run('if (a) {|', newlineEdit)).toBe('if (a) {\n  |');
    expect(run('    foo(|', newlineEdit)).toBe('    foo(\n      |');
    expect(run('[|', newlineEdit)).toBe('[\n  |');
  });

  it('BEGIN·THEN 으로 끝나면 대소문자 없이 한 단계 더 들여쓴다', () => {
    expect(run('BEGIN|', newlineEdit)).toBe('BEGIN\n  |');
    expect(run('case when x then|', newlineEdit)).toBe('case when x then\n  |');
  });

  it('여는 괄호 뒤 공백은 무시한다', () => {
    expect(run('{  |', newlineEdit)).toBe('{  \n  |');
  });

  it('단어 일부만 같으면 더 들여쓰지 않는다', () => {
    expect(run('THENCE|', newlineEdit)).toBe('THENCE\n|');
  });

  it('들여쓰기가 없으면 줄바꿈만 한다', () => {
    expect(run('plain|', newlineEdit)).toBe('plain\n|');
  });

  it('선택 영역은 지우고 줄을 바꾼다', () => {
    expect(run('ab[cd]ef', newlineEdit)).toBe('ab\n|ef');
  });

  it('줄 중간에서는 커서 앞 기준으로 들여쓴다', () => {
    expect(run('  ab|cd', newlineEdit)).toBe('  ab\n  |cd');
  });
});

describe('indentEdit', () => {
  it('커서가 있는 줄을 들여쓰고 커서를 따라 옮긴다', () => {
    expect(run('a\nb|c', (v, s, e) => indentEdit(v, s, e, 'in'))).toBe('a\n  b|c');
  });

  it('여러 줄 선택은 줄마다 들여쓰고 줄 전체를 선택한다', () => {
    expect(run('[a\nb]', (v, s, e) => indentEdit(v, s, e, 'in'))).toBe('[  a\n  b]');
  });

  it('선택 끝이 다음 줄 맨 앞이면 그 줄은 건드리지 않는다', () => {
    expect(run('[a\n]b', (v, s, e) => indentEdit(v, s, e, 'in'))).toBe('[  a]\nb');
  });

  it('내어쓰기는 최대 두 칸을 지운다', () => {
    expect(run('    a|', (v, s, e) => indentEdit(v, s, e, 'out'))).toBe('  a|');
    expect(run(' a|', (v, s, e) => indentEdit(v, s, e, 'out'))).toBe('a|');
  });

  it('지울 공백이 없으면 null', () => {
    expect(run('a|', (v, s, e) => indentEdit(v, s, e, 'out'))).toBeNull();
  });

  it('커서가 지워지는 공백 안에 있으면 줄 맨 앞으로 간다', () => {
    expect(run(' | a', (v, s, e) => indentEdit(v, s, e, 'out'))).toBe('|a');
  });

  it('여러 줄 내어쓰기는 줄마다 있는 만큼만 지운다', () => {
    expect(run('[  a\n b\nc]', (v, s, e) => indentEdit(v, s, e, 'out'))).toBe('[a\nb\nc]');
  });
});

describe('fenceEdit', () => {
  it('빈 칸에는 펜스를 넣고 커서를 안에 둔다', () => {
    expect(run('|', fenceEdit)).toBe('```\n|\n```');
  });

  it('줄 중간이면 앞에 줄바꿈을 넣는다', () => {
    expect(run('abc|', fenceEdit)).toBe('abc\n```\n|\n```');
  });

  it('커서 뒤에 글이 있으면 뒤에도 줄바꿈을 넣는다', () => {
    expect(run('ab|cd', fenceEdit)).toBe('ab\n```\n|\n```\ncd');
  });

  it('선택 영역을 감싸고 커서를 여는 펜스 뒤에 둔다', () => {
    expect(run('[SELECT 1]', fenceEdit)).toBe('```|\nSELECT 1\n```');
  });
});
