import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addFiles, fromUrls } from '@/components/knowledge/noteAttachments';
import type { NoteAttachment } from '@/components/knowledge/noteAttachments';

const image = (name: string, type = 'image/png'): File => new File(['x'], name, { type });

beforeEach(() => {
  let count = 0;
  URL.createObjectURL = vi.fn(() => `blob:preview-${++count}`);
  URL.revokeObjectURL = vi.fn();
});

describe('noteAttachments', () => {
  it('fromUrls 는 업로드가 끝난 첨부로 바꾼다', () => {
    const result = fromUrls(['a', 'b']);

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.url)).toEqual(['a', 'b']);
    expect(result.map((item) => item.previewUrl)).toEqual(['a', 'b']);
    expect(result[0].file).toBeUndefined();
    expect(new Set(result.map((item) => item.id)).size).toBe(2);
  });

  it('3장 있을 때 4장을 더하면 5장까지만 담고 2장은 dropped 로 센다', () => {
    const current: NoteAttachment[] = fromUrls(['a', 'b', 'c']);
    const files = [1, 2, 3, 4].map((n) => image(`${n}.png`));

    const { next, dropped } = addFiles(current, files);

    expect(next).toHaveLength(5);
    expect(dropped).toBe(2);
    expect(next.slice(0, 3)).toEqual(current);
    expect(next.slice(3).map((item) => item.file)).toEqual([files[0], files[1]]);
    expect(next[3].previewUrl).toMatch(/^blob:/);
  });

  it('image/* 가 아닌 파일은 거르고 dropped 에 세지 않는다', () => {
    const { next, dropped } = addFiles([], [image('a.png'), image('b.pdf', 'application/pdf'), image('c.heic', 'image/heic')]);

    expect(next.map((item) => item.file?.name)).toEqual(['a.png', 'c.heic']);
    expect(dropped).toBe(0);
  });
});
