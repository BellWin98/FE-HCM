import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readWorkoutTimer, writeWorkoutTimer } from '@/lib/workoutTimer';

/**
 * 운동 측정을 마치고 넘어온 인증 화면.
 *
 * 측정 시간은 편의상 채워 주는 값일 뿐이라 수정할 수 있어야 하고, 인증에 성공하면 측정 기록을 지운다.
 */

const uploadWorkout = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    uploadWorkout: (...args: unknown[]) => uploadWorkout(...args),
    getWorkoutRoomDetail: vi.fn(),
  },
}));

vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ member: { nickname: '헬창' } }),
}));

const { WorkoutUploadPage } = await import('@/pages/WorkoutUploadPage');

const MINUTE = 60 * 1000;

const renderPage = () =>
  render(
    <MemoryRouter>
      <WorkoutUploadPage />
    </MemoryRouter>
  );

describe('WorkoutUploadPage 운동 측정 연동', () => {
  beforeEach(() => {
    localStorage.clear();
    uploadWorkout.mockReset();
  });

  it('측정을 마친 기록이 있으면 운동 시간을 채워 준다', () => {
    const endedAt = Date.now();
    writeWorkoutTimer({ startedAt: endedAt - 48 * MINUTE, endedAt });

    renderPage();

    expect(screen.getByLabelText('운동 시간 (분) *')).toHaveValue(48);
  });

  it('채워 준 운동 시간은 직접 고칠 수 있다', async () => {
    const user = userEvent.setup();
    const endedAt = Date.now();
    writeWorkoutTimer({ startedAt: endedAt - 48 * MINUTE, endedAt });
    renderPage();

    const input = screen.getByLabelText('운동 시간 (분) *');
    await user.clear(input);
    await user.type(input, '60');

    expect(input).toHaveValue(60);
  });

  it('측정이 아직 진행 중이면 운동 시간을 채우지 않는다', () => {
    writeWorkoutTimer({ startedAt: Date.now() - 48 * MINUTE, endedAt: null });

    renderPage();

    expect(screen.getByLabelText('운동 시간 (분) *')).toHaveValue(null);
  });

  it('720분을 넘긴 측정은 시간을 비우고 직접 입력하라고 안내한다', () => {
    const endedAt = Date.now();
    writeWorkoutTimer({ startedAt: endedAt - 800 * MINUTE, endedAt });

    renderPage();

    expect(screen.getByLabelText('운동 시간 (분) *')).toHaveValue(null);
    expect(screen.getByText(/종료를 잊으셨나요\?/)).toBeInTheDocument();
  });

  it('카메라 촬영과 앨범 선택을 따로 제공한다', () => {
    renderPage();

    expect(screen.getByLabelText('카메라로 촬영')).toHaveAttribute('capture', 'environment');
    expect(screen.getByLabelText('앨범에서 선택')).not.toHaveAttribute('capture');
  });

  it('인증에 성공하면 측정 기록을 지운다', async () => {
    const user = userEvent.setup();
    const endedAt = Date.now();
    writeWorkoutTimer({ startedAt: endedAt - 48 * MINUTE, endedAt });
    uploadWorkout.mockResolvedValue({ memberTotalWorkoutDays: 10 });
    renderPage();

    const photo = new File(['x'], 'gym.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText('앨범에서 선택'), photo);
    await user.click(screen.getByLabelText('헬스(등)'));
    await user.click(screen.getByRole('button', { name: '운동 인증하기' }));

    expect(uploadWorkout).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 48 }),
      [photo]
    );
    expect(readWorkoutTimer()).toBeNull();
  });
});
