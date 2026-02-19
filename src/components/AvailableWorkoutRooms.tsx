import { Button } from '@/components/ui/button';
import { LogIn, Plus, Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { WorkoutRoom } from '@/types';

interface AvailableWorkoutRoomsProps {
  workoutRooms: WorkoutRoom[];
  onCreateWorkoutRoom: () => void;
  onJoinByCode: () => void;
}

export const AvailableWorkoutRooms = ({ workoutRooms, onCreateWorkoutRoom, onJoinByCode }: AvailableWorkoutRoomsProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold">참여 가능한 운동방</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onJoinByCode}>
            <LogIn className="mr-2 h-4 w-4" /> 코드로 입장
          </Button>
          <Button onClick={onCreateWorkoutRoom}>
            <Plus className="mr-2 h-4 w-4" /> 방 만들기
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">운동방에 참여하려면</CardTitle>
          <CardDescription>
            방장으로부터 받은 입장 코드를 입력하세요. 코드로 입장 버튼을 클릭 후 코드를 입력하면 해당 운동방에 참여할 수 있습니다.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workoutRooms.map((workoutRoom) => (
          <Card key={workoutRoom.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                {workoutRoom.name}
              </CardTitle>
              <CardDescription>
                주 {workoutRoom.minWeeklyWorkouts}회 • 벌금 {workoutRoom.penaltyPerMiss.toLocaleString()}원
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                <span>참여인원 {workoutRoom.currentMembers} / {workoutRoom.maxMembers}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AvailableWorkoutRooms;