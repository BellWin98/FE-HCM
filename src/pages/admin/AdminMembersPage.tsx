import { Layout } from '@/components/layout/Layout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Member } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminStateBlock } from '@/components/admin/AdminStateBlock';

type Role = Member['role'];

const ROLE_OPTIONS: Array<{ value: 'ALL' | Role; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'USER', label: 'USER' },
  { value: 'FAMILY', label: 'FAMILY' },
  { value: 'ADMIN', label: 'ADMIN' },
];

const ROLE_LABEL: Record<Role, string> = {
  USER: 'USER',
  FAMILY: 'FAMILY',
  ADMIN: 'ADMIN',
};

function formatDate(isoLike?: string) {
  if (!isoLike) return '-';
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return isoLike;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return '요청에 실패했습니다. 잠시 후 다시 시도해주세요.';
}

const AdminMembersPage = () => {
  const queryClient = useQueryClient();
  const { member: currentMember, updateMember } = useAuth();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [pendingChange, setPendingChange] = useState<{
    open: boolean;
    target: Member | null;
    nextRole: Role | null;
  }>({ open: false, target: null, nextRole: null });

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  // 검색/필터 조건이 바뀌면 첫 페이지로.
  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, roleFilter, size]);

  const listParams = useMemo(() => {
    return {
      query: debouncedQuery || undefined,
      role: roleFilter === 'ALL' ? undefined : roleFilter,
      page,
      size,
    };
  }, [debouncedQuery, roleFilter, page, size]);

  const membersQuery = useQuery({
    queryKey: ['adminMembers', listParams],
    queryFn: () => api.getAdminMembers(listParams),
    placeholderData: keepPreviousData,
  });

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: Role }) => api.patchAdminMemberRole(memberId, role),
    onSuccess: (updated) => {
      toast.success('역할이 변경되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
      if (currentMember?.id === updated.id) {
        updateMember({ role: updated.role });
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const content = membersQuery.data?.content ?? [];
  const totalPages = membersQuery.data?.totalPages ?? 0;
  const isLast = membersQuery.data?.last ?? true;
  const currentPage = membersQuery.data?.number ?? page;

  const updatingMemberId = roleMutation.variables?.memberId;

  const pageItems = useMemo(() => {
    if (!totalPages || totalPages <= 1) return [];
    const current = Math.min(Math.max(0, currentPage), totalPages - 1);
    const windowSize = 2;
    let start = Math.max(0, current - windowSize);
    let end = Math.min(totalPages - 1, current + windowSize);

    // ensure up to 5 items if possible
    while (end - start < windowSize * 2) {
      if (start > 0) start -= 1;
      else if (end < totalPages - 1) end += 1;
      else break;
    }

    const items: Array<number | 'ellipsis'> = [];
    if (start > 0) {
      items.push(0);
      if (start > 1) items.push('ellipsis');
    }
    for (let p = start; p <= end; p += 1) items.push(p);
    if (end < totalPages - 1) {
      if (end < totalPages - 2) items.push('ellipsis');
      items.push(totalPages - 1);
    }
    return items;
  }, [currentPage, totalPages]);

  const openConfirm = (target: Member, nextRole: Role) => {
    if (target.role === nextRole) return;
    setPendingChange({ open: true, target, nextRole });
  };

  const closeConfirm = () => setPendingChange({ open: false, target: null, nextRole: null });

  const confirmChange = async () => {
    const target = pendingChange.target;
    const nextRole = pendingChange.nextRole;
    if (!target || !nextRole) return;
    closeConfirm();
    roleMutation.mutate({ memberId: target.id, role: nextRole });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">회원 관리</h1>
            <p className="text-muted-foreground mt-1">회원 목록 검색 및 역할 변경</p>
          </div>
          <Button
            variant="outline"
            onClick={() => membersQuery.refetch()}
            disabled={membersQuery.isFetching}
            className="gap-2"
          >
            <RefreshCcw className={cn('h-4 w-4', membersQuery.isFetching && 'animate-spin')} />
            새로고침
          </Button>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="닉네임 또는 이메일로 검색"
                className="pl-9"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Role</span>
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'ALL' | Role)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Size</span>
                <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {membersQuery.isLoading ? (
              <AdminStateBlock variant="loading" />
            ) : membersQuery.isError ? (
              <AdminStateBlock
                variant="error"
                title="회원 목록을 불러오지 못했습니다."
                description={getErrorMessage(membersQuery.error)}
                onAction={() => membersQuery.refetch()}
              />
            ) : content.length === 0 ? (
              <AdminStateBlock variant="empty" description="검색 결과가 없습니다." />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    페이지 <span className="text-foreground">{currentPage + 1}</span>
                    {totalPages ? (
                      <>
                        {' '}
                        / <span className="text-foreground">{totalPages}</span>
                      </>
                    ) : null}
                  </div>
                  {membersQuery.isFetching ? <div>업데이트 중...</div> : null}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>닉네임</TableHead>
                      <TableHead className="w-[220px]">역할</TableHead>
                      <TableHead className="w-[120px] text-right">운동일수</TableHead>
                      <TableHead className="w-[140px] text-right">누적 벌금</TableHead>
                      <TableHead className="w-[140px]">가입일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {content.map((m) => {
                      const isMe = currentMember?.id === m.id;
                      const isUpdatingThisRow = roleMutation.isPending && updatingMemberId === m.id;
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{m.id}</TableCell>
                          <TableCell className="truncate">{m.email}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            <span className="truncate font-medium">{m.nickname}</span>
                            {isMe ? (
                              <Badge variant="secondary" className="shrink-0">
                                ME
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select value={m.role} onValueChange={(v) => openConfirm(m, v as Role)} disabled={isUpdatingThisRow}>
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {ROLE_LABEL[r]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {isUpdatingThisRow ? <span className="text-xs text-muted-foreground">변경 중...</span> : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{m.totalWorkoutDays ?? 0}</TableCell>
                          <TableCell className="text-right tabular-nums">{(m.totalPenalty ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(m.createdAt)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {totalPages > 1 ? (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage((p) => Math.max(0, p - 1));
                          }}
                          aria-disabled={currentPage <= 0}
                          className={cn(currentPage <= 0 && 'pointer-events-none opacity-50')}
                        />
                      </PaginationItem>

                      {pageItems.map((it, idx) =>
                        it === 'ellipsis' ? (
                          <PaginationItem key={`el-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={it}>
                            <PaginationLink
                              href="#"
                              isActive={it === currentPage}
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(it);
                              }}
                            >
                              {it + 1}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!isLast) setPage((p) => p + 1);
                          }}
                          aria-disabled={isLast}
                          className={cn(isLast && 'pointer-events-none opacity-50')}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={pendingChange.open} onOpenChange={(open) => (open ? null : closeConfirm())}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>역할을 변경할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingChange.target ? (
                <div className="space-y-1">
                  <div>
                    대상: <span className="font-medium text-foreground">{pendingChange.target.nickname}</span> ({pendingChange.target.email})
                  </div>
                  <div>
                    변경: <span className="font-medium text-foreground">{pendingChange.target.role}</span> →{' '}
                    <span className="font-medium text-foreground">{pendingChange.nextRole}</span>
                  </div>
                  {currentMember?.id === pendingChange.target.id ? (
                    <div className="mt-2 text-sm text-muted-foreground">
                      본인 역할을 변경하면 현재 세션의 권한/화면 접근이 즉시 바뀔 수 있습니다.
                    </div>
                  ) : null}
                </div>
              ) : (
                '선택한 역할로 변경합니다.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirm}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange}>변경</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default AdminMembersPage;
