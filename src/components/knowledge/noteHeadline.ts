import type { KnowledgeNote } from '@/types/knowledgeNote';
import { stripFenceLines } from '@/lib/noteContent';

export interface NoteHeadline {
  text: string;
  kind: 'title' | 'content' | 'image';
}

/** 접힌 메모 카드에 보일 한 줄. 제목 → 내용의 첫 번째 비어 있지 않은 줄 → "이미지 메모" 순이다. */
export const noteHeadline = (note: Pick<KnowledgeNote, 'title' | 'content'>): NoteHeadline => {
  const title = note.title?.trim();
  if (title) return { text: title, kind: 'title' };

  // 코드블록 펜스(```sql 등) 줄은 내용이 아니므로 건너뛴다.
  const firstLine = (note.content ? stripFenceLines(note.content) : undefined)
    ?.split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (firstLine) return { text: firstLine, kind: 'content' };

  return { text: '이미지 메모', kind: 'image' };
};
