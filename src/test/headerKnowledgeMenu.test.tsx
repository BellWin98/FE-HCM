import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Member } from '@/types';

vi.mock('@/lib/api', () => ({
  api: {
    getTossAccess: vi.fn(),
    getKnowledgeAccess: vi.fn(),
  },
}));

const { api } = await import('@/lib/api');
const { Header } = await import('@/components/layout/Header');
const { AuthProvider } = await import('@/contexts/AuthContext');
const { QuickNoteProvider } = await import('@/contexts/QuickNoteContext');

const signIn = (role: Member['role'] = 'ADMIN') => {
  const member: Member = {
    id: 1,
    email: 'admin@example.com',
    nickname: 'admin',
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
          <QuickNoteProvider>
            <Header />
            <Routes>
              <Route path="/dashboard" element={<div>대시보드</div>} />
              <Route path="/notes" element={<div>메모 화면</div>} />
            </Routes>
          </QuickNoteProvider>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  localStorage.clear();
  vi.mocked(api.getTossAccess).mockReset().mockResolvedValue({ hasAccess: false, canTrade: false });
  vi.mocked(api.getKnowledgeAccess).mockReset();
});

describe('Header — 메모 진입점', () => {
  it('hasAccess=false 면 메모 버튼·메뉴가 없다 (ADMIN role 이어도)', async () => {
    signIn('ADMIN');
    vi.mocked(api.getKnowledgeAccess).mockResolvedValue({ hasAccess: false });

    renderHeader();

    await waitFor(() => expect(api.getKnowledgeAccess).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: '빠른 메모' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '메모 목록' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: '메모 목록' })).not.toBeInTheDocument();
  });

  it('hasAccess=true 면 "빠른 메모" 버튼과 "메모 목록" 메뉴가 보인다', async () => {
    signIn('USER');
    vi.mocked(api.getKnowledgeAccess).mockResolvedValue({ hasAccess: true });

    renderHeader();

    // 모바일 FAB 도 같은 이름이라 헤더 안의 버튼만 본다.
    const header = await screen.findByRole('banner');
    const quick = (await screen.findAllByRole('button', { name: '빠른 메모' })).find((b) => header.contains(b));
    expect(quick).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: /^(admin|AD)/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: '메모 목록' }));
    expect(screen.getByText('메모 화면')).toBeInTheDocument();
  });

  it('"빠른 메모" 버튼을 누르면 다이얼로그가 열린다', async () => {
    signIn('USER');
    vi.mocked(api.getKnowledgeAccess).mockResolvedValue({ hasAccess: true });

    renderHeader();
    const header = await screen.findByRole('banner');
    const buttons = await screen.findAllByRole('button', { name: '빠른 메모' });
    await userEvent.click(buttons.find((b) => header.contains(b))!);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
