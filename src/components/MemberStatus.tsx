import type { RestInfo, RoomMember, WorkoutRoomDetail } from "@/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Circle, Pause } from "lucide-react";
import { Dialog, DialogContent } from "./ui/dialog";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { startOfDay, endOfDay } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "./ui/carousel";

type MemberStatusProps = {
  currentWorkoutRoom: WorkoutRoomDetail;
  today: string;
  onMemberProfileClick?: (memberId: number, nickname: string) => void;
};

export const MemberStatus = ({ currentWorkoutRoom, today, onMemberProfileClick }: MemberStatusProps) => {
    const weeklyGoal = currentWorkoutRoom.workoutRoomInfo.minWeeklyWorkouts;
    const [zoomImageUrls, setZoomImageUrls] = useState<string[] | null>(null);
    const [zoomImageIndex, setZoomImageIndex] = useState<number>(0);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  
    // 특정 멤버가 오늘 휴식일인지 확인하는 함수
    const isMemberRestToday = (member: RoomMember) => {
      return member.restInfoList.some((restInfo: RestInfo) => {
        const startDate = startOfDay(new Date(restInfo.startDate));
        const endDate = endOfDay(new Date(restInfo.endDate));
        const todayDate = startOfDay(new Date(today));
        
        return todayDate >= startDate && todayDate <= endDate;
      });
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
                    <Avatar
                      className={`h-8 w-8 shrink-0 ${onMemberProfileClick ? "cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all" : ""}`}
                      onClick={onMemberProfileClick ? () => onMemberProfileClick(member.memberId, member.nickname) : undefined}
                      tabIndex={onMemberProfileClick ? 0 : undefined}
                      role={onMemberProfileClick ? "button" : undefined}
                      aria-label={onMemberProfileClick ? `${member.nickname}님 프로필 보기` : undefined}
                      onKeyDown={
                        onMemberProfileClick
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onMemberProfileClick(member.memberId, member.nickname);
                              }
                            }
                          : undefined
                      }
                    >
                      <AvatarImage src={member.profileUrl} alt={member.nickname} />
                      <AvatarFallback className="text-xs">{member.nickname[0]}</AvatarFallback>
                    </Avatar>
                    <span 
                      className="font-bold text-sm"
                    >
                      {member.nickname}
                      {member.nickname === currentWorkoutRoom.workoutRoomInfo.ownerNickname ? ' 👑' : ''}
                    </span>
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
        </Card>
      );    

}

export default MemberStatus;