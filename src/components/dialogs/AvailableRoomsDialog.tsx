import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkoutRoom } from '@/types';
import { format } from 'date-fns';
import { List, Trophy, Users } from 'lucide-react';

interface AvailableRoomsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: WorkoutRoom[];
  isLoading: boolean;
  isAdmin: boolean;
  joinedRoomIds: number[];
  onJoinByCode: () => void;
  onClose: () => void;
}

export const AvailableRoomsDialog = ({
  open,
  onOpenChange,
  rooms,
  isLoading,
  isAdmin,
  joinedRoomIds,
  onJoinByCode,
  onClose,
}: AvailableRoomsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            모든 운동방
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">로딩 중...</div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">등록된 운동방이 없습니다.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((workoutRoom) => (
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
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        <span>
                          참여인원 {workoutRoom.currentMembers} / {workoutRoom.maxMembers}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">방장: {workoutRoom.ownerNickname}</div>
                      {/* <div className="text-sm text-muted-foreground">
                        기간: {format(new Date(workoutRoom.startDate), 'yyyy-MM-dd')} ~{' '}
                        {workoutRoom.endDate ? format(new Date(workoutRoom.endDate), 'yyyy-MM-dd') : ''}
                      </div> */}
                      <div className="flex items-center gap-2">
                        <Badge variant={workoutRoom.isActive ? 'default' : 'secondary'}>
                          {workoutRoom.isActive ? '활성' : '비활성'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0">
                    {joinedRoomIds.includes(workoutRoom.id) ? (
                      <Button className="w-full" variant="outline" disabled>
                        참여중
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={onJoinByCode}>
                        코드로 입장
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
