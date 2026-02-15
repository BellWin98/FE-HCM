import { Button } from '@/components/ui/button';
import { LogIn, Plus, Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';


export const AvailableWorkoutRooms = ({ workoutRooms, onCreateWorkoutRoom, onJoinWorkoutRoom }) => {
    return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-foreground">참여 가능한 운동방</h2>
            <Button onClick={onCreateWorkoutRoom} className="bg-brand-primary text-brand-bg hover:bg-brand-primary/90">
              <Plus className="mr-2 h-4 w-4" /> 방 만들기
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workoutRooms.map(workoutRoom => (
              <Card key={workoutRoom.id} className="flex flex-col bg-brand-surface border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-brand-foreground">
                    <Trophy className="w-5 h-5 text-brand-primary" />
                    {workoutRoom.name}
                  </CardTitle>
                  <CardDescription className="text-brand-foreground/80">
                    주 {workoutRoom.minWeeklyWorkouts}회 • 벌금 <span className="text-brand-penalty">{workoutRoom.penaltyPerMiss.toLocaleString()}원</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center text-sm text-brand-foreground/70">
                    <Users className="mr-2 h-4 w-4" />
                    <span>참여인원 {workoutRoom.currentMembers} / {workoutRoom.maxMembers}</span>
                  </div>
                </CardContent>
                <div className="p-4 pt-0">
                  <Button className="w-full bg-brand-primary text-brand-bg hover:bg-brand-primary/90" onClick={() => onJoinWorkoutRoom(workoutRoom.id)}>
                    <LogIn className="mr-2 h-4 w-4" />
                    참여하기
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
}

export default AvailableWorkoutRooms;