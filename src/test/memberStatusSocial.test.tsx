import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkoutRoomDetail } from '@/types';

/**
 * 이번주 운동 현황의 "오늘 인증" 팝오버 안의 리액션/댓글.
 *
 * 달력 팝오버(MyWorkoutRoom)와 같은 이유로, 소셜 바는 팝오버가 닫힐 때 함께 언마운트되어
 * 자기 상태를 잃는다. 부모가 갱신된 집계를 들고 있어야 새로고침 없이 유지된다.
 */

const reactToWorkout = vi.fn();
const getWorkoutComments = vi.fn();
const addWorkoutComment = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    reactToWorkout: (...args: unknown[]) => reactToWorkout(...args),
    cancelWorkoutReaction: vi.fn(),
    getWorkoutComments: (...args: unknown[]) => getWorkoutComments(...args),
    addWorkoutComment: (...args: unknown[]) => addWorkoutComment(...args),
    deleteWorkoutComment: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const { MemberStatus } = await import('@/components/MemberStatus');
const { WorkoutSocialProvider } = await import('@/contexts/WorkoutSocialContext');

const RECORD_ID = 91;
const now = new Date();

const room = (): WorkoutRoomDetail =>
  ({
    workoutRoomInfo: { id: 1, name: '테스트방', ownerNickname: '헬창', minWeeklyWorkouts: 3 },
    currentMemberTodayWorkoutRecord: null,
    workoutRoomMembers: [
      {
        id: 1,
        nickname: '헬창',
        profileUrl: '',
        totalWorkouts: 3,
        weeklyWorkouts: 1,
        totalPenalty: 0,
        isOnBreak: false,
        joinedAt: now.toISOString(),
        restInfoList: [],
        workoutRecords: [
          {
            id: RECORD_ID,
            workoutDate: format(now, 'yyyy-MM-dd'),
            workoutTypes: ['등'],
            duration: 45,
            imageUrls: [],
            createdAt: now.toISOString(),
            reactions: [],
            commentCount: 0,
          },
        ],
      },
    ],
  }) as unknown as WorkoutRoomDetail;

const renderStatus = () => {
  const detail = room();

  return render(
    <WorkoutSocialProvider workoutRoom={detail}>
      <MemberStatus currentWorkoutRoom={detail} today={now} />
    </WorkoutSocialProvider>,
  );
};

const openRecordPopover = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText('오늘 인증'));
};

describe('이번주 운동 현황 팝오버의 리액션/댓글', () => {
  beforeEach(() => {
    reactToWorkout.mockReset();
    addWorkoutComment.mockReset();
    getWorkoutComments.mockReset();
    getWorkoutComments.mockResolvedValue({ content: [], last: true, totalElements: 0 });
  });

  it('리액션을 남기면 팝오버를 다시 열어도 유지된다', async () => {
    const user = userEvent.setup();
    reactToWorkout.mockResolvedValue({
      reactions: [{ emoji: 'FIRE', symbol: '🔥', count: 1, reactedByMe: true }],
      commentCount: 0,
    });
    renderStatus();

    await openRecordPopover(user);
    await user.click(await screen.findByRole('button', { name: '리액션 남기기' }));
    await user.click(screen.getByRole('button', { name: '불타오르네' }));

    await waitFor(() => expect(reactToWorkout).toHaveBeenCalledWith(RECORD_ID, 'FIRE'));
    expect(await screen.findByRole('button', { name: /불타오르네 리액션 1개/ })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '리액션 남기기' })).not.toBeInTheDocument(),
    );

    await openRecordPopover(user);
    expect(await screen.findByRole('button', { name: /불타오르네 리액션 1개/ })).toBeInTheDocument();
  });

  it('댓글을 등록하면 팝오버의 댓글 수가 갱신된다', async () => {
    const user = userEvent.setup();
    addWorkoutComment.mockResolvedValue({
      id: 1,
      memberId: 1,
      nickname: '헬창',
      profileUrl: '',
      content: '화이팅!',
      createdAt: new Date().toISOString(),
      mine: true,
    });
    renderStatus();

    await openRecordPopover(user);
    await user.click(await screen.findByRole('button', { name: '댓글 0개' }));

    await user.type(await screen.findByLabelText('댓글 입력'), '화이팅!');
    await user.click(screen.getByRole('button', { name: '댓글 등록' }));
    await waitFor(() => expect(addWorkoutComment).toHaveBeenCalledWith(RECORD_ID, '화이팅!'));

    // 다이얼로그를 닫고 팝오버를 다시 연다 — 새로고침 없이 댓글 수가 갱신되어 있어야 한다.
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByLabelText('댓글 입력')).not.toBeInTheDocument());

    await openRecordPopover(user);
    expect(await screen.findByRole('button', { name: '댓글 1개' })).toBeInTheDocument();
  });
});
