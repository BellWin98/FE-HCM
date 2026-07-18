import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateRoomPage } from './CreateRoomPage';
import { AuthProvider } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    createWorkoutRoom: vi.fn().mockResolvedValue({}),
  },
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <CreateRoomPage />
      </AuthProvider>
    </MemoryRouter>
  );

const fillRequiredFieldsExceptPenalty = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('방 이름 *'), '헬스 3개월 도전');
  await user.click(screen.getByRole('button', { name: '코드 생성' }));
};

describe('CreateRoomPage - 벌금제도 토글', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('기본값은 벌금제도 켜짐이며 벌금액 입력란이 보인다', () => {
    renderPage();
    expect(screen.getByLabelText('1회 누락당 벌금 (원)')).toBeInTheDocument();
  });

  it('벌금제도 스위치를 끄면 벌금액 입력란이 사라진다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('벌금제도 사용'));

    expect(screen.queryByLabelText('1회 누락당 벌금 (원)')).not.toBeInTheDocument();
  });

  it('벌금제도를 끄고 제출하면 penaltyPerMiss 없이 penaltyEnabled: false로 요청한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('벌금제도 사용'));
    await fillRequiredFieldsExceptPenalty(user);
    await user.click(screen.getByRole('button', { name: '방 만들기' }));

    await waitFor(() => {
      expect(api.createWorkoutRoom).toHaveBeenCalledWith(
        expect.objectContaining({
          penaltyEnabled: false,
          penaltyPerMiss: undefined,
        })
      );
    });
  });

  it('벌금제도가 켜진 채로 벌금액이 범위를 벗어나면 제출되지 않고 에러 메시지를 보여준다', async () => {
    // 참고: input[type=number]에는 min="1000"/max="50000"이 걸려 있어, 사용자가 폼을
    // 클릭 제출하면 브라우저(jsdom)의 네이티브 제약 검증이 먼저 막아 JS의 submit 핸들러
    // 자체가 호출되지 않는다. 여기서는 JS 레벨 검증(validateWorkoutRoomRules) 로직 자체를
    // 검증하기 위해 네이티브 검증을 우회하고 form의 submit 이벤트를 직접 발생시킨다.
    const user = userEvent.setup();
    const { container } = renderPage();

    await fillRequiredFieldsExceptPenalty(user);
    await user.clear(screen.getByLabelText('1회 누락당 벌금 (원)'));
    await user.type(screen.getByLabelText('1회 누락당 벌금 (원)'), '500');

    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(await screen.findByText('벌금은 1,000원 이상 50,000원 이하여야 합니다.')).toBeInTheDocument();
    expect(api.createWorkoutRoom).not.toHaveBeenCalled();
  });
});
