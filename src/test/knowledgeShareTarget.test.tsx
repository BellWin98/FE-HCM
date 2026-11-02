import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Member } from '@/types';

vi.mock('@/lib/api', () => ({
  api: {
    getKnowledgeAccess: vi.fn(),
  },
}));

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

const openQuickNote = vi.fn();
vi.mock('@/contexts/QuickNoteContext', () => ({
  useQuickNote: () => ({ openQuickNote }),
}));

const { api } = await import('@/lib/api');
const { default: KnowledgeShareTargetPage } = await import('@/pages/KnowledgeShareTargetPage');
const { AuthProvider } = await import('@/contexts/AuthContext');

const member: Member = {
  id: 1,
  email: 'user@example.com',
  nickname: 'user',
  profileUrl: '',
  totalWorkoutDays: 0,
  totalPenalty: 0,
  createdAt: '2026-01-01T00:00:00',
  role: 'ADMIN',
};

const signIn = () => {
  localStorage.setItem('member', JSON.stringify(member));
  localStorage.setItem('accessToken', 'token');
};

const renderPage = (search = '?title=%EC%A0%9C%EB%AA%A9&url=https%3A%2F%2Fexample.com%2Fa') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/notes/share${search}`]}>
          <Routes>
            <Route path="/notes/share" element={<KnowledgeShareTargetPage />} />
            <Route path="/notes" element={<div>메모 목록</div>} />
            <Route path="/dashboard" element={<div>대시보드</div>} />
            <Route path="/login" element={<div>로그인 화면</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  localStorage.clear();
  vi.mocked(api.getKnowledgeAccess).mockReset();
  toastError.mockReset();
  openQuickNote.mockReset();
});

describe('KnowledgeShareTargetPage', () => {
  it('미인증이면 로그인 화면으로 보낸다', async () => {
    renderPage();

    expect(await screen.findByText('로그인 화면')).toBeInTheDocument();
    expect(openQuickNote).not.toHaveBeenCalled();
  });

  it('권한이 없으면 토스트를 띄우고 대시보드로 보낸다', async () => {
    signIn();
    vi.mocked(api.getKnowledgeAccess).mockResolvedValue({ hasAccess: false });

    renderPage();

    expect(await screen.findByText('대시보드')).toBeInTheDocument();
    expect(toastError).toHaveBeenCalledWith('사용할 수 없는 기능입니다.');
    expect(openQuickNote).not.toHaveBeenCalled();
  });

  it('권한이 있으면 공유 값을 prefill 로 넘겨 한 번만 열고, 닫히면 /notes 로 이동한다', async () => {
    signIn();
    vi.mocked(api.getKnowledgeAccess).mockResolvedValue({ hasAccess: true });

    renderPage();

    await waitFor(() => expect(openQuickNote).toHaveBeenCalledTimes(1));
    const arg = openQuickNote.mock.calls[0][0];
    expect(arg.prefill).toEqual({ sourceUrl: 'https://example.com/a', sourceText: '제목' });

    arg.onClosed();
    expect(await screen.findByText('메모 목록')).toBeInTheDocument();
    expect(toastError).not.toHaveBeenCalled();
  });
});
