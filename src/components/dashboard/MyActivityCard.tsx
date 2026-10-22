import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { formatElapsed, getElapsedMs, getMeasuredWorkout } from '@/lib/workoutTimer';
import { WorkoutRoomDetail } from '@/types';
import { format } from 'date-fns';
import { Camera, Clock, Dumbbell, Pause, Play, Square, Timer } from 'lucide-react';

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
  const { timer, now, start, finish, cancel } = useWorkoutTimer();
  const isRunning = timer?.endedAt === null;
  const isFinished = timer != null && timer.endedAt !== null;

  // 종료 시각을 먼저 남겨 두어야 인증 화면이 측정 시간을 채울 수 있다.
  const handleWorkoutFinish = () => {
    finish();
    onWorkoutUpload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl font-bold">내 활동</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {timer && isRunning ? (
              <>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Timer className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0" aria-live="polite">
                  <p className="font-medium mb-1.5 sm:mb-1">
                    운동 중 · <span className="font-number tabular-nums">{formatElapsed(getElapsedMs(timer, now))}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{format(timer.startedAt, 'HH:mm')} 시작</p>
                </div>
              </>
            ) : timer && isFinished ? (
              <>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Timer className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium mb-1.5 sm:mb-1">
                    측정 완료 · {getMeasuredWorkout(timer).duration ?? '?'}분
                  </p>
                  <p className="text-sm text-muted-foreground">사진을 올려 운동을 인증하세요!</p>
                </div>
              </>
            ) : todayWorkoutRecord ? (
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
                  <Badge variant="outline" className="font-number text-xs tabular-nums">
                    <Clock className="h-3 w-3 mr-1" />
                    {todayWorkoutRecord.duration}분
                  </Badge>
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
            {isRunning ? (
              <>
                <Button className="px-3" onClick={handleWorkoutFinish}>
                  <Square className="w-4 h-4 mr-1" />
                  운동 종료
                </Button>
                <Button variant="outline" className="px-3" onClick={cancel}>
                  측정 취소
                </Button>
              </>
            ) : isFinished ? (
              <>
                <Button className="px-3" onClick={onWorkoutUpload}>
                  인증하기
                </Button>
                <Button variant="outline" className="px-3" onClick={cancel}>
                  측정 취소
                </Button>
              </>
            ) : (
              <>
                {!todayWorkoutRecord && (
                  <Button variant="secondary" className="px-3" onClick={start}>
                    <Play className="w-4 h-4 mr-1" />
                    운동 시작
                  </Button>
                )}
                <Button className="px-3" onClick={onWorkoutUpload}>
                  인증하기
                </Button>
                <Button variant="outline" className="px-3" onClick={onRestRegister}>
                  <Pause className="w-4 h-4 mr-1" />
                  휴식
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
