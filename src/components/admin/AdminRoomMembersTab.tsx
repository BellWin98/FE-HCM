import { useEffect, useMemo, useState } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Award, Calendar, ChevronRight, Target } from 'lucide-react';
import type { RestInfo, RoomMember, WorkoutRecord } from '@/types';
import { AdminStateBlock } from '@/components/admin/AdminStateBlock';
import { PenaltyOverview } from '@/components/PenaltyOverview';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type AdminRoomMembersTabProps = {
  roomId: number;
  ownerNickname: string;
  minWeeklyWorkouts: number;
  members: RoomMember[];
};

type MemberDetailContentProps = {
  member: RoomMember;
  ownerNickname: string;
  minWeeklyWorkouts: number;
  sortedRecords: WorkoutRecord[];
  onZoomImages: (urls: string[], index?: number) => void;
};

const formatJoinedDate = (isoLike?: string): string => {
  if (!isoLike) return '-';
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return isoLike;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const isMemberOnRestToday = (member: RoomMember): boolean => {
  const todayDate = startOfDay(new Date());
  return member.restInfoList.some((restInfo: RestInfo) => {
    const startDate = startOfDay(new Date(restInfo.startDate));
    const endDate = endOfDay(new Date(restInfo.endDate));
    return todayDate >= startDate && todayDate <= endDate;
  });
};

const sortWorkoutRecords = (records: WorkoutRecord[]): WorkoutRecord[] =>
  [...records].sort((a, b) => b.workoutDate.localeCompare(a.workoutDate));

const MemberDetailContent = ({
  member,
  ownerNickname,
  minWeeklyWorkouts,
  sortedRecords,
  onZoomImages,
}: MemberDetailContentProps) => {
  const isOwner = member.nickname === ownerNickname;
  const onRest = member.isOnBreak || isMemberOnRestToday(member);

  return (
    <div className="space-y-4 pb-2">
      <div className="flex flex-col items-center gap-3 border-b pb-4">
        <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
          <AvatarImage src={member.profileUrl} alt={member.nickname} />
          <AvatarFallback className="text-lg sm:text-xl">
            {member.nickname.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="flex flex-wrap items-center justify-center gap-1 text-lg font-bold sm:text-xl">
            {member.nickname}
            {isOwner ? (
              <Badge variant="secondary" className="text-xs">
                방장
              </Badge>
            ) : null}
            {onRest ? (
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-xs text-blue-800">
                휴식
              </Badge>
            ) : null}
          </h2>
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
            <span>가입 {format(new Date(member.joinedAt), 'yyyy.MM.dd', { locale: ko })}</span>
          </div>
        </div>
      </div>

      {member.bio ? (
        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="mb-1 text-sm font-semibold">소개글</p>
          <p className="whitespace-pre-line break-words text-sm text-muted-foreground">{member.bio}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <div className="flex items-center gap-2 rounded-lg border p-2.5 sm:p-3">
          <Target className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">총 운동</p>
            <p className="text-base font-bold tabular-nums sm:text-lg">{member.totalWorkouts}일</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border p-2.5 sm:p-3">
          <Award className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">이번 주</p>
            <p className="text-base font-bold tabular-nums sm:text-lg">
              {member.weeklyWorkouts}/{minWeeklyWorkouts}
            </p>
          </div>
        </div>
        <div className="col-span-2 flex items-center gap-2 rounded-lg border p-2.5 sm:col-span-1 sm:p-3">
          <span className="shrink-0 text-red-500" aria-hidden>
            💰
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">누적 벌금</p>
            <p className="text-base font-bold tabular-nums sm:text-lg">
              {member.totalPenalty.toLocaleString()}원
            </p>
          </div>
        </div>
      </div>

      {onRest && (() => {
        const restInfo = member.restInfoList.find((r: RestInfo) => {
          const start = startOfDay(new Date(r.startDate));
          const end = endOfDay(new Date(r.endDate));
          const todayDate = startOfDay(new Date());
          return todayDate >= start && todayDate <= end;
        });
        return (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="mb-1 font-medium text-blue-800">휴식 중</p>
            <p className="text-sm text-blue-700">{restInfo?.reason ?? '사유 없음'}</p>
            {restInfo ? (
              <p className="mt-1 text-xs text-blue-600">
                {format(new Date(restInfo.startDate), 'yyyy.MM.dd', { locale: ko })} ~{' '}
                {format(new Date(restInfo.endDate), 'yyyy.MM.dd', { locale: ko })}
              </p>
            ) : null}
          </div>
        );
      })()}

      <div>
        <h3 className="mb-2 text-sm font-semibold">운동 기록 ({sortedRecords.length}건)</h3>
        {sortedRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">기록이 없습니다.</p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {sortedRecords.map((record) => (
              <li key={record.id} className="space-y-2 rounded-lg border p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {format(new Date(record.workoutDate), 'M/d (EEE)', { locale: ko })}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{record.duration}분</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {record.workoutTypes?.map((type, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
                {record.imageUrls && record.imageUrls.length > 0 ? (
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory">
                    {record.imageUrls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`${record.workoutDate} 운동 인증 사진 ${idx + 1} 확대`}
                        className="shrink-0 snap-start overflow-hidden rounded-md border focus:outline-none focus:ring-2 focus:ring-ring active:opacity-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          onZoomImages(record.imageUrls, idx);
                        }}
                      >
                        <img
                          src={url}
                          alt={`운동 인증 사진 ${idx + 1}`}
                          className="h-20 w-20 object-cover sm:h-16 sm:w-16"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

type MemberListCardProps = {
  member: RoomMember;
  ownerNickname: string;
  minWeeklyWorkouts: number;
  onSelect: (member: RoomMember) => void;
};

const MemberListCard = ({ member, ownerNickname, minWeeklyWorkouts, onSelect }: MemberListCardProps) => {
  const isOwner = member.nickname === ownerNickname;
  const onRest = member.isOnBreak || isMemberOnRestToday(member);

  const handleClick = () => onSelect(member);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(member);
    }
  };

  return (
    <button
      type="button"
      aria-label={`${member.nickname} 상세 보기`}
      className="w-full rounded-lg border bg-card p-4 text-left shadow-sm transition-colors active:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          <AvatarImage src={member.profileUrl} alt={member.nickname} />
          <AvatarFallback className="text-sm">{member.nickname.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-base font-semibold">{member.nickname}</span>
            {isOwner ? (
              <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                방장
              </Badge>
            ) : null}
            {onRest ? (
              <Badge
                variant="outline"
                className="shrink-0 border-blue-200 bg-blue-50 text-[10px] px-1.5 py-0 text-blue-800"
              >
                휴식
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">가입 {formatJoinedDate(member.joinedAt)}</p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-md bg-muted/50 px-2 py-1.5 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">이번 주</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">
                {member.weeklyWorkouts}/{minWeeklyWorkouts}
              </p>
            </div>
            <div className="rounded-md bg-muted/50 px-2 py-1.5 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">총 운동</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">{member.totalWorkouts}일</p>
            </div>
            <div className="rounded-md bg-muted/50 px-2 py-1.5 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">벌금</p>
              <p className="mt-0.5 text-xs font-semibold leading-tight tabular-nums sm:text-sm">
                {member.totalPenalty.toLocaleString()}
                <span className="block text-[10px] font-normal text-muted-foreground">원</span>
              </p>
            </div>
          </div>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      </div>
    </button>
  );
};

export const AdminRoomMembersTab = ({
  roomId,
  ownerNickname,
  minWeeklyWorkouts,
  members,
}: AdminRoomMembersTabProps) => {
  const isMobile = useIsMobile();
  const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);
  const [zoomImageUrls, setZoomImageUrls] = useState<string[] | null>(null);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const sortedRecords = useMemo(
    () => (selectedMember ? sortWorkoutRecords(selectedMember.workoutRecords) : []),
    [selectedMember],
  );

  const handleSelectMember = (member: RoomMember) => {
    setSelectedMember(member);
  };

  const handleCloseMemberDetail = () => {
    setSelectedMember(null);
  };

  const handleZoomImages = (urls: string[], index = 0) => {
    setZoomImageUrls(urls);
    setZoomImageIndex(index);
  };

  useEffect(() => {
    if (!carouselApi) return;

    const updateIndex = () => {
      setZoomImageIndex(carouselApi.selectedScrollSnap());
    };

    updateIndex();
    carouselApi.on('select', updateIndex);

    return () => {
      carouselApi.off('select', updateIndex);
    };
  }, [carouselApi]);

  const memberDetailContent = selectedMember ? (
    <MemberDetailContent
      member={selectedMember}
      ownerNickname={ownerNickname}
      minWeeklyWorkouts={minWeeklyWorkouts}
      sortedRecords={sortedRecords}
      onZoomImages={handleZoomImages}
    />
  ) : null;

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="px-0 pb-3 pt-0 sm:px-6 sm:pt-6">
          <CardTitle className="text-lg sm:text-xl">참여 멤버</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {members.length}명 · 탭하여 운동 기록과 상세 정보 확인
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 sm:pb-6">
          {members.length === 0 ? (
            <AdminStateBlock variant="empty" description="참여 중인 멤버가 없습니다." />
          ) : (
            <>
              {/* 모바일: 카드 리스트 */}
              <div className="space-y-2 md:hidden">
                {members.map((member) => (
                  <MemberListCard
                    key={member.id}
                    member={member}
                    ownerNickname={ownerNickname}
                    minWeeklyWorkouts={minWeeklyWorkouts}
                    onSelect={handleSelectMember}
                  />
                ))}
              </div>

              {/* 데스크톱: 테이블 */}
              <div className="hidden overflow-x-auto rounded-md border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>멤버</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead>이번 주</TableHead>
                      <TableHead>총 운동</TableHead>
                      <TableHead>누적 벌금</TableHead>
                      <TableHead>휴식</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const isOwner = member.nickname === ownerNickname;
                      const onRest = member.isOnBreak || isMemberOnRestToday(member);

                      return (
                        <TableRow
                          key={member.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`${member.nickname} 상세 보기`}
                          className="cursor-pointer hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
                          onClick={() => handleSelectMember(member)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectMember(member);
                            }
                          }}
                        >
                          <TableCell>
                            <div className="flex min-w-0 items-center gap-2">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={member.profileUrl} alt={member.nickname} />
                                <AvatarFallback className="text-xs">
                                  {member.nickname.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="truncate font-medium">{member.nickname}</span>
                                  {isOwner ? (
                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                      방장
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatJoinedDate(member.joinedAt)}
                          </TableCell>
                          <TableCell>
                            {member.weeklyWorkouts} / {minWeeklyWorkouts}회
                          </TableCell>
                          <TableCell>{member.totalWorkouts}일</TableCell>
                          <TableCell className="font-medium tabular-nums">
                            {member.totalPenalty.toLocaleString()}원
                          </TableCell>
                          <TableCell>
                            {onRest ? (
                              <Badge
                                variant="outline"
                                className="border-blue-200 bg-blue-50 text-blue-800"
                              >
                                휴식
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PenaltyOverview roomId={roomId} roomMembers={members} currentUserId={0} />

      {/* 모바일: 하단 시트 */}
      {isMobile ? (
        <Sheet open={!!selectedMember} onOpenChange={(open) => !open && handleCloseMemberDetail()}>
          <SheetContent
            side="bottom"
            className="flex h-[92dvh] flex-col rounded-t-2xl p-0"
            aria-labelledby="admin-member-sheet-title"
          >
            <SheetHeader className="shrink-0 border-b px-4 pb-3 pt-4 text-left">
              <SheetTitle id="admin-member-sheet-title" className="text-base">
                멤버 상세
              </SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
              {memberDetailContent}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedMember} onOpenChange={(open) => !open && handleCloseMemberDetail()}>
          <DialogContent
            className="max-h-[90vh] max-w-lg overflow-y-auto"
            aria-labelledby="admin-member-profile-title"
          >
            <DialogHeader>
              <DialogTitle id="admin-member-profile-title">멤버 상세</DialogTitle>
            </DialogHeader>
            {memberDetailContent}
          </DialogContent>
        </Dialog>
      )}

      {/* 인증 사진 확대 */}
      <Dialog open={!!zoomImageUrls} onOpenChange={() => setZoomImageUrls(null)}>
        <DialogContent
          className={cn(
            'border-0 bg-black/95 p-0 shadow-none',
            'fixed inset-0 left-0 top-0 z-50 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col items-center justify-center',
            'data-[state=open]:slide-in-from-bottom-0 data-[state=closed]:slide-out-to-bottom-0',
            'sm:inset-auto sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:bg-background sm:p-0 sm:shadow-lg',
          )}
        >
          {zoomImageUrls && zoomImageUrls.length > 0 ? (
            <div className="relative flex h-full w-full items-center justify-center sm:min-h-[200px]">
              {zoomImageUrls.length === 1 ? (
                <img
                  src={zoomImageUrls[0]}
                  alt="확대된 운동 인증 사진"
                  className="max-h-[85dvh] w-full object-contain p-2 sm:max-h-[90vh] sm:rounded"
                />
              ) : (
                <Carousel
                  className="w-full px-12"
                  setApi={setCarouselApi}
                  opts={{
                    startIndex: zoomImageIndex,
                    loop: true,
                  }}
                >
                  <CarouselContent>
                    {zoomImageUrls.map((url, idx) => (
                      <CarouselItem key={idx}>
                        <img
                          src={url}
                          alt={`확대된 운동 인증 사진 ${idx + 1}`}
                          className="max-h-[85dvh] w-full object-contain sm:max-h-[90vh] sm:rounded"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2 h-11 w-11 border-0 bg-black/40 text-white hover:bg-black/60 sm:left-4" />
                  <CarouselNext className="right-2 h-11 w-11 border-0 bg-black/40 text-white hover:bg-black/60 sm:right-4" />
                </Carousel>
              )}
              {zoomImageUrls.length > 1 ? (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white sm:bottom-4">
                  {zoomImageIndex + 1} / {zoomImageUrls.length}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRoomMembersTab;
