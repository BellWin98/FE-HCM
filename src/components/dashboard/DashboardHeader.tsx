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
  const currentRoomName =
    joinedRooms.find((room) => room.id === currentRoomId)?.name ?? undefined;

  return (
    <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="text-sm text-white/80 sm:text-base">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
