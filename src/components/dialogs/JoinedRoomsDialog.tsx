import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkoutRoom } from '@/types';
import { DoorOpen, Dumbbell } from 'lucide-react';

interface JoinedRoomsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: WorkoutRoom[];
  currentRoomId?: number;
  onSelectRoom: (roomId: number) => void;
}

export const JoinedRoomsDialog = ({
  open,
  onOpenChange,
  rooms,
  currentRoomId,
  onSelectRoom,
}: JoinedRoomsDialogProps) => {
  const handleSelect = (roomId: number) => {
    onSelectRoom(roomId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5" />
            내 운동방 선택
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {rooms.length === 0 && (
            <p className="text-sm text-muted-foreground">참여 중인 운동방이 없습니다.</p>
          )}
          {rooms.length > 0 && (
            <div className="space-y-2">
              {rooms.map((room) => {
                const isCurrent = room.id === currentRoomId;
                return (
                  <Button
                    key={room.id}
                    variant={isCurrent ? 'default' : 'outline'}
                    className="flex w-full items-center justify-between"
                    onClick={() => handleSelect(room.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      <span className="truncate">{room.name}</span>
                    </div>
                    {isCurrent && (
                      <span className="text-xs font-medium text-primary-foreground">
                        현재 선택됨
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

