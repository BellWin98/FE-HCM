import { RestInfo, RoomMember } from "@/types";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Pause } from "lucide-react";
import { Dialog, DialogContent } from "./ui/dialog";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export const MemberStatus = ({ currentWorkoutRoom, today }) => {
    const weeklyGoal = currentWorkoutRoom.workoutRoomInfo.minWeeklyWorkouts;
    const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  
    // 특정 멤버가 오늘 휴식일인지 확인하는 함수
    const isMemberRestToday = (member: RoomMember) => {
      // const today = format(new Date(), 'yyyy-MM-dd');
      
      return member.restInfoList.some((restInfo: RestInfo) => {
        const startDate = new Date(restInfo.startDate);
        const endDate = new Date(restInfo.endDate);
        const todayDate = new Date(today);
        
        return todayDate >= startDate && todayDate <= endDate;
      });
    };

    return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">🔥 주간 현황</CardTitle>
                {/* <CardDescription>주간 현황</CardDescription> */}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentWorkoutRoom.workoutRoomMembers.map(member => {
              const restInfo = member?.restInfoList.find(restInfo => {
                const startDate = new Date(restInfo?.startDate);
                const endDate = new Date(restInfo?.endDate);
                const targetDate = new Date(format(new Date(), 'yyyy-MM-dd'));
                return targetDate >= startDate && targetDate <= endDate;
              });
              const isRestToday = isMemberRestToday(member);
              const hasWorkoutToday = member.workoutRecords.find(record => record.workoutDate === format(new Date(), 'yyyy-MM-dd'))?.workoutDate;
              
              return (
                <div key={member.id} className={`flex items-center justify-between p-3 rounded-md ${isRestToday ? 'bg-blue-50 border-2 border-blue-200' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
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
                          <PopoverContent>
                            <div className="space-y-2">
                              <p className="font-medium text-sm">
                                {member.workoutRecords.find(record => record.workoutDate === format(new Date(), 'yyyy-MM-dd'))?.workoutType}
                              </p>
                              <img 
                                src={member.workoutRecords.find(record => record.workoutDate === format(new Date(), 'yyyy-MM-dd'))?.imageUrl}
                                alt="운동 인증 사진"
                                className='max-w-xs max-h-60 rounded cursor-zoom-in'
                                onClick={() => setZoomImageUrl(member.workoutRecords.find(record => record.workoutDate === format(new Date(), 'yyyy-MM-dd'))?.imageUrl || null)}
                              />
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
          <Dialog open={!!zoomImageUrl} onOpenChange={() => setZoomImageUrl(null)}>
            <DialogContent>
              {zoomImageUrl && (
                <img src={zoomImageUrl} alt="확대된 운동 인증 사진" className="w-full h-auto rounded" />
              )}
            </DialogContent>
          </Dialog>
        </Card>
      );    

}

export default MemberStatus;