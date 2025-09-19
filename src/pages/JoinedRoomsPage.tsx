import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { WorkoutRoom } from '@/types';
import { Eye, List, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const AdminJoinedRoomsPage = () => {
  const { member } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [rooms, setRooms] = useState<WorkoutRoom[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        if (member?.role !== 'ADMIN') {
          navigate('/dashboard', { replace: true });
          return;
        }
        const data = await api.getMyJoinedWorkoutRooms() as WorkoutRoom[];
        setRooms(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [member, navigate]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <List className="h-5 w-5" />
                내가 들어간 운동방
              </h1>
              <p className="text-sm opacity-90 mt-2">ADMIN 전용: 여러 운동방에 동시에 참여 중인 목록</p>
            </div>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => navigate('/dashboard')}>
              <Eye className="mr-2 h-4 w-4" /> 대시보드로
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground">로딩 중...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : rooms.length === 0 ? (
          <div className="text-center text-muted-foreground">참여 중인 운동방이 없습니다.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className="flex flex-col cursor-pointer" onClick={async () => {
                try {
                  const detail = await api.getWorkoutRoomDetail(room.id);
                  navigate('/dashboard', { state: { currentWorkoutRoom: detail } });
                } catch (e) {
                  // 무시: 상세 불러오기 실패 시 이동하지 않음
                }
              }}>
                <CardHeader>
                  <CardTitle>{room.name}</CardTitle>
                  <CardDescription>
                    주 {room.minWeeklyWorkouts}회 • 벌금 {room.penaltyPerMiss.toLocaleString()}원
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    <span>
                      참여인원 {room.currentMembers} / {room.maxMembers}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">방장: {room.ownerNickname}</div>
                  <div className="text-sm text-muted-foreground">
                    기간: {format(new Date(room.startDate), 'yyyy-MM-dd')} ~ {room.endDate ? format(new Date(room.endDate), 'yyyy-MM-dd') : ''}
                  </div>
                  <div className="pt-1">
                    <Badge variant={room.isActive ? 'default' : 'secondary'}>{room.isActive ? '활성' : '비활성'}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminJoinedRoomsPage;


