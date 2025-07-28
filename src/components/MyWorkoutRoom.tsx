import { useState } from "react";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ko } from 'date-fns/locale';
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Calendar } from "./ui/calendar";
import MemberStatus from "./MemberStatus";
import ChatRoom from "./ChatRoom";

export const MyWorkoutRoom = ( {currentWorkoutRoom, today }) => {
    const [date, setDate] = useState<Date | undefined>(new Date());

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
                  <span className="text-blue-500 text-2xl leading-none -mt-1">•</span>
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
                        <PopoverContent>
                          {record.workoutType}
                          {record?.imageUrl ? (
                            <img
                              src={record.imageUrl}
                              alt="운동 인증 사진"
                              className="max-w-xs max-h-60 rounded"
                            />
                          ) : (
                            <div>인증 사진이 없습니다.</div>
                          )}
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
  
    return (
      <div className="space-y-6">
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
        <MemberStatus currentWorkoutRoom={currentWorkoutRoom} today={today} />
        {currentWorkoutRoom && <ChatRoom currentWorkoutRoom={currentWorkoutRoom} />}
      </div>
    );
}

export default MyWorkoutRoom;