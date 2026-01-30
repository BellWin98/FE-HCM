import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutRoomDetail, Member } from '@/types';
import { AlertTriangle, Calendar as CalendarIcon, Pause, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  currentWorkoutRoom: WorkoutRoomDetail;
  member: Member | null;
  isTodayRestDay: boolean;
}

export const StatsCards = ({ currentWorkoutRoom, member, isTodayRestDay }: StatsCardsProps) => {
  const currentMember = currentWorkoutRoom.workoutRoomMembers.find(
    (roomMember) => roomMember.nickname === member?.nickname
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">이번 주 운동</CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isTodayRestDay ? (
            <div className="flex items-center gap-2">
              <Pause className="w-6 h-6 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">휴식</span>
            </div>
          ) : (
            <div className="text-2xl font-bold">
              {currentMember?.weeklyWorkouts}/{currentWorkoutRoom.workoutRoomInfo.minWeeklyWorkouts}회
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 운동일</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentMember?.totalWorkouts}일</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">1회 미인증 시 벌금</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {currentWorkoutRoom.workoutRoomInfo.penaltyPerMiss}원
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
