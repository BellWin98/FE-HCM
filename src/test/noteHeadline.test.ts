import { describe, expect, it } from 'vitest';
import { noteHeadline } from '@/components/knowledge/noteHeadline';

describe('noteHeadline', () => {
  it('제목이 있으면 제목', () => {
    expect(noteHeadline({ title: 'HBM', content: '본문' })).toEqual({ text: 'HBM', kind: 'title' });
  });

  it('제목이 없으면 첫 번째 비어 있지 않은 줄', () => {
    expect(noteHeadline({ title: null, content: '\n  \n둘째 줄\n셋째' })).toEqual({ text: '둘째 줄', kind: 'content' });
  });

  it('제목·내용이 없으면 이미지 메모', () => {
    expect(noteHeadline({ title: null, content: null })).toEqual({ text: '이미지 메모', kind: 'image' });
  });

  it('공백 제목은 없는 것으로 본다', () => {
    expect(noteHeadline({ title: '  ', content: '본문' }).kind).toBe('content');
  });
});
