import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Member } from '@/types';

/**
 * 지식 메모 라우트 가드.
 *
 * 접근 여부는 `member.role`이 아니라 서버의 `GET /knowledge-notes/access` 응답으로 판정한다
 * (role 이 ADMIN 이어도 서버가 거부하면 막는다).
 */

vi.mock('@/lib/api', () => ({
  api: {
    getKnowledgeAccess: vi.fn(),
  },
}));

const { api } = await import('@/lib/api');
const { RequireKnowledgeAccess } = await import('@/components/RequireKnowledgeAccess');
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
        <MemoryRouter initialEntries={['/notes']}>
          <Routes>
            <Route
              path="/notes"
              element={
                <RequireKnowledgeAccess>
                  <div>메모 화면</div>
                </RequireKnowledgeAccess>
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
  vi.mocked(api.getKnowledgeAccess).mockReset();
});

describe('RequireKnowledgeAccess', () => {
  it('권한이 있으면 메모 화면을 그린다', async () => {
    signIn();
    vi.mocked(api.getKnowledgeAccess).mockResolvedValue({ hasAccess: true, canRead: true, canWrite: true, isAdmin: false });

    renderGuard();

    expect(await screen.findByText('메모 화면')).toBeInTheDocument();
  });

  it('writeOnly_hasAccess_rendersChildren', async () => {
    signIn();
    vi.mocked(api.getKnowledgeAccess).mockResolvedValue({
      hasAccess: true,
      canRead: false,
      canWrite: true,
      isAdmin: false,
    });

    renderGuard();

    expect(await screen.findByText('메모 화면')).toBeInTheDocument();
  });

  it('권한이 없으면 대시보드로 돌려보낸다', async () => {
    signIn();
    vi.mocked(api.getKnowledgeAccess).mockResolvedValue({ hasAccess: false, canRead: false, canWrite: false, isAdmin: false });

    renderGuard();

    expect(await screen.findByText('대시보드')).toBeInTheDocument();
    expect(screen.queryByText('메모 화면')).not.toBeInTheDocument();
  });

  it('ADMIN 역할이어도 서버가 거부하면 통과하지 못한다 — 판정은 서버 응답만 본다', async () => {
    signIn('ADMIN');
    vi.mocked(api.getKnowledgeAccess).mockResolvedValue({ hasAccess: false, canRead: false, canWrite: false, isAdmin: false });

    renderGuard();

    expect(await screen.findByText('대시보드')).toBeInTheDocument();
  });

  it('권한 조회에 실패하면 열지 않는다', async () => {
    signIn();
    vi.mocked(api.getKnowledgeAccess).mockRejectedValue(new Error('네트워크 오류'));

    renderGuard();

    expect(await screen.findByText('대시보드')).toBeInTheDocument();
    expect(screen.queryByText('메모 화면')).not.toBeInTheDocument();
  });

  it('로그인하지 않았으면 로그인 화면으로 보내고 권한을 조회하지 않는다', async () => {
    renderGuard();

    expect(await screen.findByText('로그인 화면')).toBeInTheDocument();
    expect(api.getKnowledgeAccess).not.toHaveBeenCalled();
  });
});
