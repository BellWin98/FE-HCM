import { Layout } from '@/components/layout/Layout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { AdminMember, Member } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, Search, Trash2 } from 'lucide-react';
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
  const [pendingDelete, setPendingDelete] = useState<{
    open: boolean;
    target: Member | null;
  }>({ open: false, target: null });
  const [pendingTossChange, setPendingTossChange] = useState<{
    open: boolean;
    target: AdminMember | null;
    nextGranted: boolean | null;
  }>({ open: false, target: null, nextGranted: null });

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

  // 토스 접근은 role 과 분리된 개별 권한이라 별도 엔드포인트를 쓴다(ADMIN 은 부여 없이도 항상 접근).
  const tossAccessMutation = useMutation({
    mutationFn: ({ memberId, grant }: { memberId: number; grant: boolean }) =>
      grant ? api.grantAdminTossAccess(memberId).then(() => undefined) : api.revokeAdminTossAccess(memberId),
    onSuccess: (_data, variables) => {
      toast.success(variables.grant ? '토스 접근 권한을 부여했습니다.' : '토스 접근 권한을 회수했습니다.');
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
      // 본인 권한을 바꿨다면 라우트 가드가 보는 캐시도 함께 비운다.
      if (currentMember?.id === variables.memberId) {
        queryClient.invalidateQueries({ queryKey: ['tossAccess'] });
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (memberId: number) => api.deleteAdminMember(memberId),
    onSuccess: () => {
      toast.success('회원이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
      
      // 현재 페이지가 비어있으면 이전 페이지로 이동
      if (content.length === 1 && currentPage > 0) {
        setPage((p) => Math.max(0, p - 1));
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
  const tossUpdatingMemberId = tossAccessMutation.variables?.memberId;

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

  const openTossConfirm = (target: AdminMember, nextGranted: boolean) => {
    if (target.tossAccess === nextGranted) return;
    setPendingTossChange({ open: true, target, nextGranted });
  };

  const closeTossConfirm = () => setPendingTossChange({ open: false, target: null, nextGranted: null });

  const confirmTossChange = async () => {
    const target = pendingTossChange.target;
    const nextGranted = pendingTossChange.nextGranted;
    if (!target || nextGranted === null) return;
    closeTossConfirm();
    tossAccessMutation.mutate({ memberId: target.id, grant: nextGranted });
  };

  const openDeleteConfirm = (target: Member) => {
    setPendingDelete({ open: true, target });
  };

  const closeDeleteConfirm = () => setPendingDelete({ open: false, target: null });

  const confirmDelete = async () => {
    const target = pendingDelete.target;
    if (!target) return;
    closeDeleteConfirm();
    deleteMutation.mutate(target.id);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold md:text-2xl">회원 관리</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">회원 목록 검색, 역할 및 토스 접근 권한 변경</p>
          </div>
          <Button
            variant="outline"
            onClick={() => membersQuery.refetch()}
            disabled={membersQuery.isFetching}
            className="w-full gap-2 sm:w-auto"
          >
            <RefreshCcw className={cn('h-4 w-4', membersQuery.isFetching && 'animate-spin')} />
            새로고침
          </Button>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="닉네임 또는 이메일로 검색"
                className="pl-9"
              />
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'ALL' | Role)}>
                  <SelectTrigger className="w-full sm:w-[160px]">
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

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
                  <SelectTrigger className="w-full sm:w-[120px]">
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
                <div className="flex flex-col items-start justify-between gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
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

                {/* 모바일: 카드 리스트 */}
                <div className="space-y-3 md:hidden">
                  {content.map((m) => {
                    const isMe = currentMember?.id === m.id;
                    const isUpdatingThisRow = roleMutation.isPending && updatingMemberId === m.id;
                    const isDeletingThisRow = deleteMutation.isPending && pendingDelete.target?.id === m.id;
                    const isTossUpdatingThisRow = tossAccessMutation.isPending && tossUpdatingMemberId === m.id;

                    return (
                      <div key={m.id} className="rounded-lg border bg-card p-4 shadow-sm">
                        <div className="min-w-0 space-y-1">
                          <div className="text-xs font-mono text-muted-foreground">#{m.id}</div>
                          <div className="flex items-center gap-2">
                            <span className="truncate text-base font-semibold text-foreground">{m.nickname}</span>
                            {isMe ? (
                              <Badge variant="secondary" className="shrink-0">
                                ME
                              </Badge>
                            ) : null}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-foreground/70">운동일수</div>
                            <div className="tabular-nums text-sm text-foreground">{m.totalWorkoutDays ?? 0}</div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-foreground/70">누적 벌금</div>
                            <div className="tabular-nums text-sm text-foreground">{(m.totalPenalty ?? 0).toLocaleString()}원</div>
                          </div>
                          <div className="col-span-2 space-y-0.5">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-foreground/70">가입일</div>
                            <div className="text-sm text-foreground">{formatDate(m.createdAt)}</div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Select
                              value={m.role}
                              onValueChange={(v) => openConfirm(m, v as Role)}
                              disabled={isUpdatingThisRow || isDeletingThisRow}
                            >
                              <SelectTrigger className="w-full">
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
                          </div>
                          {isUpdatingThisRow ? <span className="text-xs text-muted-foreground">변경 중...</span> : null}
                          <div className="flex items-center justify-between rounded-md border px-3 py-2">
                            <span className="text-sm text-foreground">토스 접근</span>
                            <div className="flex items-center gap-2">
                              {isTossUpdatingThisRow ? (
                                <span className="text-xs text-muted-foreground">변경 중...</span>
                              ) : null}
                              <Switch
                                checked={m.role === 'ADMIN' || m.tossAccess}
                                onCheckedChange={(checked) => openTossConfirm(m, checked)}
                                disabled={m.role === 'ADMIN' || isTossUpdatingThisRow || isDeletingThisRow}
                                aria-label={`${m.nickname} 토스 접근 권한`}
                              />
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteConfirm(m)}
                            disabled={isDeletingThisRow || isUpdatingThisRow}
                            className="w-full gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            {isDeletingThisRow ? '삭제 중...' : '삭제'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 데스크톱: 테이블 */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead>이메일</TableHead>
                          <TableHead>닉네임</TableHead>
                          <TableHead className="w-[220px]">역할</TableHead>
                          <TableHead className="w-[110px]">토스 접근</TableHead>
                          <TableHead className="w-[120px] text-right">운동일수</TableHead>
                          <TableHead className="w-[140px] text-right">누적 벌금</TableHead>
                          <TableHead className="w-[140px]">가입일</TableHead>
                          <TableHead className="w-[100px] text-right">작업</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {content.map((m) => {
                          const isMe = currentMember?.id === m.id;
                          const isUpdatingThisRow = roleMutation.isPending && updatingMemberId === m.id;
                          const isDeletingThisRow = deleteMutation.isPending && pendingDelete.target?.id === m.id;
                          const isTossUpdatingThisRow = tossAccessMutation.isPending && tossUpdatingMemberId === m.id;
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
                                  <Select value={m.role} onValueChange={(v) => openConfirm(m, v as Role)} disabled={isUpdatingThisRow || isDeletingThisRow}>
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
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={m.role === 'ADMIN' || m.tossAccess}
                                    onCheckedChange={(checked) => openTossConfirm(m, checked)}
                                    disabled={m.role === 'ADMIN' || isTossUpdatingThisRow || isDeletingThisRow}
                                    aria-label={`${m.nickname} 토스 접근 권한`}
                                  />
                                  {isTossUpdatingThisRow ? <span className="text-xs text-muted-foreground">변경 중...</span> : null}
                                </div>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{m.totalWorkoutDays ?? 0}</TableCell>
                              <TableCell className="text-right tabular-nums">{(m.totalPenalty ?? 0).toLocaleString()}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{formatDate(m.createdAt)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteConfirm(m)}
                                  disabled={isDeletingThisRow || isUpdatingThisRow}
                                  className="gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  {isDeletingThisRow ? '삭제 중...' : '삭제'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {totalPages > 1 ? (
                  <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
                    <Pagination>
                      <PaginationContent className="flex-nowrap">
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
                  </div>
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
                <div className="min-w-0 space-y-1 break-words">
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

      <AlertDialog open={pendingTossChange.open} onOpenChange={(open) => (open ? null : closeTossConfirm())}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingTossChange.nextGranted ? '토스 접근 권한을 부여할까요?' : '토스 접근 권한을 회수할까요?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingTossChange.target ? (
                <div className="min-w-0 space-y-2 break-words">
                  <div>
                    대상: <span className="font-medium text-foreground">{pendingTossChange.target.nickname}</span> (
                    {pendingTossChange.target.email})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pendingTossChange.nextGranted
                      ? '토스증권 계좌의 보유종목·평가금액·예수금·거래내역을 모두 볼 수 있게 됩니다.'
                      : '토스증권 화면과 API 접근이 즉시 차단됩니다.'}
                  </div>
                </div>
              ) : (
                '토스 접근 권한을 변경합니다.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeTossConfirm}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTossChange}>
              {pendingTossChange.nextGranted ? '부여' : '회수'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingDelete.open} onOpenChange={(open) => (open ? null : closeDeleteConfirm())}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회원을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete.target ? (
                <div className="min-w-0 space-y-2 break-words">
                  <div>
                    대상: <span className="font-medium text-foreground">{pendingDelete.target.nickname}</span> ({pendingDelete.target.email})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    이 작업은 되돌릴 수 없습니다. 정말로 이 회원을 삭제하시겠습니까?
                  </div>
                  {currentMember?.id === pendingDelete.target.id ? (
                    <div className="mt-2 text-sm font-medium text-destructive">
                      본인 계정을 삭제하면 즉시 로그아웃됩니다.
                    </div>
                  ) : null}
                </div>
              ) : (
                '이 작업은 되돌릴 수 없습니다.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteConfirm}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default AdminMembersPage;
