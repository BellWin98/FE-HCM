import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactionCount, WorkoutSocialSummary } from '@/types';

/**
 * 운동 인증 리액션 바.
 *
 * 서버는 "리액션이 하나라도 달린 이모지"만 내려주므로, 화면에는 집계 알약과 별개로
 * 전체 이모지를 고를 수 있는 피커가 있어야 한다. 또 같은 이모지를 다시 누르면 취소,
 * 다른 이모지를 누르면 교체가 되어야 한다(한 사람당 인증 하나에 이모지 하나).
 */

const reactToWorkout = vi.fn();
const cancelWorkoutReaction = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    reactToWorkout: (...args: unknown[]) => reactToWorkout(...args),
    cancelWorkoutReaction: (...args: unknown[]) => cancelWorkoutReaction(...args),
    getWorkoutComments: vi.fn().mockResolvedValue({ content: [], last: true, totalPages: 0, number: 0, size: 20 }),
    addWorkoutComment: vi.fn(),
    deleteWorkoutComment: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const { WorkoutSocialBar } = await import('@/components/WorkoutSocialBar');

const summary = (reactions: ReactionCount[], commentCount = 0): WorkoutSocialSummary => ({
  reactions,
  commentCount,
});

describe('운동 인증 리액션 바', () => {
  beforeEach(() => {
    reactToWorkout.mockReset();
    cancelWorkoutReaction.mockReset();
  });

  it('집계된 이모지를 개수와 함께 보여준다', () => {
    render(
      <WorkoutSocialBar
        recordId={1}
        reactions={[{ emoji: 'MUSCLE', symbol: '💪', count: 3, reactedByMe: false }]}
        commentCount={2}
      />,
    );

    expect(screen.getByRole('button', { name: /근성 리액션 3개/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /댓글 2개/ })).toBeInTheDocument();
  });

  it('피커에서 이모지를 고르면 해당 이모지로 리액션한다', async () => {
    const user = userEvent.setup();
    reactToWorkout.mockResolvedValue(
      summary([{ emoji: 'FIRE', symbol: '🔥', count: 1, reactedByMe: true }]),
    );
    render(<WorkoutSocialBar recordId={1} reactions={[]} commentCount={0} />);

    await user.click(screen.getByRole('button', { name: '리액션 남기기' }));
    await user.click(screen.getByRole('button', { name: '불타오르네' }));

    await waitFor(() => expect(reactToWorkout).toHaveBeenCalledWith(1, 'FIRE'));
    expect(await screen.findByRole('button', { name: /불타오르네 리액션 1개/ })).toBeInTheDocument();
  });

  it('내가 누른 이모지를 다시 누르면 리액션을 취소한다', async () => {
    const user = userEvent.setup();
    cancelWorkoutReaction.mockResolvedValue(summary([]));
    render(
      <WorkoutSocialBar
        recordId={1}
        reactions={[{ emoji: 'MUSCLE', symbol: '💪', count: 1, reactedByMe: true }]}
        commentCount={0}
      />,
    );

    await user.click(screen.getByRole('button', { name: /근성 리액션 1개/ }));

    await waitFor(() => expect(cancelWorkoutReaction).toHaveBeenCalledWith(1));
    expect(reactToWorkout).not.toHaveBeenCalled();
  });

  it('남이 누른 이모지를 누르면 그 이모지로 리액션한다', async () => {
    const user = userEvent.setup();
    reactToWorkout.mockResolvedValue(
      summary([{ emoji: 'CLAP', symbol: '👏', count: 2, reactedByMe: true }]),
    );
    render(
      <WorkoutSocialBar
        recordId={1}
        reactions={[{ emoji: 'CLAP', symbol: '👏', count: 1, reactedByMe: false }]}
        commentCount={0}
      />,
    );

    await user.click(screen.getByRole('button', { name: /박수 리액션 1개/ }));

    await waitFor(() => expect(reactToWorkout).toHaveBeenCalledWith(1, 'CLAP'));
    expect(cancelWorkoutReaction).not.toHaveBeenCalled();
  });

  it('갱신된 집계를 부모에게 전달한다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const updated = summary([{ emoji: 'PARTY', symbol: '🎉', count: 1, reactedByMe: true }], 5);
    reactToWorkout.mockResolvedValue(updated);
    render(<WorkoutSocialBar recordId={9} reactions={[]} commentCount={5} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '리액션 남기기' }));
    await user.click(screen.getByRole('button', { name: '축하' }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(updated));
  });

  it('props 로 받은 집계가 바뀌면 화면에 반영한다', () => {
    const { rerender } = render(
      <WorkoutSocialBar recordId={1} reactions={[]} commentCount={0} />,
    );
    expect(screen.queryByRole('button', { name: /근성 리액션/ })).not.toBeInTheDocument();

    rerender(
      <WorkoutSocialBar
        recordId={1}
        reactions={[{ emoji: 'MUSCLE', symbol: '💪', count: 7, reactedByMe: false }]}
        commentCount={0}
      />,
    );

    expect(screen.getByRole('button', { name: /근성 리액션 7개/ })).toBeInTheDocument();
  });

  it('피커는 포털 없이 인라인으로 열려 바깥 팝오버를 닫지 않는다', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <WorkoutSocialBar recordId={1} reactions={[]} commentCount={0} />,
    );

    expect(screen.queryByRole('button', { name: '근성' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '리액션 남기기' }));

    // 이모지 버튼이 컴포넌트 DOM 안(포털 밖)에 렌더되어야 한다.
    // 포털을 쓰면 운동방 화면에서 팝오버 중첩으로 바깥 팝오버가 닫힌다.
    expect(within(container).getByRole('button', { name: '근성' })).toBeInTheDocument();
  });
});
