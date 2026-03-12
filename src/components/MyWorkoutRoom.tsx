import { useState, useEffect } from "react";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ko } from 'date-fns/locale';
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Calendar } from "./ui/calendar";
import MemberStatus from "./MemberStatus";
import { RoomCodeSection } from "./RoomCodeSection";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "./ui/carousel";
import { Dialog, DialogContent } from "./ui/dialog";

export const MyWorkoutRoom = ( {currentWorkoutRoom, today, currentMember, onRegenerateEntryCode, isRegeneratingEntryCode }) => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [zoomImageUrls, setZoomImageUrls] = useState<string[] | null>(null);
    const [zoomImageIndex, setZoomImageIndex] = useState<number>(0);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    
    // 순위용 정렬된 멤버 목록 (원본 배열은 변경하지 않음)
    const sortedMembersByWorkouts = [...currentWorkoutRoom.workoutRoomMembers]
      .sort((a, b) => b.totalWorkouts - a.totalWorkouts);

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

    const renderDayContent = (day: Date) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dailyStatus = currentWorkoutRoom.workoutRoomMembers.map(member => {
        let record = 'pending';
        const hasWorkoutRecord = member.workoutRecords.some(
          workoutRecord => workoutRecord?.workoutDate === dateStr
        );
  
        if (hasWorkoutRecord) {
          record = 'completed';
        } else {
          const isOnRest = member.restInfoList.some(restInfo => {
            const startDate = new Date(restInfo?.startDate);
            const endDate = new Date(restInfo?.endDate);
            const targetDate = new Date(dateStr);
  
            return targetDate >= startDate && targetDate <= endDate;
          });
  
          if (isOnRest) {
            record = 'rest';
          }
        }
  
        return {
          nickname: member.nickname,
          status: record,
        };
      });
  
      const hasActivity = dailyStatus.some(s => s.status === 'completed' || s.status === 'rest');
      const currentMemberActivity = dailyStatus.find(ds => ds.nickname === currentMember?.nickname && (ds.status === 'completed'));
      const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  
      return (
        <Popover>
          <PopoverTrigger asChild>
            <div
              className={`flex flex-col items-center justify-center p-1 ${isToday ? 'bg-indigo-200' : ''} cursor-pointer`}
            >
              <span className="text-xs">{format(day, 'd')}</span>
              <div className="flex items-center justify-center mt-1 h-4">
                {hasActivity && (
                  <span className={`${currentMemberActivity ? 'text-green-500' : 'text-blue-500'} text-2xl leading-none -mt-1`}>•</span>
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-60">
            <div className="space-y-2">
              <p className="font-bold text-center pb-2 border-b">{format(day, 'PPP', { locale: ko })}</p>
              {dailyStatus.map((s, i) => {
                // 해당 멤버 찾기
                const memberObj = currentWorkoutRoom.workoutRoomMembers.find(m => m.nickname === s.nickname);
                // 해당 날짜의 인증 기록 찾기
                const record = memberObj?.workoutRecords.find(record => record.workoutDate === format(day, 'yyyy-MM-dd'));
                // 해당 날짜의 휴식 정보 찾기
                const restInfo = memberObj?.restInfoList.find(restInfo => {
                  const startDate = new Date(restInfo?.startDate);
                  const endDate = new Date(restInfo?.endDate);
                  const targetDate = new Date(format(day, 'yyyy-MM-dd'));
                  return targetDate >= startDate && targetDate <= endDate;
                });
                
                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{s.nickname}</span>
                    {s.status === 'completed' ? (
                      <Popover>
                        <PopoverTrigger>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 cursor-pointer">
                            인증
                          </Badge>
                        </PopoverTrigger>
                        <PopoverContent className="max-w-md">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {record.workoutTypes && record.workoutTypes.length > 0 ? (
                                record.workoutTypes.map((type, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {type}
                                  </Badge>
                                ))
                              ) : null}
                            </div>
                            {record?.imageUrls && record.imageUrls.length > 0 ? (
                              (() => {
                                const imageUrls = record.imageUrls;
                                
                                if (imageUrls.length === 1) {
                                  return (
                                    <>
                                    <img
                                      src={imageUrls[0]}
                                      alt="운동 인증 사진"
                                      className="max-w-xs max-h-60 rounded cursor-zoom-in"
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
                                                className="w-full h-32 sm:h-40 object-cover rounded cursor-zoom-in"
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
                              })()
                            ) : (
                              <div>인증 사진이 없습니다.</div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : s.status === 'rest' ? (
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
                      <Badge variant="outline">미인증</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      );
    };
  
    const isOwner = currentWorkoutRoom.workoutRoomInfo?.ownerNickname === currentMember?.nickname;
    const entryCode = currentWorkoutRoom.workoutRoomInfo?.entryCode;

    return (
      <div className="space-y-6">
        {entryCode != null && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔑 운동방 입장 코드</CardTitle>
            </CardHeader>
            <CardContent>
              <RoomCodeSection
                entryCode={entryCode}
                isOwner={isOwner}
                onRegenerate={onRegenerateEntryCode}
                isRegenerating={isRegeneratingEntryCode}
              />
            </CardContent>
          </Card>
        )}
        <MemberStatus currentWorkoutRoom={currentWorkoutRoom} today={today} />
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">📅 월별 운동 현황</CardTitle>
            <CardDescription className='p-2'>
              <div>
                달력에서 날짜를 선택하여
              </div>   
              <div>
                멤버별 운동 상태를 확인하세요.
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-lg">•</span>
                  <span className="text-gray-600">내 활동(휴식일 제외)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500 text-lg">•</span>
                  <span className="text-gray-600">다른 멤버 활동</span>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="p-0"
              locale={ko}
              components={{
                Day: ({ date }) => renderDayContent(date as Date),
              }}
              // classNames={{
              //   day: 'h-20 w-24 text-center rounded-md',
              //   day_today: 'bg-accent text-accent-foreground',
              // }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">👥 순위</CardTitle>
            <CardDescription>
              각 멤버의 총 운동 인증 횟수와 순위를 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedMembersByWorkouts.map((member, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border-2 relative ${
                    member.nickname === currentMember?.nickname 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className={`font-medium ${
                          member.nickname === currentMember?.nickname 
                            ? 'text-green-800' 
                            : 'text-gray-800'
                        }`}>
                          {member.nickname}
                          {member.nickname === currentMember?.nickname && (
                            <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">나</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${
                      member.nickname === currentMember?.nickname 
                        ? 'text-green-600' 
                        : 'text-gray-600'
                    }`}>
                      {member.totalWorkouts}일
                    </div>
                  </div>
                  {index <= 2 && (
                    <div className="absolute -top-2 -right-2">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* 이미지 확대 다이얼로그 */}
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
      </div>
    );
}

export default MyWorkoutRoom;