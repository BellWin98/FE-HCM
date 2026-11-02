export type KnowledgeCategory = 'DEV' | 'REAL_ESTATE' | 'STOCK' | 'ETC';

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  DEV: '개발',
  REAL_ESTATE: '부동산',
  STOCK: '주식',
  ETC: '기타',
};

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = ['DEV', 'REAL_ESTATE', 'STOCK', 'ETC'];

export interface KnowledgeNote {
  id: number;
  category: KnowledgeCategory;
  content: string;
  sourceUrl: string | null;
  sourceText: string | null;
  tags: string[];
  stockSymbol: string | null;
  stockName: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface KnowledgeNoteInput {
  category: KnowledgeCategory;
  content: string;
  sourceUrl?: string;
  sourceText?: string;
  tags: string[];
  stockSymbol?: string;
  stockName?: string;
}

export interface KnowledgeNoteSearchParams {
  keyword?: string;
  category?: KnowledgeCategory;
  stockSymbol?: string;
  page?: number;
  size?: number;
}

export interface KnowledgeAccessStatus {
  hasAccess: boolean;
}
