import { describe, expect, it } from 'vitest';
import { parseNoteContent, stripFenceLines } from '@/lib/noteContent';

describe('parseNoteContent', () => {
  it('글과 코드블록을 나누고 펜스에 붙은 줄바꿈은 뺀다', () => {
    expect(parseNoteContent('메모\n```sql\nSELECT 1\n```\n끝')).toEqual([
      { kind: 'text', text: '메모' },
      { kind: 'code', lang: 'sql', code: 'SELECT 1' },
      { kind: 'text', text: '끝' },
    ]);
  });

  it('언어가 없으면 null, 언어 이름은 소문자로', () => {
    expect(parseNoteContent('```\na\n```')).toEqual([{ kind: 'code', lang: null, code: 'a' }]);
    expect(parseNoteContent('```SQL\na\n```')).toEqual([{ kind: 'code', lang: 'sql', code: 'a' }]);
  });

  it('코드 안의 들여쓰기와 빈 줄을 그대로 둔다', () => {
    expect(parseNoteContent('```\n  a\n\n  b\n```')).toEqual([{ kind: 'code', lang: null, code: '  a\n\n  b' }]);
  });

  it('닫히지 않은 펜스는 나머지 전부를 코드로 본다', () => {
    expect(parseNoteContent('앞\n```js\nconst a = 1;')).toEqual([
      { kind: 'text', text: '앞' },
      { kind: 'code', lang: 'js', code: 'const a = 1;' },
    ]);
  });

  it('줄 중간의 백틱 셋은 펜스가 아니다', () => {
    expect(parseNoteContent('a ``` b')).toEqual([{ kind: 'text', text: 'a ``` b' }]);
  });

  it('펜스가 없으면 글 하나, 빈 글 조각은 만들지 않는다', () => {
    expect(parseNoteContent('그냥 글\n둘째 줄')).toEqual([{ kind: 'text', text: '그냥 글\n둘째 줄' }]);
    expect(parseNoteContent('```\na\n```\n```\nb\n```')).toEqual([
      { kind: 'code', lang: null, code: 'a' },
      { kind: 'code', lang: null, code: 'b' },
    ]);
  });
});

describe('stripFenceLines', () => {
  it('펜스 줄만 지운다', () => {
    expect(stripFenceLines('```sql\nSELECT 1\n```')).toBe('SELECT 1');
    expect(stripFenceLines('앞\n```\n  b\n```\n뒤')).toBe('앞\n  b\n뒤');
  });
});
