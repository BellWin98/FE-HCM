/** 메모 내용의 ``` 코드블록(펜스)만 해석한다. 그 밖의 마크다운 문법은 다루지 않는다. */

export type NoteSegment = { kind: 'text'; text: string } | { kind: 'code'; lang: string | null; code: string };

const OPEN_FENCE = /^\s*```\s*([\w+#.-]*)\s*$/;
const CLOSE_FENCE = /^\s*```\s*$/;

/** 내용을 글·코드 조각으로 나눈다. 닫히지 않은 펜스는 나머지 전부를 코드로 본다. */
export const parseNoteContent = (content: string): NoteSegment[] => {
  const segments: NoteSegment[] = [];
  let buffer: string[] = [];
  let code: { lang: string | null } | null = null;

  const flush = (): void => {
    if (code) {
      segments.push({ kind: 'code', lang: code.lang, code: buffer.join('\n') });
    } else if (buffer.join('\n').trim()) {
      segments.push({ kind: 'text', text: buffer.join('\n') });
    }
    buffer = [];
  };

  content.split('\n').forEach((line) => {
    if (code) {
      if (CLOSE_FENCE.test(line)) {
        flush();
        code = null;
        return;
      }
      buffer.push(line);
      return;
    }
    const open = line.match(OPEN_FENCE);
    if (!open) {
      buffer.push(line);
      return;
    }
    flush();
    code = { lang: open[1] ? open[1].toLowerCase() : null };
  });
  flush();
  return segments;
};

/** 미리보기용으로 펜스 줄만 지운다. */
export const stripFenceLines = (content: string): string =>
  content
    .split('\n')
    .filter((line) => !/^\s*```/.test(line))
    .join('\n');
