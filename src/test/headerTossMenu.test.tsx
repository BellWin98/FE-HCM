import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Member } from '@/types';

/**
 * 헤더의 토스증권 진입점.
 *
 * 토스 접근은 role 이 아니라 서버의 `toss_access`로 관리되므로, 메뉴 노출도 `member.role`이 아니라
 * `GET /toss-stock/access` 응답을 따라야 한다. 한국투자증권("주식 현황")은 여전히 FAMILY/ADMIN 기준이라
 * 두 메뉴의 노출 조건이 서로 다르다.
 */

vi.mock('@/lib/api', () => ({
  api: {
    getTossAccess: vi.fn(),
  },
}));

const { api } = await import('@/lib/api');
const { Header } = await import('@/components/layout/Header');
const { AuthProvider } = await import('@/contexts/AuthContext');

const signIn = (role: Member['role'] = 'USER') => {
  const member: Member = {
    id: 1,
    email: 'user@example.com',
    nickname: 'user',
    profileUrl: '',
    totalWorkoutDays: 0,
    totalPenalty: 0,
    createdAt: '2026-01-01T00:00:00',
    role,
  };
  localStorage.setItem('member', JSON.stringify(member));
  localStorage.setItem('accessToken', 'token');
};

const renderHeader = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Header />
          <Routes>
            <Route path="/dashboard" element={<div>대시보드</div>} />
            <Route path="/toss/stock/portfolio" element={<div>토스 자산 화면</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const tossMenu = () => screen.queryByRole('button', { name: '토스증권' });

beforeEach(() => {
  localStorage.clear();
  vi.mocked(api.getTossAccess).mockReset();
});

describe('Header — 토스증권 메뉴', () => {
  it('토스 접근 권한이 있으면 메뉴를 보여준다', async () => {
    signIn();
    vi.mocked(api.getTossAccess).mockResolvedValue({ hasAccess: true });

    renderHeader();

    expect(await screen.findByRole('button', { name: '토스증권' })).toBeInTheDocument();
  });

  it('토스 접근 권한이 없으면 메뉴를 숨긴다', async () => {
    signIn();
    vi.mocked(api.getTossAccess).mockResolvedValue({ hasAccess: false });

    renderHeader();

    await waitFor(() => expect(api.getTossAccess).toHaveBeenCalled());
    expect(tossMenu()).not.toBeInTheDocument();
  });

  it('FAMILY 역할만으로는 메뉴가 보이지 않는다 — 판정은 서버 응답만 본다', async () => {
    signIn('FAMILY');
    vi.mocked(api.getTossAccess).mockResolvedValue({ hasAccess: false });

    renderHeader();

    // 한국투자증권 메뉴는 여전히 FAMILY 기준이라 그대로 보인다.
    expect(await screen.findByRole('button', { name: '주식 현황' })).toBeInTheDocument();
    expect(tossMenu()).not.toBeInTheDocument();
  });

  it('메뉴를 누르면 토스 화면으로 이동한다', async () => {
    signIn();
    vi.mocked(api.getTossAccess).mockResolvedValue({ hasAccess: true });

    renderHeader();
    await userEvent.click(await screen.findByRole('button', { name: '토스증권' }));

    expect(screen.getByText('토스 자산 화면')).toBeInTheDocument();
  });

  it('로그인하지 않았으면 권한을 조회하지 않는다', async () => {
    renderHeader();

    expect(await screen.findByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(api.getTossAccess).not.toHaveBeenCalled();
  });
});
