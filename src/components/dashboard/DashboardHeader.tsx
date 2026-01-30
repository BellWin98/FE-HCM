import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  isAdmin: boolean;
  isMemberInWorkoutRoom: boolean;
  isLoadingAvailableRooms: boolean;
  onShowAvailableRooms: () => void;
  onNavigateToAdminRooms: () => void;
}

export const DashboardHeader = ({
  title,
  subtitle,
  isAdmin,
  isMemberInWorkoutRoom,
  isLoadingAvailableRooms,
  onShowAvailableRooms,
  onNavigateToAdminRooms,
}: DashboardHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-5">{title}</h1>
          <p className="text-medium">{subtitle}</p>
        </div>
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-1.5">
            {isMemberInWorkoutRoom && (
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm px-3 py-2"
                onClick={onShowAvailableRooms}
                disabled={isLoadingAvailableRooms}
              >
                <span className="truncate">{isLoadingAvailableRooms ? '로딩 중...' : '모든 운동방 보기'}</span>
              </Button>
            )}
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm px-3 py-2"
              onClick={onNavigateToAdminRooms}
            >
              <span className="truncate">내 운동방 보기</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
