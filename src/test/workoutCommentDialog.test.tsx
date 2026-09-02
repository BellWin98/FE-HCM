import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PageResponse, WorkoutComment } from '@/types';

/**
 * 운동 인증 댓글 다이얼로그.
 *
 * 댓글 수는 피드 카드의 배지와도 이어져 있으므로, 작성/삭제 후 부모에게 갱신된 수를
 * 알려주어야 화면이 어긋나지 않는다. 삭제 버튼은 본인 댓글(mine)에만 보여야 한다.
 */

const getWorkoutComments = vi.fn();
const addWorkoutComment = vi.fn();
const deleteWorkoutComment = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getWorkoutComments: (...args: unknown[]) => getWorkoutComments(...args),
    addWorkoutComment: (...args: unknown[]) => addWorkoutComment(...args),
    deleteWorkoutComment: (...args: unknown[]) => deleteWorkoutComment(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const { WorkoutCommentDialog } = await import('@/components/WorkoutCommentDialog');

const comment = (overrides: Partial<WorkoutComment> = {}): WorkoutComment => ({
  id: 1,
  memberId: 2,
  nickname: 'tester',
  content: '오늘도 화이팅!',
  createdAt: new Date().toISOString(),
  mine: false,
  ...overrides,
});

const page = (content: WorkoutComment[], totalElements = content.length): PageResponse<WorkoutComment> => ({
  content,
  last: true,
  totalPages: 1,
  totalElements,
  number: 0,
  size: 20,
});

describe('운동 인증 댓글 다이얼로그', () => {
  beforeEach(() => {
    getWorkoutComments.mockReset();
    addWorkoutComment.mockReset();
    deleteWorkoutComment.mockReset();
  });

  it('열리면 첫 페이지를 불러와 목록과 총 개수를 보여준다', async () => {
    getWorkoutComments.mockResolvedValue(page([comment({ content: '멋져요' })], 1));
    const onCommentCountChange = vi.fn();

    render(
      <WorkoutCommentDialog
        recordId={7}
        open
        onOpenChange={() => {}}
        onCommentCountChange={onCommentCountChange}
      />,
    );

    expect(await screen.findByText('멋져요')).toBeInTheDocument();
    expect(getWorkoutComments).toHaveBeenCalledWith(7, 0, 20);
    await waitFor(() => expect(onCommentCountChange).toHaveBeenCalledWith(1));
  });

  it('댓글이 없으면 안내 문구를 보여준다', async () => {
    getWorkoutComments.mockResolvedValue(page([]));

    render(<WorkoutCommentDialog recordId={7} open onOpenChange={() => {}} />);

    expect(await screen.findByText('첫 번째 댓글을 남겨보세요!')).toBeInTheDocument();
  });

  it('댓글을 등록하면 목록에 덧붙이고 갱신된 개수를 알린다', async () => {
    const user = userEvent.setup();
    getWorkoutComments.mockResolvedValue(page([], 0));
    addWorkoutComment.mockResolvedValue(comment({ id: 99, content: '수고했어요', mine: true }));
    const onCommentCountChange = vi.fn();

    render(
      <WorkoutCommentDialog
        recordId={7}
        open
        onOpenChange={() => {}}
        onCommentCountChange={onCommentCountChange}
      />,
    );
    await screen.findByText('첫 번째 댓글을 남겨보세요!');

    await user.type(screen.getByLabelText('댓글 입력'), '수고했어요');
    await user.click(screen.getByRole('button', { name: '댓글 등록' }));

    expect(await screen.findByText('수고했어요')).toBeInTheDocument();
    expect(addWorkoutComment).toHaveBeenCalledWith(7, '수고했어요');
    await waitFor(() => expect(onCommentCountChange).toHaveBeenLastCalledWith(1));
  });

  it('공백만 입력하면 등록 버튼이 비활성화된다', async () => {
    const user = userEvent.setup();
    getWorkoutComments.mockResolvedValue(page([]));

    render(<WorkoutCommentDialog recordId={7} open onOpenChange={() => {}} />);
    await screen.findByText('첫 번째 댓글을 남겨보세요!');

    await user.type(screen.getByLabelText('댓글 입력'), '   ');

    expect(screen.getByRole('button', { name: '댓글 등록' })).toBeDisabled();
    expect(addWorkoutComment).not.toHaveBeenCalled();
  });

  it('삭제 버튼은 내가 쓴 댓글에만 보인다', async () => {
    getWorkoutComments.mockResolvedValue(
      page([
        comment({ id: 1, nickname: 'other', content: '남의 댓글', mine: false }),
        comment({ id: 2, nickname: 'me', content: '내 댓글', mine: true }),
      ], 2),
    );

    render(<WorkoutCommentDialog recordId={7} open onOpenChange={() => {}} />);
    await screen.findByText('내 댓글');

    expect(screen.getAllByRole('button', { name: '댓글 삭제' })).toHaveLength(1);
  });

  it('댓글을 삭제하면 목록에서 빠지고 개수가 줄어든다', async () => {
    const user = userEvent.setup();
    getWorkoutComments.mockResolvedValue(page([comment({ id: 5, content: '내 댓글', mine: true })], 1));
    deleteWorkoutComment.mockResolvedValue(undefined);
    const onCommentCountChange = vi.fn();

    render(
      <WorkoutCommentDialog
        recordId={7}
        open
        onOpenChange={() => {}}
        onCommentCountChange={onCommentCountChange}
      />,
    );
    await screen.findByText('내 댓글');

    await user.click(screen.getByRole('button', { name: '댓글 삭제' }));

    expect(deleteWorkoutComment).not.toHaveBeenCalled();
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(deleteWorkoutComment).toHaveBeenCalledWith(7, 5));
    expect(screen.queryByText('내 댓글')).not.toBeInTheDocument();
    await waitFor(() => expect(onCommentCountChange).toHaveBeenLastCalledWith(0));
  });

  it('삭제 확인에서 취소하면 댓글을 지우지 않는다', async () => {
    const user = userEvent.setup();
    getWorkoutComments.mockResolvedValue(page([comment({ id: 5, content: '내 댓글', mine: true })], 1));

    render(<WorkoutCommentDialog recordId={7} open onOpenChange={() => {}} />);
    await screen.findByText('내 댓글');

    await user.click(screen.getByRole('button', { name: '댓글 삭제' }));
    await user.click(await screen.findByRole('button', { name: '취소' }));

    expect(deleteWorkoutComment).not.toHaveBeenCalled();
    expect(screen.getByText('내 댓글')).toBeInTheDocument();
  });

  it('콜백 identity 만 바뀌어 리렌더되면 목록을 다시 불러오지 않는다', async () => {
    // 마이페이지는 댓글 수가 바뀌면 피드 상태를 통째로 갈아끼우고, 그때마다 콜백 identity 가 바뀐다.
    // 조회 이펙트가 그 identity 에 묶여 있으면 조회 → 부모 리렌더 → 조회가 끝없이 반복된다.
    getWorkoutComments.mockResolvedValue(page([comment()], 1));

    const { rerender } = render(
      <WorkoutCommentDialog recordId={1} open onOpenChange={() => {}} onCommentCountChange={() => {}} />,
    );
    await waitFor(() => expect(getWorkoutComments).toHaveBeenCalledTimes(1));

    // 부모 리렌더로 콜백만 새 함수가 되는 상황
    rerender(
      <WorkoutCommentDialog recordId={1} open onOpenChange={() => {}} onCommentCountChange={() => {}} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(getWorkoutComments).toHaveBeenCalledTimes(1);
  });

  it('대상 인증이 바뀌면 그 인증의 댓글을 다시 불러온다', async () => {
    getWorkoutComments.mockResolvedValue(page([comment()], 1));

    const { rerender } = render(
      <WorkoutCommentDialog recordId={1} open onOpenChange={() => {}} />,
    );
    await waitFor(() => expect(getWorkoutComments).toHaveBeenCalledTimes(1));

    rerender(<WorkoutCommentDialog recordId={2} open onOpenChange={() => {}} />);

    await waitFor(() => expect(getWorkoutComments).toHaveBeenLastCalledWith(2, 0, 20));
  });
});
