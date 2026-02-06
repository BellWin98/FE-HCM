import { Layout } from '@/components/layout/Layout';
import { AdminStateBlock } from '@/components/admin/AdminStateBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { WorkoutRoom } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { RefreshCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type ActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

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

const AdminRoomsPage = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  // 검색/필터 조건이 바뀌면 첫 페이지로.
  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, activeFilter, size]);

  const listParams = useMemo(() => {
    const active =
      activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE' ? true : false;
    return {
      query: debouncedQuery || undefined,
      active,
      page,
      size,
    };
  }, [debouncedQuery, activeFilter, page, size]);

  const roomsQuery = useQuery({
    queryKey: ['adminWorkoutRooms', listParams],
    queryFn: () => api.getAdminWorkoutRooms(listParams),
    placeholderData: keepPreviousData,
  });

  const content = roomsQuery.data?.content ?? [];
  const totalPages = roomsQuery.data?.totalPages ?? 0;
  const isLast = roomsQuery.data?.last ?? true;
  const currentPage = roomsQuery.data?.number ?? page;

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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold md:text-2xl">운동방 관리</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              전체 운동방 목록 및 검색
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => roomsQuery.refetch()}
            disabled={roomsQuery.isFetching}
            className="w-full gap-2 sm:w-auto"
          >
            <RefreshCcw className={cn('h-4 w-4', roomsQuery.isFetching && 'animate-spin')} />
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
                placeholder="방 이름 또는 방장 닉네임으로 검색"
                className="pl-9"
              />
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="whitespace-normal text-sm text-muted-foreground">상태</span>
                <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="ACTIVE">활성</SelectItem>
                    <SelectItem value="INACTIVE">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="whitespace-normal text-sm text-muted-foreground">Size</span>
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
            {roomsQuery.isLoading ? (
              <AdminStateBlock variant="loading" />
            ) : roomsQuery.isError ? (
              <AdminStateBlock
                variant="error"
                title="운동방 목록을 불러오지 못했습니다."
                description={getErrorMessage(roomsQuery.error)}
                onAction={() => roomsQuery.refetch()}
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
                  {roomsQuery.isFetching ? <div>업데이트 중...</div> : null}
                </div>

                {/* 모바일: 카드 리스트 뷰 */}
                <div className="space-y-3 md:hidden">
                  {content.map((r: WorkoutRoom) => {
                    const activeLabel = r.isActive ? '활성' : '비활성';
                    const membersText = `${r.currentMembers ?? 0} / ${r.maxMembers ?? 0}`;
                    const rulesText = `주 ${r.minWeeklyWorkouts ?? 0}회 · 미달 ${(
                      r.penaltyPerMiss ?? 0
                    ).toLocaleString()}원`;
                    const periodText = `${formatDate(r.startDate)} ~ ${formatDate(r.endDate)}`;

                    return (
                      <div
                        key={r.id}
                        className="rounded-lg border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <div className="text-xs font-mono text-muted-foreground">#{r.id}</div>
                            <div className="truncate text-base font-semibold text-foreground">
                              {r.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              방장: {r.ownerNickname || '-'}
                            </div>
                          </div>
                          <Badge variant={r.isActive ? 'default' : 'secondary'}>{activeLabel}</Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <div className="space-y-0.5">
                            <div className="font-medium text-[11px] uppercase tracking-wide text-foreground/70">
                              인원
                            </div>
                            <div className="tabular-nums text-sm text-foreground">{membersText}</div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-medium text-[11px] uppercase tracking-wide text-foreground/70">
                              기간
                            </div>
                            <div className="text-sm">{periodText}</div>
                          </div>
                          <div className="col-span-2 space-y-0.5">
                            <div className="font-medium text-[11px] uppercase tracking-wide text-foreground/70">
                              규칙
                            </div>
                            <div className="text-sm">{rulesText}</div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Button asChild className="w-full" size="sm" variant="outline">
                            <Link to={`/admin/rooms/${r.id}`}>상세 보기</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 데스크톱: 기존 테이블 뷰 */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead>방 이름</TableHead>
                          <TableHead className="w-[140px]">방장</TableHead>
                          <TableHead className="w-[110px]">상태</TableHead>
                          <TableHead className="w-[150px] text-right">인원</TableHead>
                          <TableHead className="w-[220px]">기간</TableHead>
                          <TableHead className="w-[220px]">규칙</TableHead>
                          <TableHead className="w-[110px] text-right">상세</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {content.map((r: WorkoutRoom) => {
                          const activeLabel = r.isActive ? '활성' : '비활성';
                          const membersText = `${r.currentMembers ?? 0} / ${r.maxMembers ?? 0}`;
                          const rulesText = `주 ${r.minWeeklyWorkouts ?? 0}회 · 미달 ${(
                            r.penaltyPerMiss ?? 0
                          ).toLocaleString()}원`;
                          return (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                              <TableCell className="truncate">
                                <div className="font-medium text-foreground">{r.name}</div>
                                <div className="text-xs text-muted-foreground">entry: -</div>
                              </TableCell>
                              <TableCell className="truncate">{r.ownerNickname || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={r.isActive ? 'default' : 'secondary'}>{activeLabel}</Badge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{membersText}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(r.startDate)} ~ {formatDate(r.endDate)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{rulesText}</TableCell>
                              <TableCell className="text-right">
                                <Button asChild size="sm" variant="outline">
                                  <Link to={`/admin/rooms/${r.id}`}>상세</Link>
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
    </Layout>
  );
};

export default AdminRoomsPage;
