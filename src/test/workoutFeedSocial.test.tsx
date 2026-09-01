import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { WorkoutFeedItem } from '@/types';

/**
 * 마이페이지 피드의 리액션/댓글 표시.
 *
 * 운동 인증 한 번은 참여 중인 방 수만큼 레코드로 저장되고 피드는 그걸 하루 한 장으로 묶는다.
 * 리액션/댓글은 방마다 따로 달리므로, 카드에는 방 전체 합계를 보여주되 실제로 댓글을 열 때는
 * 방을 고르게 해야 한다.
 */

vi.mock('@/lib/api', () => ({
  api: {
    getWorkoutComments: vi.fn().mockResolvedValue({ content: [], last: true, totalPages: 0, number: 0, size: 20 }),
    addWorkoutComment: vi.fn(),
    deleteWorkoutComment: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const { WorkoutFeedSocial } = await import('@/components/WorkoutFeedSocial');

const item = (overrides: Partial<WorkoutFeedItem> = {}): WorkoutFeedItem => ({
  id: 11,
  workoutDate: '2026-08-30',
  workoutTypes: ['러닝'],
  duration: 30,
  imageUrls: [],
  createdAt: '2026-08-30T10:00:00',
  reactions: [{ emoji: 'MUSCLE', symbol: '💪', count: 3, reactedByMe: false }],
  commentCount: 4,
  rooms: [
    {
      roomId: 100,
      roomName: 'A방',
      recordId: 10,
      reactions: [{ emoji: 'MUSCLE', symbol: '💪', count: 2, reactedByMe: false }],
      commentCount: 3,
    },
    {
      roomId: 200,
      roomName: 'B방',
      recordId: 11,
      reactions: [{ emoji: 'MUSCLE', symbol: '💪', count: 1, reactedByMe: false }],
      commentCount: 1,
    },
  ],
  ...overrides,
});

describe('마이페이지 피드 리액션/댓글', () => {
  it('방 전체를 합친 리액션과 댓글 수를 보여준다', () => {
    render(<WorkoutFeedSocial item={item()} onCommentCountChange={vi.fn()} />);

    expect(screen.getByLabelText(/근성 리액션 3개/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '댓글 4개' })).toBeInTheDocument();
  });

  it('여러 방에 저장된 인증은 방별 내역을 펼쳐서 보여준다', async () => {
    const user = userEvent.setup();
    render(<WorkoutFeedSocial item={item()} onCommentCountChange={vi.fn()} />);

    expect(screen.queryByText('A방')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /방 2개/ }));

    const roomList = screen.getByRole('list');
    expect(within(roomList).getByText('A방')).toBeInTheDocument();
    expect(within(roomList).getByRole('button', { name: 'A방 댓글 3개' })).toBeInTheDocument();
    expect(within(roomList).getByRole('button', { name: 'B방 댓글 1개' })).toBeInTheDocument();
  });

  it('방이 하나면 댓글 버튼이 그 방의 댓글을 바로 연다', async () => {
    const user = userEvent.setup();
    const single = item({
      commentCount: 3,
      rooms: [
        {
          roomId: 100,
          roomName: 'A방',
          recordId: 10,
          reactions: [],
          commentCount: 3,
        },
      ],
    });
    render(<WorkoutFeedSocial item={single} onCommentCountChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '댓글 3개' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
