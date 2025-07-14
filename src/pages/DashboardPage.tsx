import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  Camera, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardStats } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todayWorkout: null,
    weeklyProgress: { current: 2, goal: 3, percentage: 67 },
    currentRoom: null,
    pendingPenalties: 15000,
  });

  useEffect(() => {
    // TODO: 실제 API 호출로 대시보드 데이터 로드
    // loadDashboardStats();
  }, []);

  const handleWorkoutUpload = () => {
    navigate('/workout/upload');
  };

  const handleCreateRoom = () => {
    navigate('/rooms/create');
  };

  const handleJoinRoom = () => {
    navigate('/rooms/join');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* 환영 메시지 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">
            안녕하세요, {user?.nickname}님! 👋
          </h1>
          <p className="text-blue-100">
            오늘도 건강한 하루 만들어보세요!
          </p>
        </div>

        {/* 빠른 액션 버튼 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={handleWorkoutUpload}
            className="h-20 flex-col space-y-2"
            variant="outline"
          >
            <Camera className="h-6 w-6" />
            <span>운동 인증하기</span>
          </Button>
          <Button
            onClick={handleCreateRoom}
            className="h-20 flex-col space-y-2"
            variant="outline"
          >
            <Plus className="h-6 w-6" />
            <span>방 만들기</span>
          </Button>
          <Button
            onClick={handleJoinRoom}
            className="h-20 flex-col space-y-2"
            variant="outline"
          >
            <UserPlus className="h-6 w-6" />
            <span>방 참여하기</span>
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">이번 주 운동</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.weeklyProgress.current}/{stats.weeklyProgress.goal}
              </div>
              <Progress 
                value={stats.weeklyProgress.percentage} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                목표 달성률 {stats.weeklyProgress.percentage}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 운동일</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.totalWorkoutDays}일</div>
              <p className="text-xs text-muted-foreground">
                평균 달성률 {user?.achievementRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">미납 벌금</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.pendingPenalties.toLocaleString()}원
              </div>
              <p className="text-xs text-muted-foreground">
                누적 벌금 {user?.totalPenalty.toLocaleString()}원
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 오늘의 운동 상태 */}
        <Card>
          <CardHeader>
            <CardTitle>오늘의 운동 현황</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.todayWorkout ? (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">운동 인증 완료!</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.todayWorkout.workoutType} • {stats.todayWorkout.duration}분
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  완료
                </Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <Camera className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">아직 운동 인증을 하지 않았어요</p>
                    <p className="text-sm text-muted-foreground">
                      오늘의 운동을 인증해보세요!
                    </p>
                  </div>
                </div>
                <Button onClick={handleWorkoutUpload}>
                  인증하기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 현재 참여 중인 방 */}
        {stats.currentRoom && (
          <Card>
            <CardHeader>
              <CardTitle>참여 중인 방</CardTitle>
              <CardDescription>
                함께 운동하는 친구들과 현황을 확인해보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{stats.currentRoom.name}</h3>
                  <Badge variant="outline">
                    {stats.currentRoom.currentMembers}/{stats.currentRoom.maxMembers}명
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">주간 목표:</span>
                    <span className="ml-2 font-medium">
                      {stats.currentRoom.minWeeklyWorkouts}회
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">벌금:</span>
                    <span className="ml-2 font-medium">
                      {stats.currentRoom.penaltyPerMiss.toLocaleString()}원/회
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/rooms/${stats.currentRoom?.id}`)}
                >
                  방 상세보기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}