import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutRoomDetail } from '@/types';
import { Camera, Dumbbell, Pause } from 'lucide-react';

interface MyActivityCardProps {
  currentWorkoutRoom: WorkoutRoomDetail;
  onWorkoutUpload: () => void;
  onRestRegister: () => void;
}

export const MyActivityCard = ({
  currentWorkoutRoom,
  onWorkoutUpload,
  onRestRegister,
}: MyActivityCardProps) => {
  const todayWorkoutRecord = currentWorkoutRoom.currentMemberTodayWorkoutRecord;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">내 활동</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {todayWorkoutRecord ? (
              <>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium mb-1.5 sm:mb-1">오늘 운동 완료!</p>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5 sm:mb-1">
                    {todayWorkoutRecord.workoutTypes?.map((type, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5"
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    운동시간: {todayWorkoutRecord.duration}분
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <Camera className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium mb-1.5 sm:mb-1">오늘 운동 하셨나요?</p>
                  <p className="text-sm text-muted-foreground">
                    운동했으면 얼른 인증하세요!
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 mt-3 sm:mt-0 sm:ml-4">
            <Button className="px-3" onClick={onWorkoutUpload}>
              인증하기
            </Button>
            <Button variant="outline" className="px-3" onClick={onRestRegister}>
              <Pause className="w-4 h-4 mr-1" />
              휴식
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
