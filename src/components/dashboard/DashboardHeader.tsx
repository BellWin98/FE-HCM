import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { WorkoutRoom } from '@/types';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  isMemberInWorkoutRoom: boolean;
  isLoadingAvailableRooms: boolean;
  joinedRooms?: WorkoutRoom[];
  currentRoomId?: number;
  onShowAvailableRooms: () => void;
  onNavigateToMyRooms: () => void;
  onSelectRoom?: (roomId: number) => void;
  onCreateWorkoutRoom?: () => void;
}

export const DashboardHeader = ({
  title,
  subtitle,
  isMemberInWorkoutRoom,
  isLoadingAvailableRooms,
  joinedRooms = [],
  currentRoomId,
  onShowAvailableRooms,
  onNavigateToMyRooms,
  onSelectRoom,
  onCreateWorkoutRoom,
}: DashboardHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">{title}</h1>
          </div>
          <p className="text-medium">{subtitle}</p>
        </div>
        {isMemberInWorkoutRoom && (
          <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
            {onCreateWorkoutRoom && (
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm px-3 py-2"
                onClick={onCreateWorkoutRoom}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="truncate">방 만들기</span>
              </Button>
            )}
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm px-3 py-2"
              onClick={onShowAvailableRooms}
              disabled={isLoadingAvailableRooms}
            >
              <span className="truncate">{isLoadingAvailableRooms ? '로딩 중...' : '모든 운동방 보기'}</span>
            </Button>
            {joinedRooms.length > 1 && onSelectRoom && (
              <Select
                value={currentRoomId ? String(currentRoomId) : ''}
                onValueChange={(v) => onSelectRoom(Number(v))}
              >
                <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <SelectValue placeholder="방 선택" />
                </SelectTrigger>
                <SelectContent>
                  {joinedRooms.map((room) => (
                    <SelectItem key={room.id} value={String(room.id)}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm px-3 py-2"
              onClick={onNavigateToMyRooms}
            >
              <span className="truncate">내 운동방 보기</span>
            </Button> */}
          </div>
        )}
      </div>
    </div>
  );
};
