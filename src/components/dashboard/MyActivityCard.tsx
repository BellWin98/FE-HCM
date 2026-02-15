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
    <Card className="bg-brand-surface border-white/10">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-brand-foreground">내 활동</CardTitle>
      </CardHeader>
      <CardContent>
        {todayWorkoutRecord ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-brand-primary/20 rounded-lg border border-brand-primary/30">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Dumbbell className="h-6 w-6 text-brand-bg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium mb-1.5 sm:mb-1 text-brand-foreground">오늘 운동 완료!</p>
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5 sm:mb-1">
                  {todayWorkoutRecord.workoutTypes?.map((type, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-brand-primary/30 text-brand-primary text-xs px-2 py-0.5 border-0"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-brand-foreground/70">운동시간: {todayWorkoutRecord.duration}분</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-brand-foreground/20 rounded-full flex items-center justify-center">
                <Camera className="h-6 w-6 text-brand-foreground/70" />
              </div>
              <div></div>
            </div>
            <div className="flex gap-2">
              <Button className="px-3 bg-brand-primary text-brand-bg hover:bg-brand-primary/90" onClick={onWorkoutUpload}>
                인증하기
              </Button>
              <Button variant="outline" className="px-3 border-white/20 text-brand-foreground hover:bg-white/10" onClick={onRestRegister}>
                <Pause className="w-4 h-4 mr-1" />
                휴식
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
