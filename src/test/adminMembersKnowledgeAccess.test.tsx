import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminMember } from '@/types';

vi.mock('@/lib/api', () => ({
  api: {
    getAdminMembers: vi.fn(),
    updateAdminKnowledgeAccess: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ member: { id: 99 }, updateMember: vi.fn() }),
}));

const { api } = await import('@/lib/api');
const { toast } = await import('sonner');
const { default: AdminMembersPage } = await import('@/pages/admin/AdminMembersPage');

const makeMember = (over: Partial<AdminMember>): AdminMember => ({
  id: 1,
  email: 'user@test.com',
  nickname: '일반유저',
  profileUrl: '',
  totalWorkoutDays: 0,
  totalPenalty: 0,
  createdAt: '2026-11-01T00:00:00',
  role: 'USER',
  tossAccess: false,
  knowledgeAccess: { canRead: false, canWrite: false },
  ...over,
});

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
  render(
    <QueryClientProvider client={client}>
      <AdminMembersPage />
    </QueryClientProvider>
  );
  return { invalidateSpy };
};

// 모바일 카드와 데스크톱 테이블이 함께 렌더링되므로 같은 이름의 체크박스가 둘씩 있다.
const findBoxes = (name: string) => screen.findAllByRole('checkbox', { name });

describe('AdminMembersPage 지식 메모 권한', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getAdminMembers).mockResolvedValue({
      content: [
        makeMember({}),
        makeMember({ id: 2, email: 'admin@test.com', nickname: '관리자', role: 'ADMIN' }),
      ],
      totalPages: 1,
      number: 0,
      size: 10,
    } as never);
    vi.mocked(api.updateAdminKnowledgeAccess).mockResolvedValue({} as never);
  });

  it('checkRead_callsUpdateWithBothFlags', async () => {
    renderPage();
    const [box] = await findBoxes('일반유저 지식 메모 조회');
    await userEvent.click(box);
    await waitFor(() =>
      expect(api.updateAdminKnowledgeAccess).toHaveBeenCalledWith(1, { canRead: true, canWrite: false })
    );
  });

  it('adminRow_checkedAndDisabled', async () => {
    renderPage();
    const boxes = [...(await findBoxes('관리자 지식 메모 조회')), ...(await findBoxes('관리자 지식 메모 작성'))];
    expect(boxes.length).toBeGreaterThan(0);
    boxes.forEach((box) => {
      expect(box).toBeChecked();
      expect(box).toBeDisabled();
    });
  });

  it('whileSaving_rowCheckboxesDisabled', async () => {
    let resolveSave: (v: unknown) => void = () => undefined;
    vi.mocked(api.updateAdminKnowledgeAccess).mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }) as never
    );
    renderPage();
    const [readBox] = await findBoxes('일반유저 지식 메모 조회');
    await userEvent.click(readBox);

    await waitFor(async () => {
      const boxes = [...(await findBoxes('일반유저 지식 메모 조회')), ...(await findBoxes('일반유저 지식 메모 작성'))];
      boxes.forEach((box) => expect(box).toBeDisabled());
    });
    expect((await screen.findAllByText('변경 중...')).length).toBeGreaterThan(0);

    resolveSave({});
    await waitFor(async () => {
      const boxes = await findBoxes('일반유저 지식 메모 작성');
      boxes.forEach((box) => expect(box).toBeEnabled());
    });
  });

  it('handleToggle_invalidatesKnowledgeAccess', async () => {
    const { invalidateSpy } = renderPage();
    const [box] = await findBoxes('일반유저 지식 메모 작성');
    await userEvent.click(box);
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['knowledgeAccess'] }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['adminMembers'] });
    expect(api.updateAdminKnowledgeAccess).toHaveBeenCalledWith(1, { canRead: false, canWrite: true });
  });

  it('saveFailure_showsErrorToast', async () => {
    vi.mocked(api.updateAdminKnowledgeAccess).mockRejectedValue(new Error('저장 실패'));
    renderPage();
    const [box] = await findBoxes('일반유저 지식 메모 조회');
    await userEvent.click(box);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('저장 실패'));
  });

  it('otherFlagCurrentValue_isSent', async () => {
    vi.mocked(api.getAdminMembers).mockResolvedValue({
      content: [makeMember({ knowledgeAccess: { canRead: false, canWrite: true } })],
      totalPages: 1,
      number: 0,
      size: 10,
    } as never);
    renderPage();
    const [box] = await findBoxes('일반유저 지식 메모 조회');
    await userEvent.click(box);
    await waitFor(() =>
      expect(api.updateAdminKnowledgeAccess).toHaveBeenCalledWith(1, { canRead: true, canWrite: true })
    );
  });

  describe('여러 행 저장', () => {
    const twoUsers = {
      content: [
        makeMember({}),
        makeMember({ id: 3, email: 'b@test.com', nickname: '유저B' }),
      ],
      totalPages: 1,
      number: 0,
      size: 10,
    };
    const deferred = () => {
      let resolve: (v: unknown) => void = () => undefined;
      const promise = new Promise((r) => {
        resolve = r;
      });
      return { promise, resolve };
    };
    const expectDisabled = async (name: string, disabled: boolean) => {
      await waitFor(async () => {
        const boxes = await findBoxes(name);
        boxes.forEach((box) => (disabled ? expect(box).toBeDisabled() : expect(box).toBeEnabled()));
      });
    };

    it('savingRowA_keepsRowBEnabled_andStartingBKeepsADisabled', async () => {
      vi.mocked(api.getAdminMembers).mockResolvedValue(twoUsers as never);
      const a = deferred();
      const b = deferred();
      vi.mocked(api.updateAdminKnowledgeAccess)
        .mockReturnValueOnce(a.promise as never)
        .mockReturnValueOnce(b.promise as never);
      renderPage();

      const [aRead] = await findBoxes('일반유저 지식 메모 조회');
      await userEvent.click(aRead);
      await expectDisabled('일반유저 지식 메모 조회', true);
      await expectDisabled('유저B 지식 메모 조회', false);

      const [bRead] = await findBoxes('유저B 지식 메모 조회');
      await userEvent.click(bRead);
      await expectDisabled('유저B 지식 메모 조회', true);
      await expectDisabled('일반유저 지식 메모 조회', true);

      a.resolve({});
      await expectDisabled('일반유저 지식 메모 조회', false);
      await expectDisabled('유저B 지식 메모 조회', true);
      b.resolve({});
      await expectDisabled('유저B 지식 메모 조회', false);
    });

    it('afterPutResolves_rowStaysDisabledUntilMembersRefetchLands', async () => {
      const refetch = deferred();
      vi.mocked(api.getAdminMembers)
        .mockResolvedValueOnce(twoUsers as never)
        .mockReturnValueOnce(refetch.promise as never);
      renderPage();

      const [aRead] = await findBoxes('일반유저 지식 메모 조회');
      await userEvent.click(aRead);
      await waitFor(() => expect(api.getAdminMembers).toHaveBeenCalledTimes(2));
      await expectDisabled('일반유저 지식 메모 작성', true);

      refetch.resolve({
        ...twoUsers,
        content: [makeMember({ knowledgeAccess: { canRead: true, canWrite: false } }), twoUsers.content[1]],
      });
      await expectDisabled('일반유저 지식 메모 작성', false);
    });
  });
});
