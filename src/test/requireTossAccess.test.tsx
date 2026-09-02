import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Member } from '@/types';

/**
 * 토스 라우트 가드.
 *
 * 토스 접근은 `member.role`이 아니라 서버의 `toss_access`로 관리되고(ADMIN 은 등록 없이도 항상 허용),
 * `AuthContext`의 member 는 localStorage 캐시라 관리자가 권한을 바꿔도 재로그인 전까지 갱신되지 않는다.
 * 그래서 가드는 role 이 아니라 `GET /toss-stock/access` 응답으로 판정해야 한다.
 */

vi.mock('@/lib/api', () => ({
  api: {
    getTossAccess: vi.fn(),
  },
}));

const { api } = await import('@/lib/api');
const { RequireTossAccess } = await import('@/components/RequireTossAccess');
const { AuthProvider } = await import('@/contexts/AuthContext');

const member = (role: Member['role'] = 'USER'): Member => ({
  id: 1,
  email: 'user@example.com',
  nickname: 'user',
  profileUrl: '',
  totalWorkoutDays: 0,
  totalPenalty: 0,
  createdAt: '2026-01-01T00:00:00',
  role,
});

const signIn = (role: Member['role'] = 'USER') => {
  localStorage.setItem('member', JSON.stringify(member(role)));
  localStorage.setItem('accessToken', 'token');
};

const renderGuard = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/toss/stock/portfolio']}>
          <Routes>
            <Route
              path="/toss/stock/portfolio"
              element={
                <RequireTossAccess>
                  <div>토스 자산 화면</div>
                </RequireTossAccess>
              }
            />
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
  vi.mocked(api.getTossAccess).mockReset();
});

describe('RequireTossAccess', () => {
  it('권한이 있으면 토스 화면을 그린다', async () => {
    signIn();
    vi.mocked(api.getTossAccess).mockResolvedValue({ hasAccess: true });

    renderGuard();

    expect(await screen.findByText('토스 자산 화면')).toBeInTheDocument();
  });

  it('권한이 없으면 대시보드로 돌려보낸다', async () => {
    signIn();
    vi.mocked(api.getTossAccess).mockResolvedValue({ hasAccess: false });

    renderGuard();

    expect(await screen.findByText('대시보드')).toBeInTheDocument();
    expect(screen.queryByText('토스 자산 화면')).not.toBeInTheDocument();
  });

  it('FAMILY 역할만으로는 통과하지 못한다 — 판정은 서버 응답만 본다', async () => {
    signIn('FAMILY');
    vi.mocked(api.getTossAccess).mockResolvedValue({ hasAccess: false });

    renderGuard();

    expect(await screen.findByText('대시보드')).toBeInTheDocument();
  });

  it('권한 조회에 실패하면 열지 않는다', async () => {
    signIn();
    vi.mocked(api.getTossAccess).mockRejectedValue(new Error('네트워크 오류'));

    renderGuard();

    expect(await screen.findByText('대시보드')).toBeInTheDocument();
    expect(screen.queryByText('토스 자산 화면')).not.toBeInTheDocument();
  });

  it('로그인하지 않았으면 로그인 화면으로 보내고 권한을 조회하지 않는다', async () => {
    renderGuard();

    expect(await screen.findByText('로그인 화면')).toBeInTheDocument();
    expect(api.getTossAccess).not.toHaveBeenCalled();
  });
});
