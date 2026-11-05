import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { KnowledgeNote } from '@/types/knowledgeNote';
import { KnowledgeNoteCard } from '@/components/knowledge/KnowledgeNoteCard';

const baseNote: KnowledgeNote = {
  id: 1,
  category: 'DEV',
  content: '내용',
  images: [],
  sourceUrl: null,
  sourceText: null,
  tags: [],
  stockSymbol: null,
  stockName: null,
  createdAt: '2026-11-02T00:00:00',
  updatedAt: null,
  visibility: 'PUBLIC',
  author: { id: 7, nickname: '홍길동', profileUrl: null },
  editable: true,
};

const renderCard = (note: Partial<KnowledgeNote> = {}, currentMemberId?: number) =>
  render(
    <KnowledgeNoteCard
      note={{ ...baseNote, ...note }}
      currentMemberId={currentMemberId}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onTagClick={vi.fn()}
      onStockClick={vi.fn()}
    />
  );

describe('KnowledgeNoteCard', () => {
  it('card_showsAuthorNickname', () => {
    renderCard({}, 1);
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });

  it('card_ownNote_showsMe', () => {
    renderCard({}, 7);
    expect(screen.getByText('나')).toBeInTheDocument();
    expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
  });

  it('card_private_showsBadge', () => {
    renderCard({ visibility: 'PRIVATE' });
    expect(screen.getByText('비공개')).toBeInTheDocument();
  });

  it('card_public_hidesPrivateBadge', () => {
    renderCard();
    expect(screen.queryByText('비공개')).not.toBeInTheDocument();
  });

  it('card_notEditable_hidesEditAndDelete', () => {
    renderCard({ editable: false });
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull();
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull();
  });

  it('card_editable_showsEditAndDelete', () => {
    renderCard();
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });
});
