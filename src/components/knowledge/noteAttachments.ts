import { MAX_NOTE_IMAGES } from '@/types/knowledgeNote';

/** 메모에 붙은 이미지 한 장. `url` 이 있으면 이미 서버에 올라간 것이고, 없으면 저장할 때 올릴 `file` 이다. */
export type NoteAttachment = { id: string; previewUrl: string; file?: File; url?: string };

let sequence = 0;
const nextId = (): string => `note-attachment-${++sequence}`;

/** 이미 올라간 이미지 URL 들을 첨부 목록으로 바꾼다. */
export const fromUrls = (urls: string[]): NoteAttachment[] =>
  urls.map((url) => ({ id: nextId(), previewUrl: url, url }));

/**
 * 새 파일을 첨부 목록 뒤에 붙인다. 이미지가 아닌 파일은 조용히 거르고, 최대 장수를 넘는 이미지는
 * 버린 뒤 그 수를 `dropped` 로 돌려준다.
 */
export const addFiles = (
  current: NoteAttachment[],
  files: File[]
): { next: NoteAttachment[]; dropped: number } => {
  const images = files.filter((file) => file.type.startsWith('image/'));
  const room = Math.max(0, MAX_NOTE_IMAGES - current.length);
  const accepted = images.slice(0, room);
  const added = accepted.map((file) => ({ id: nextId(), previewUrl: URL.createObjectURL(file), file }));
  return { next: [...current, ...added], dropped: images.length - accepted.length };
};

/** 로컬 파일로 만든 미리보기 URL 만 해제한다(서버 URL 은 건드리지 않는다). */
export const revokePreview = (attachment: NoteAttachment): void => {
  if (attachment.previewUrl.startsWith('blob:')) URL.revokeObjectURL(attachment.previewUrl);
};
