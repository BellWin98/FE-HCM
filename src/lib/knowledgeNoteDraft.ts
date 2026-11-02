import type { KnowledgeCategory, KnowledgeNoteInput } from '@/types/knowledgeNote';
import { KNOWLEDGE_CATEGORIES } from '@/types/knowledgeNote';

/** 마지막으로 저장한 메모의 분야·출처. 연달아 메모할 때 같은 값을 다시 넣지 않게 한다. */
export type KnowledgeLastContext = Pick<KnowledgeNoteInput, 'category' | 'sourceUrl' | 'sourceText'>;

const STORAGE_KEY = 'hcm.knowledgeNote.lastContext';

const isCategory = (value: unknown): value is KnowledgeCategory =>
  typeof value === 'string' && (KNOWLEDGE_CATEGORIES as string[]).includes(value);

/** localStorage 는 시크릿 모드·차단 설정에서 접근만 해도 throw 하므로 모든 접근을 감싼다. */
export const loadLastContext = (): KnowledgeLastContext | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { category, sourceUrl, sourceText } = parsed as Record<string, unknown>;
    if (!isCategory(category)) return null;
    return {
      category,
      ...(typeof sourceUrl === 'string' && sourceUrl ? { sourceUrl } : {}),
      ...(typeof sourceText === 'string' && sourceText ? { sourceText } : {}),
    };
  } catch {
    return null;
  }
};

export const saveLastContext = (context: KnowledgeLastContext): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch {
    // 기억을 못 할 뿐 저장 자체에는 영향이 없다.
  }
};

export const clearLastContext = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 위와 같다.
  }
};
