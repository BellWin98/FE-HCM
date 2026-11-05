import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('card_authorWithProfileUrl_showsProfileImage', async () => {
    // Radix Avatar 는 이미지가 로드된 뒤에만 <img> 를 그리므로 jsdom 에서 로드 성공을 흉내 낸다.
    vi.stubGlobal(
      'Image',
      class {
        private listeners: Record<string, (() => void)[]> = {};
        addEventListener(type: string, fn: () => void) {
          (this.listeners[type] ??= []).push(fn);
        }
        removeEventListener() {}
        set src(_value: string) {
          queueMicrotask(() => this.listeners.load?.forEach((fn) => fn()));
        }
      }
    );
    renderCard({ author: { id: 7, nickname: '홍길동', profileUrl: 'https://img.test/p.png' } });
    const img = await screen.findByRole('img', { name: '홍길동' });
    expect(img).toHaveAttribute('src', 'https://img.test/p.png');
  });

  it('card_authorWithoutProfileUrl_showsInitialFallback', () => {
    renderCard({}, 1);
    expect(screen.getByText('홍')).toBeInTheDocument();
  });

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
