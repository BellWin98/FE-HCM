import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkoutRecord, WorkoutRoomDetail } from '@/types';
import { MyActivityCard } from '@/components/dashboard/MyActivityCard';
import { readWorkoutTimer, writeWorkoutTimer } from '@/lib/workoutTimer';

/**
 * 대시보드 "내 활동" 카드 안의 운동 측정.
 *
 * 시작 시각만 폰(localStorage)에 저장하므로, 카드를 새로 그려도(앱을 닫았다 연 경우) 운동 중 상태로 돌아와야 한다.
 */

const room = (todayRecord: WorkoutRecord | null = null): WorkoutRoomDetail =>
  ({
    workoutRoomInfo: { id: 1, name: '테스트방', ownerNickname: '헬창', minWeeklyWorkouts: 3 },
    currentMemberTodayWorkoutRecord: todayRecord,
    workoutRoomMembers: [],
  }) as unknown as WorkoutRoomDetail;

const renderCard = (todayRecord: WorkoutRecord | null = null) => {
  const onWorkoutUpload = vi.fn();
  const utils = render(
    <MyActivityCard
      currentWorkoutRoom={room(todayRecord)}
      onWorkoutUpload={onWorkoutUpload}
      onRestRegister={vi.fn()}
    />
  );
  return { ...utils, onWorkoutUpload };
};

describe('MyActivityCard 운동 측정', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('운동 시작을 누르면 운동 중 상태로 바뀐다', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: '운동 시작' }));

    expect(screen.getByText(/운동 중/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '운동 종료' })).toBeInTheDocument();
    expect(readWorkoutTimer()?.endedAt).toBeNull();
  });

  it('카드를 새로 그려도 저장된 시작 시각으로 경과 시간을 이어서 보여 준다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 22, 19, 47, 12));
    writeWorkoutTimer({ startedAt: new Date(2026, 9, 22, 19, 0, 0).getTime(), endedAt: null });

    renderCard();

    expect(screen.getByText('00:47:12')).toBeInTheDocument();
    expect(screen.getByText('19:00 시작')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('00:47:13')).toBeInTheDocument();
  });

  it('운동 종료를 누르면 종료 시각을 저장하고 인증 화면으로 보낸다', async () => {
    const user = userEvent.setup();
    writeWorkoutTimer({ startedAt: Date.now() - 30 * 60 * 1000, endedAt: null });
    const { onWorkoutUpload } = renderCard();

    await user.click(screen.getByRole('button', { name: '운동 종료' }));

    expect(readWorkoutTimer()?.endedAt).not.toBeNull();
    expect(onWorkoutUpload).toHaveBeenCalledTimes(1);
  });

  it('종료 후 인증하지 않고 돌아오면 측정 시간과 함께 인증하기를 보여 준다', () => {
    const startedAt = Date.now() - 48 * 60 * 1000;
    writeWorkoutTimer({ startedAt, endedAt: Date.now() });

    renderCard();

    expect(screen.getByText(/측정 완료 · 48분/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '인증하기' })).toBeInTheDocument();
  });

  it('취소를 누르면 측정을 지우고 원래 카드로 돌아간다', async () => {
    const user = userEvent.setup();
    writeWorkoutTimer({ startedAt: Date.now(), endedAt: null });
    renderCard();

    await user.click(screen.getByRole('button', { name: '측정 취소' }));

    expect(readWorkoutTimer()).toBeNull();
    expect(screen.getByRole('button', { name: '운동 시작' })).toBeInTheDocument();
  });

  it('오늘 이미 인증했으면 운동 시작 버튼을 숨긴다', () => {
    renderCard({
      id: 1,
      workoutDate: '2026-10-22',
      workoutTypes: ['등'],
      duration: 45,
      imageUrls: [],
      createdAt: new Date().toISOString(),
    } as unknown as WorkoutRecord);

    expect(screen.queryByRole('button', { name: '운동 시작' })).not.toBeInTheDocument();
  });
});
