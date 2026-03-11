import { RestInfo, RoomMember } from "@/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { CheckCircle2, Circle, Pause, Calendar, Target, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { startOfDay, endOfDay } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "./ui/carousel";

const RECENT_WORKOUTS_LIMIT = 7;

export const MemberStatus = ({ currentWorkoutRoom, today }) => {
    const weeklyGoal = currentWorkoutRoom.workoutRoomInfo.minWeeklyWorkouts;
    const [zoomImageUrls, setZoomImageUrls] = useState<string[] | null>(null);
    const [zoomImageIndex, setZoomImageIndex] = useState<number>(0);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);
  
    // 특정 멤버가 오늘 휴식일인지 확인하는 함수
    const isMemberRestToday = (member: RoomMember) => {
      return member.restInfoList.some((restInfo: RestInfo) => {
        const startDate = startOfDay(new Date(restInfo.startDate));
        const endDate = endOfDay(new Date(restInfo.endDate));
        const todayDate = startOfDay(new Date(today));
        
        return todayDate >= startDate && todayDate <= endDate;
      });
    };

    const handleMemberProfileClick = (member: RoomMember) => {
      setSelectedMember(member);
    };

    const handleMemberProfileKeyDown = (e: React.KeyboardEvent, member: RoomMember) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setSelectedMember(member);
      }
    };

    // 캐러셀 인덱스 추적
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

    return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">🔥 이번주 운동 현황</CardTitle>
                {/* <CardDescription>주간 현황</CardDescription> */}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentWorkoutRoom.workoutRoomMembers.map(member => {
              const restInfo = member?.restInfoList.find(restInfo => {
                const startDate = startOfDay(new Date(restInfo?.startDate));
                const endDate = endOfDay(new Date(restInfo?.endDate));
                const targetDate = startOfDay(new Date());
                return targetDate >= startDate && targetDate <= endDate;
              });
              const isRestToday = isMemberRestToday(member);
              const hasWorkoutToday = member.workoutRecords.find(record => record.workoutDate === format(new Date(), 'yyyy-MM-dd'))?.workoutDate;
              
              return (
                <div key={member.id} className={`flex items-center justify-between p-3 rounded-md ${isRestToday ? 'bg-blue-50 border-2 border-blue-200' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`${member.nickname} 프로필 보기`}
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md min-w-0"
                      onClick={() => handleMemberProfileClick(member)}
                      onKeyDown={(e) => handleMemberProfileKeyDown(e, member)}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={member.profileUrl} alt={member.nickname} />
                        <AvatarFallback className="text-xs">
                          {member.nickname.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-sm truncate">
                        {member.nickname}
                        {member.nickname === currentWorkoutRoom.workoutRoomInfo.ownerNickname ? ' 👑' : ''}
                      </span>
                    </div>
                    {hasWorkoutToday ? (
                      <>
                        <Popover>
                          <PopoverTrigger>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 cursor-pointer">
                              오늘 인증
                            </Badge>
                          </PopoverTrigger>
                          <PopoverContent className="max-w-md">
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {(() => {
                                  const todayRecord = member.workoutRecords.find(record => record.workoutDate === format(new Date(), 'yyyy-MM-dd'));
                                  const workoutTypes = todayRecord?.workoutTypes;
                                  if (!workoutTypes || workoutTypes.length === 0) return null;
                                  
                                  return workoutTypes.map((type, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {type}
                                    </Badge>
                                  ));
                                })()}
                              </div>
                              {(() => {
                                const todayRecord = member.workoutRecords.find(record => record.workoutDate === format(new Date(), 'yyyy-MM-dd'));
                                const imageUrls = todayRecord?.imageUrls;
                                if (!imageUrls || imageUrls.length === 0) return null;
                                
                                if (imageUrls.length === 1) {
                                  return (
                                    <>
                                    <img 
                                      src={imageUrls[0]}
                                      alt="운동 인증 사진"
                                      className='max-w-xs max-h-60 rounded cursor-zoom-in'
                                      onClick={() => {
                                        setZoomImageUrls(imageUrls);
                                        setZoomImageIndex(0);
                                      }}
                                    />
                                    <div className="text-center text-xs text-muted-foreground mt-1">
                                      클릭하여 확대
                                    </div>
                                    </>
                                  );
                                } else if (imageUrls.length > 1) {
                                  return (
                                    <div className="w-full max-w-xs">
                                      <Carousel className="w-full">
                                        <CarouselContent>
                                          {imageUrls.map((url, idx) => (
                                            <CarouselItem key={idx}>
                                              <img 
                                                src={url}
                                                alt={`운동 인증 사진 ${idx + 1}`}
                                                className='w-full h-32 sm:h-40 object-cover rounded cursor-zoom-in'
                                                onClick={() => {
                                                  setZoomImageUrls(imageUrls);
                                                  setZoomImageIndex(idx);
                                                }}
                                              />
                                            </CarouselItem>
                                          ))}
                                        </CarouselContent>
                                        {imageUrls.length > 1 && (
                                          <>
                                            <CarouselPrevious className="left-2 h-6 w-6" />
                                            <CarouselNext className="right-2 h-6 w-6" />
                                          </>
                                        )}
                                      </Carousel>
                                      <div className="text-center text-xs text-muted-foreground mt-1">
                                        클릭하여 확대
                                      </div>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </>
                    ) : isRestToday ? (
                    <Popover>
                      <PopoverTrigger>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 cursor-pointer">휴식</Badge>
                      </PopoverTrigger>
                      <PopoverContent>
                        <div className="p-2">
                          <p className="font-medium mb-1">휴식 사유</p>
                          <p className="text-sm text-gray-600">{restInfo?.reason || '사유를 확인할 수 없습니다.'}</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                    ) : (
                      <div></div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isRestToday ? (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Pause className="w-4 h-4" />
                        <span className="text-sm font-medium">휴식일</span>
                      </div>
                    ) : (
                      Array.from({ length: weeklyGoal }).map((_, i) => (
                        i < member.weeklyWorkouts
                          ? <CheckCircle2 key={i} className="w-5 h-5 text-green-500" /> 
                          : <Circle key={i} className="w-5 h-5 text-gray-300" />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
          <Dialog open={!!zoomImageUrls} onOpenChange={() => setZoomImageUrls(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
              {zoomImageUrls && zoomImageUrls.length > 0 && (
                <div className="relative">
                  {zoomImageUrls.length === 1 ? (
                    <img 
                      src={zoomImageUrls[0]} 
                      alt="확대된 운동 인증 사진" 
                      className="w-full h-auto max-h-[90vh] object-contain rounded" 
                    />
                  ) : (
                    <Carousel 
                      className="w-full" 
                      setApi={setCarouselApi}
                      opts={{ 
                        startIndex: zoomImageIndex,
                        loop: true 
                      }}
                    >
                      <CarouselContent>
                        {zoomImageUrls.map((url, idx) => (
                          <CarouselItem key={idx}>
                            <img 
                              src={url} 
                              alt={`확대된 운동 인증 사진 ${idx + 1}`} 
                              className="w-full h-auto max-h-[90vh] object-contain rounded" 
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-4 h-8 w-8" />
                      <CarouselNext className="right-4 h-8 w-8" />
                    </Carousel>
                  )}
                  {zoomImageUrls.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {zoomImageIndex + 1} / {zoomImageUrls.length}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
            <DialogContent
              className="max-w-md max-h-[90vh] overflow-y-auto"
              aria-labelledby="member-profile-title"
              aria-describedby="member-profile-description"
            >
              {selectedMember && (
                <>
                  <DialogHeader>
                    <DialogTitle id="member-profile-title">멤버 프로필</DialogTitle>
                  </DialogHeader>
                  <div id="member-profile-description" className="space-y-4">
                    <div className="flex flex-col items-center gap-3 pb-4 border-b">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={selectedMember.profileUrl} alt={selectedMember.nickname} />
                        <AvatarFallback className="text-xl">
                          {selectedMember.nickname.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <h2 className="text-xl font-bold flex items-center justify-center gap-1">
                          {selectedMember.nickname}
                          {selectedMember.nickname === currentWorkoutRoom.workoutRoomInfo.ownerNickname && (
                            <Badge variant="secondary" className="text-xs">방장</Badge>
                          )}
                        </h2>
                        <div className="flex items-center justify-center gap-1 mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>가입일: {format(new Date(selectedMember.joinedAt), 'yyyy년 MM월 dd일', { locale: ko })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Target className="h-4 w-4 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">총 운동 일수</p>
                          <p className="text-lg font-bold">{selectedMember.totalWorkouts}일</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Award className="h-4 w-4 text-orange-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">이번 주 달성</p>
                          <p className="text-lg font-bold">{selectedMember.weeklyWorkouts} / {weeklyGoal}회</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <span className="text-red-500 shrink-0" aria-hidden>💰</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">누적 벌금</p>
                          <p className="text-lg font-bold">{selectedMember.totalPenalty.toLocaleString()}원</p>
                        </div>
                      </div>
                    </div>

                    {isMemberRestToday(selectedMember) && (() => {
                      const restInfo = selectedMember.restInfoList.find((r: RestInfo) => {
                        const start = startOfDay(new Date(r.startDate));
                        const end = endOfDay(new Date(r.endDate));
                        const todayDate = startOfDay(new Date(today));
                        return todayDate >= start && todayDate <= end;
                      });
                      return (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <p className="font-medium text-blue-800 mb-1">휴식 중</p>
                          <p className="text-sm text-blue-700">{restInfo?.reason ?? '사유 없음'}</p>
                          {restInfo && (
                            <p className="text-xs text-blue-600 mt-1">
                              {format(new Date(restInfo.startDate), 'yyyy.MM.dd', { locale: ko })} ~ {format(new Date(restInfo.endDate), 'yyyy.MM.dd', { locale: ko })}
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    <div>
                      <h3 className="text-sm font-semibold mb-2">최근 운동 기록</h3>
                      {(() => {
                        const recent = [...selectedMember.workoutRecords]
                          .sort((a, b) => b.workoutDate.localeCompare(a.workoutDate))
                          .slice(0, RECENT_WORKOUTS_LIMIT);
                        if (recent.length === 0) {
                          return <p className="text-sm text-muted-foreground">기록이 없습니다.</p>;
                        }
                        return (
                          <ul className="space-y-2">
                            {recent.map((record) => (
                              <li key={record.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                                <span className="text-muted-foreground shrink-0">
                                  {format(new Date(record.workoutDate), 'yyyy.MM.dd (EEE)', { locale: ko })}
                                </span>
                                <div className="flex flex-wrap gap-1 justify-end min-w-0">
                                  {record.workoutTypes?.map((type, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {type}
                                    </Badge>
                                  ))}
                                </div>
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </Card>
      );    

}

export default MemberStatus;