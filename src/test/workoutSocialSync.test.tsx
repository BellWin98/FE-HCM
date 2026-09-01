import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkoutRoomDetail } from '@/types';

/**
 * 같은 인증이 "이번주 운동 현황"(MemberStatus)과 "월별 운동 현황"(달력)에 동시에 그려진다.
 * 집계를 운동방 단위 저장소에서 한 벌만 들고 있으므로, 한쪽에서 남긴 리액션/댓글이
 * 새로고침 없이 다른 쪽에도 그대로 보여야 한다.
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

const { MyWorkoutRoom } = await import('@/components/MyWorkoutRoom');
const { WorkoutSocialProvider } = await import('@/contexts/WorkoutSocialContext');

const RECORD_ID = 55;
// 달력에서 인접 월 날짜(1~12일, 24~31일)와 겹치지 않는 날로 "오늘"을 고정한다.
const FIXED_TODAY = new Date(2026, 8, 15, 12, 0, 0);
const TODAY_LABEL = '15';

const room = (): WorkoutRoomDetail =>
  ({
    workoutRoomInfo: {
      id: 1,
      name: '테스트방',
      ownerNickname: '헬창',
      minWeeklyWorkouts: 3,
      penaltyEnabled: false,
    },
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
        joinedAt: FIXED_TODAY.toISOString(),
        restInfoList: [],
        workoutRecords: [
          {
            id: RECORD_ID,
            workoutDate: format(FIXED_TODAY, 'yyyy-MM-dd'),
            workoutTypes: ['가슴'],
            duration: 50,
            imageUrls: [],
            createdAt: FIXED_TODAY.toISOString(),
            reactions: [],
            commentCount: 0,
          },
        ],
      },
    ],
  }) as unknown as WorkoutRoomDetail;

const renderRoom = () => {
  const detail = room();

  return render(
    <WorkoutSocialProvider workoutRoom={detail}>
      <MyWorkoutRoom
        currentWorkoutRoom={detail}
        today={FIXED_TODAY}
        currentMember={{ nickname: '헬창' }}
        onRegenerateEntryCode={vi.fn()}
        isRegeneratingEntryCode={false}
        onOpenPenaltySchedule={vi.fn()}
      />
    </WorkoutSocialProvider>,
  );
};

/** 이번주 운동 현황의 "오늘 인증" 팝오버 */
const openWeeklyPopover = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText('오늘 인증'));
};

/** 월별 운동 현황(달력)의 "인증" 팝오버 */
const openCalendarPopover = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText(TODAY_LABEL));
  await user.click(await screen.findByText('인증'));
};

describe('이번주/월별 운동 현황의 리액션·댓글 동기화', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(FIXED_TODAY);
    reactToWorkout.mockReset();
    addWorkoutComment.mockReset();
    getWorkoutComments.mockReset();
    getWorkoutComments.mockResolvedValue({ content: [], last: true, totalElements: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('이번주 현황에서 남긴 리액션이 달력 팝오버에도 보인다', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    reactToWorkout.mockResolvedValue({
      reactions: [{ emoji: 'FIRE', symbol: '🔥', count: 1, reactedByMe: true }],
      commentCount: 0,
    });
    renderRoom();

    await openWeeklyPopover(user);
    await user.click(await screen.findByRole('button', { name: '리액션 남기기' }));
    await user.click(screen.getByRole('button', { name: '불타오르네' }));
    await waitFor(() => expect(reactToWorkout).toHaveBeenCalledWith(RECORD_ID, 'FIRE'));

    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '리액션 남기기' })).not.toBeInTheDocument(),
    );

    await openCalendarPopover(user);
    expect(await screen.findByRole('button', { name: /불타오르네 리액션 1개/ })).toBeInTheDocument();
  });

  it('달력에서 등록한 댓글 수가 이번주 현황에도 보인다', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    addWorkoutComment.mockResolvedValue({
      id: 1,
      memberId: 1,
      nickname: '헬창',
      profileUrl: '',
      content: '화이팅!',
      createdAt: FIXED_TODAY.toISOString(),
      mine: true,
    });
    renderRoom();

    await openCalendarPopover(user);
    await user.click(await screen.findByRole('button', { name: '댓글 0개' }));

    await user.type(await screen.findByLabelText('댓글 입력'), '화이팅!');
    await user.click(screen.getByRole('button', { name: '댓글 등록' }));
    await waitFor(() => expect(addWorkoutComment).toHaveBeenCalledWith(RECORD_ID, '화이팅!'));

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByLabelText('댓글 입력')).not.toBeInTheDocument());

    await openWeeklyPopover(user);
    expect(await screen.findByRole('button', { name: '댓글 1개' })).toBeInTheDocument();
  });
});
