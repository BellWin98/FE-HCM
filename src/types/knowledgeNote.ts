export type KnowledgeCategory =
  | 'DEV'
  | 'REAL_ESTATE'
  | 'STOCK'
  | 'ECONOMY'
  | 'RESTAURANT'
  | 'CAFE'
  | 'TRAVEL'
  | 'ETC';

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  DEV: '개발',
  REAL_ESTATE: '부동산',
  STOCK: '주식',
  ECONOMY: '경제',
  RESTAURANT: '맛집',
  CAFE: '카페',
  TRAVEL: '여행지',
  ETC: '기타',
};

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  'DEV',
  'REAL_ESTATE',
  'STOCK',
  'ECONOMY',
  'RESTAURANT',
  'CAFE',
  'TRAVEL',
  'ETC',
];

export const MAX_NOTE_IMAGES = 5;

export const MAX_NOTE_TITLE_LENGTH = 100;

/** 내용 최대 길이. BE `KnowledgeNote.MAX_CONTENT_LENGTH` 와 같아야 한다. */
export const MAX_NOTE_CONTENT_LENGTH = 10000;

/** 이 길이를 넘으면 내용 칸 아래에 글자 수를 보여 준다. */
export const NOTE_CONTENT_COUNTER_THRESHOLD = 9000;

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
  title: string | null;
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
  title?: string;
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
