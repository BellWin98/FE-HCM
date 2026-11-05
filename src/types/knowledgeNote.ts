export type KnowledgeCategory = 'DEV' | 'REAL_ESTATE' | 'STOCK' | 'ETC';

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  DEV: '개발',
  REAL_ESTATE: '부동산',
  STOCK: '주식',
  ETC: '기타',
};

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = ['DEV', 'REAL_ESTATE', 'STOCK', 'ETC'];

export const MAX_NOTE_IMAGES = 5;

export const ALLOWED_NOTE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export type KnowledgeVisibility = 'PUBLIC' | 'PRIVATE';

export type KnowledgeNoteScope = 'MINE' | 'PUBLIC' | 'PRIVATE';

export interface KnowledgeNoteAuthor {
  id: number;
  nickname: string;
  profileUrl: string | null;
}

export interface KnowledgeNote {
  id: number;
  category: KnowledgeCategory;
  content: string | null;
  images: string[];
  sourceUrl: string | null;
  sourceText: string | null;
  tags: string[];
  stockSymbol: string | null;
  stockName: string | null;
  createdAt: string;
  updatedAt: string | null;
  visibility: KnowledgeVisibility;
  author: KnowledgeNoteAuthor;
  editable: boolean;
}

export interface KnowledgeNoteInput {
  category: KnowledgeCategory;
  content?: string;
  imageUrls: string[];
  sourceUrl?: string;
  sourceText?: string;
  tags: string[];
  stockSymbol?: string;
  stockName?: string;
  visibility?: KnowledgeVisibility;
}

export interface KnowledgeNoteSearchParams {
  keyword?: string;
  category?: KnowledgeCategory;
  stockSymbol?: string;
  scopes?: KnowledgeNoteScope[];
  page?: number;
  size?: number;
}

export interface KnowledgeAccessStatus {
  hasAccess: boolean;
  canRead: boolean;
  canWrite: boolean;
  isAdmin: boolean;
}

export interface KnowledgeAccessFlags {
  canRead: boolean;
  canWrite: boolean;
}

export interface KnowledgeAccessGrant extends KnowledgeAccessFlags {
  memberId: number;
  email: string;
  nickname: string;
  profileUrl: string | null;
  grantedBy: number | null;
  updatedAt: string | null;
}
