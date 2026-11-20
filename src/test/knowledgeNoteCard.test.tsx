import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeNote } from '@/types/knowledgeNote';
import { KnowledgeNoteCard } from '@/components/knowledge/KnowledgeNoteCard';

const baseNote: KnowledgeNote = {
  id: 1,
  category: 'DEV',
  title: null,
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

const renderCard = (note: Partial<KnowledgeNote> = {}, currentMemberId?: number, onStockClick = vi.fn()) =>
  render(
    <KnowledgeNoteCard
      note={{ ...baseNote, ...note }}
      currentMemberId={currentMemberId}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onTagClick={vi.fn()}
      onStockClick={onStockClick}
    />
  );

const headline = (name: string | RegExp = /내용/) => screen.getByRole('button', { name });

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

  it('card_notEditable_hidesEditAndDelete', async () => {
    renderCard({ editable: false });
    await userEvent.click(headline());
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull();
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull();
  });

  it('card_editable_showsEditAndDelete', async () => {
    renderCard();
    await userEvent.click(headline());
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });

  it('card_collapsed_showsHeadlineOnly', () => {
    renderCard({ title: 'HBM 메모', content: '본문 전체', tags: ['반도체'] });

    expect(headline(/HBM 메모/)).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('HBM 메모')).toHaveClass('truncate');
    expect(screen.queryByText('본문 전체')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull();
  });

  it('card_toggle_expandsAndCollapses', async () => {
    renderCard({ title: 'HBM 메모', content: '본문 전체', tags: ['반도체'] });

    await userEvent.click(headline(/HBM 메모/));
    expect(headline(/HBM 메모/)).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('본문 전체')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '#반도체' })).toBeInTheDocument();

    await userEvent.click(headline(/HBM 메모/));
    expect(screen.queryByText('본문 전체')).not.toBeInTheDocument();
  });

  it('card_toggle_keyboard', async () => {
    renderCard({ title: 'HBM 메모' });

    headline(/HBM 메모/).focus();
    await userEvent.keyboard('{Enter}');
    expect(headline(/HBM 메모/)).toHaveAttribute('aria-expanded', 'true');
  });

  it('card_stockBadgeClick_doesNotExpand', async () => {
    const onStockClick = vi.fn();
    renderCard({ category: 'STOCK', stockSymbol: '005930', stockName: '삼성전자' }, undefined, onStockClick);

    await userEvent.click(screen.getByRole('button', { name: '삼성전자 메모만 보기' }));

    expect(onStockClick).toHaveBeenCalled();
    expect(headline()).toHaveAttribute('aria-expanded', 'false');
  });

  it('card_imageOnly_showsImageCount', () => {
    renderCard({ content: null, images: ['https://cdn/a.png', 'https://cdn/b.png'] });

    expect(headline(/이미지 메모/)).toBeInTheDocument();
    expect(screen.getByText('이미지 2장')).toBeInTheDocument();
  });

  it('card_imageOnly_collapsedShowsFirstImageThumbnail', () => {
    const { container } = renderCard({ content: null, images: ['https://cdn/a.png', 'https://cdn/b.png'] });

    const thumbs = headline(/이미지 메모/).querySelectorAll('img');
    expect(thumbs).toHaveLength(1);
    expect(thumbs[0]).toHaveAttribute('src', 'https://cdn/a.png');
    expect(thumbs[0]).toHaveAttribute('alt', '');
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });

  it('card_withContent_collapsedHasNoThumbnail', () => {
    renderCard({ content: '본문', images: ['https://cdn/a.png'] });

    expect(headline(/본문/).querySelector('img')).toBeNull();
  });
});
