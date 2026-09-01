import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkoutRoomDetail } from '@/types';

/**
 * 월별 운동 현황(달력) 팝오버 안의 리액션/댓글.
 *
 * 팝오버 안의 `WorkoutSocialBar` 는 팝오버가 닫힐 때 함께 언마운트되므로 자기 상태만으로는
 * 갱신된 집계를 지킬 수 없다. 부모가 집계를 받아 들고 있어야 팝오버를 다시 열어도
 * (새로고침 없이) 방금 남긴 리액션과 댓글 수가 그대로 보인다.
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

// 이 테스트의 관심사는 달력 팝오버뿐이다.
vi.mock('@/components/MemberStatus', () => ({ default: () => null }));

const { MyWorkoutRoom } = await import('@/components/MyWorkoutRoom');
const { WorkoutSocialProvider } = await import('@/contexts/WorkoutSocialContext');

const RECORD_ID = 77;
const now = new Date();
// 달력의 인접 월 날짜(1~12일, 24~31일)와 겹치지 않는 날을 고른다.
const targetDate = new Date(now.getFullYear(), now.getMonth(), 15);
const targetDayLabel = '15';

const room = (): WorkoutRoomDetail =>
  ({
    workoutRoomInfo: null,
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
            workoutDate: format(targetDate, 'yyyy-MM-dd'),
            workoutTypes: ['하체'],
            duration: 60,
            imageUrls: [],
            createdAt: targetDate.toISOString(),
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
        today={now}
        currentMember={{ nickname: '헬창' }}
        onRegenerateEntryCode={vi.fn()}
        isRegeneratingEntryCode={false}
        onOpenPenaltySchedule={vi.fn()}
      />
    </WorkoutSocialProvider>,
  );
};

/** 달력에서 날짜를 눌러 멤버 목록 팝오버를 열고, 다시 "인증" 배지를 눌러 상세 팝오버를 연다. */
const openRecordPopover = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText(targetDayLabel));
  await user.click(await screen.findByText('인증'));
};

describe('월별 운동 현황 팝오버의 리액션/댓글', () => {
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
    renderRoom();

    await openRecordPopover(user);
    await user.click(await screen.findByRole('button', { name: '리액션 남기기' }));
    await user.click(screen.getByRole('button', { name: '불타오르네' }));

    await waitFor(() => expect(reactToWorkout).toHaveBeenCalledWith(RECORD_ID, 'FIRE'));
    expect(await screen.findByRole('button', { name: /불타오르네 리액션 1개/ })).toBeInTheDocument();

    // 팝오버를 닫았다가 다시 연다 — 새로고침 없이도 남아 있어야 한다.
    await user.keyboard('{Escape}');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('인증')).not.toBeInTheDocument());

    await openRecordPopover(user);
    expect(await screen.findByRole('button', { name: /불타오르네 리액션 1개/ })).toBeInTheDocument();
  });

  it('댓글을 등록하면 팝오버의 댓글 수가 바로 늘어난다', async () => {
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
    renderRoom();

    await openRecordPopover(user);
    await user.click(await screen.findByRole('button', { name: '댓글 0개' }));

    await user.type(await screen.findByLabelText('댓글 입력'), '화이팅!');
    await user.click(screen.getByRole('button', { name: '댓글 등록' }));
    await waitFor(() => expect(addWorkoutComment).toHaveBeenCalledWith(RECORD_ID, '화이팅!'));

    // 다이얼로그를 닫고 팝오버를 다시 연다 — 새로고침 없이 댓글 수가 갱신되어 있어야 한다.
    // (모달 다이얼로그가 열리는 순간 뒤의 팝오버는 닫힌다.)
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByLabelText('댓글 입력')).not.toBeInTheDocument());

    await openRecordPopover(user);
    expect(await screen.findByRole('button', { name: '댓글 1개' })).toBeInTheDocument();
  });
});
