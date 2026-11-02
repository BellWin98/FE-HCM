import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Member } from '@/types';

vi.mock('@/lib/api', () => ({
  api: {
    login: vi.fn(),
  },
}));

const { api } = await import('@/lib/api');
const { AuthProvider, useAuth } = await import('@/contexts/AuthContext');

const member: Member = {
  id: 1,
  email: 'admin@example.com',
  nickname: 'admin',
  profileUrl: '',
  totalWorkoutDays: 0,
  totalPenalty: 0,
  createdAt: '2026-01-01T00:00:00',
  role: 'ADMIN',
};

const AuthButtons = () => {
  const { login, logout } = useAuth();
  return (
    <>
      <button type="button" onClick={() => logout()}>
        로그아웃
      </button>
      <button type="button" onClick={() => void login('next@example.com', 'pw')}>
        로그인
      </button>
    </>
  );
};

const renderWithCache = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['knowledgeAccess'], { hasAccess: true });
  queryClient.setQueryData(['knowledgeNotes', 'stock', '005930'], { content: [] });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthButtons />
      </AuthProvider>
    </QueryClientProvider>
  );
  return queryClient;
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('member', JSON.stringify(member));
  localStorage.setItem('accessToken', 'token');
  vi.mocked(api.login).mockReset();
});

describe('AuthProvider — 계정이 바뀌면 쿼리 캐시를 비운다', () => {
  it('로그아웃하면 캐시된 ["knowledgeAccess"] 와 메모 조회가 사라진다', async () => {
    const queryClient = renderWithCache();

    await userEvent.setup().click(screen.getByRole('button', { name: '로그아웃' }));

    expect(queryClient.getQueryData(['knowledgeAccess'])).toBeUndefined();
    expect(queryClient.getQueryData(['knowledgeNotes', 'stock', '005930'])).toBeUndefined();
  });

  it('로그인하면 이전 사용자의 캐시를 비운다', async () => {
    vi.mocked(api.login).mockResolvedValue({
      member: { ...member, id: 2, role: 'USER' },
      accessToken: 'a',
      refreshToken: 'r',
    });
    const queryClient = renderWithCache();

    await userEvent.setup().click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(api.login).toHaveBeenCalled());
    await waitFor(() => expect(queryClient.getQueryData(['knowledgeAccess'])).toBeUndefined());
  });
});
