import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, Users, Camera, TrendingUp, AlertTriangle, Plus, Trophy, LogIn, CheckCircle2, Circle, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { ko, tr } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { api } from '@/lib/api';

// --- Types (실제로는 /types/index.ts 파일에 위치해야 합니다) ---
interface TodayWorkout {
  workoutType: string;
  duration: number;
}

interface WeeklyProgress {
  current: number;
  goal: number;
  percentage: number;
}

interface WorkoutRecord {
  date: string; // "YYYY-MM-DD"
  status: 'completed' | 'rest' | 'pending';
}

interface RoomMember {
  id: string;
  nickname: string;
  avatarUrl?: string;
  weeklyProgress: number;
  isWorkoutDoneToday: boolean;
  workoutHistory: WorkoutRecord[];
}

interface RoomDetails {
  id: string;
  name: string;
  currentMembers: number;
  maxMembers: number;
  minWeeklyWorkouts: number;
  penaltyPerMiss: number;
  members: RoomMember[];
}

interface AvailableRoom {
  id: string;
  name: string;
  currentMembers: number;
  maxMembers: number;
  minWeeklyWorkouts: number;
  penaltyPerMiss: number;
}

interface DashboardStats {
  todayWorkout: TodayWorkout | null;
  weeklyProgress: WeeklyProgress;
  currentRoom: RoomDetails | null;
  availableRooms: AvailableRoom[];
  pendingPenalties: number;
}

// --- Mock Data ---
const mockUserInRoomData: DashboardStats = {
  // todayWorkout: { workoutType: '헬스', duration: 60 },
  todayWorkout: null,
  weeklyProgress: { current: 2, goal: 3, percentage: 67 },
  currentRoom: {
    id: 'room1',
    name: '헬창마을 인증방 🔥',
    currentMembers: 4,
    maxMembers: 5,
    minWeeklyWorkouts: 3,
    penaltyPerMiss: 5000,
    members: [
      { id: 'user1', nickname: '한종승', weeklyProgress: 3, isWorkoutDoneToday: true, avatarUrl: 'https://github.com/shadcn.png', workoutHistory: [{ date: '2024-07-14', status: 'completed' }] },
      { id: 'user2', nickname: '복민주', weeklyProgress: 2, isWorkoutDoneToday: true, workoutHistory: [{ date: '2025-07-14', status: 'completed' }] },
      { id: 'user3', nickname: '이해람', weeklyProgress: 1, isWorkoutDoneToday: false, workoutHistory: [{ date: '2024-07-14', status: 'pending' }] },
      { id: 'user4', nickname: '김준형', weeklyProgress: 1, isWorkoutDoneToday: false, workoutHistory: [{ date: '2025-07-11', status: 'rest' }] },
    ],
  },
  availableRooms: [],
  pendingPenalties: 15000,
};

const mockUserNotInRoomData: DashboardStats = {
  todayWorkout: null,
  weeklyProgress: { current: 0, goal: 0, percentage: 0 },
  currentRoom: null,
  availableRooms: [
    { id: 'room2', name: '매일 아침 10분 스트레칭', currentMembers: 8, maxMembers: 10, minWeeklyWorkouts: 5, penaltyPerMiss: 1000 },
    { id: 'room3', name: '주 3회 헬스 인증방', currentMembers: 3, maxMembers: 7, minWeeklyWorkouts: 3, penaltyPerMiss: 5000 },
    { id: 'room4', name: '주말 등산 클럽', currentMembers: 5, maxMembers: 15, minWeeklyWorkouts: 1, penaltyPerMiss: 10000 },
  ],
  pendingPenalties: 0,
};


export default function DashboardPage() {
  const { member } = useAuth();
  const navigate = useNavigate();
  
  // API 로딩 및 방 참여 여부 시뮬레이션 상태
  const [isLoading, setIsLoading] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false); 
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const loadDashboardStats = async () => {
      setIsLoading(true);
      // --- 실제 API 호출 로직 ---
      const memberWorkoutRoom = await api.getCurrentWorkoutRoom();
      setIsInRoom(memberWorkoutRoom ? true : false);
      // const data = userRoomStatus.isInRoom ? await getRoomData() : await getAvailableRooms();
      // setStats(data);

      if (isInRoom) {
        setStats(mockUserInRoomData);
      } else {
        setStats(mockUserNotInRoomData);
      }
      setIsLoading(false);
    };

    loadDashboardStats();
  }, [isInRoom]);

  const handleWorkoutUpload = () => navigate('/workout/upload');
  const handleCreateRoom = () => navigate('/rooms/create');
  const handleJoinRoom = (roomId: string) => navigate(`/rooms/join/${roomId}`);

  if (isLoading || !stats) {
    return <Layout><div>Loading...</div></Layout>; // TODO: 스켈레톤 UI 적용
  }

  return (
    <Layout>
      {/* 개발용: 방 참여 상태 토글 */}
      <div className="absolute top-28 right-6">
        <Button onClick={() => setIsInRoom(prev => !prev)}>
          {isInRoom ? '방 없는 상태 보기' : '방 있는 상태 보기'}
        </Button>
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">
            안녕하세요, {member?.nickname ?? '사용자'}님! 👋
          </h1>
          <p className="text-blue-100">
            {isInRoom ? '오늘도 팀원들과 함께 목표를 달성해보세요!' : '새로운 운동방에 참여하고 건강한 습관을 만들어보세요!'}
          </p>
        </div>

        {/* 통계 카드 */}
        {isInRoom && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">이번 주 운동</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.weeklyProgress.current}/{stats.weeklyProgress.goal}회
                </div>
                <Progress value={stats.weeklyProgress.percentage} className="mt-2" />
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
                <div className="text-2xl font-bold">{member?.totalWorkoutDays}일</div>
                <p className="text-xs text-muted-foreground">
                  평균 달성률 {member?.achievementRate}%
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
                  누적 벌금 {member?.totalPenalty.toLocaleString()}원
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {stats.currentRoom && (
          <Card>
            <CardHeader>
              <CardTitle>오늘의 운동 현황</CardTitle>
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
                        {stats.todayWorkout.workoutType} - {stats.todayWorkout.duration}분
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">완료</Badge>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <Camera className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">아직 운동 인증을 하지 않았어요</p>
                      <p className="text-sm text-muted-foreground">오늘의 운동을 인증해보세요!</p>
                    </div>
                  </div>
                  <Button onClick={handleWorkoutUpload}>인증하기</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {stats.currentRoom ? (
          <MyWorkoutRoom room={stats.currentRoom} />
        ) : (
          <AvailableRooms rooms={stats.availableRooms} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
        )}
      </div>
    </Layout>
  );
}

// --- 컴포넌트 ---

function MyWorkoutRoom({ room }: { room: RoomDetails }) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const renderDayContent = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dailyStatus = room.members.map(member => {
      const record = member.workoutHistory.find(h => h.date === dateStr);
      return {
        nickname: member.nickname,
        status: record ? record.status : 'pending',
      };
    });

    const hasActivity = dailyStatus.some(s => s.status === 'completed' || s.status === 'rest');
    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div
            className={`flex flex-col items-center justify-center p-1 ${isToday ? 'bg-indigo-200' : ''} cursor-pointer`}
          >
            <span className="text-xs">{format(day, 'd')}</span>
            <div className="flex items-center justify-center mt-1 h-4">
              {hasActivity && (
                <span className="text-blue-500 text-2xl leading-none -mt-1">•</span>
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-60">
          <div className="space-y-2">
            <p className="font-bold text-center pb-2 border-b">{format(day, 'PPP', { locale: ko })}</p>
            {dailyStatus.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{s.nickname}</span>
                {s.status === 'completed' && <Badge variant="secondary" className="bg-green-100 text-green-800">운동 완료</Badge>}
                {s.status === 'rest' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">휴식</Badge>}
                {s.status === 'pending' && <Badge variant="outline">미인증</Badge>}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">📅 월별 운동 현황</CardTitle>
          <CardDescription>달력에서 날짜를 선택하여 멤버별 운동 상태를 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="p-0"
            locale={ko}
            components={{
              Day: ({ date }) => renderDayContent(date as Date),
            }}
            // classNames={{
            //   day: 'h-20 w-24 text-center rounded-md',
            //   day_today: 'bg-accent text-accent-foreground',
            // }}
          />
        </CardContent>
      </Card>
      <MemberStatus room={room} />
    </div>
  );
}

function MemberStatus({ room }: { room: RoomDetails }) {
  const weeklyGoal = room.minWeeklyWorkouts;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">🔥 {room.name}</CardTitle>
            <CardDescription>함께 운동하는 멤버들의 주간 현황입니다.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {room.members.map(member => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={member.avatarUrl} alt={member.nickname} />
                <AvatarFallback>{member.nickname.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{member.nickname}</span>
              {member.isWorkoutDoneToday ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">오늘 인증 완료</Badge>
              ) : (
                <Badge variant="outline">미인증</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* <span className="text-sm text-muted-foreground mr-2">인증 횟수:</span> */}
              {Array.from({ length: weeklyGoal }).map((_, i) => (
                i < member.weeklyProgress 
                  ? <CheckCircle2 key={i} className="w-5 h-5 text-green-500" /> 
                  : <Circle key={i} className="w-5 h-5 text-gray-300" />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AvailableRooms({ rooms, onCreateRoom, onJoinRoom }: { rooms: AvailableRoom[], onCreateRoom: () => void, onJoinRoom: (roomId: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">참여 가능한 운동방</h2>
        <Button onClick={onCreateRoom}>
          <Plus className="mr-2 h-4 w-4" /> 방 만들기
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
          <Card key={room.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                {room.name}
              </CardTitle>
              <CardDescription>
                주 {room.minWeeklyWorkouts}회 • 벌금 {room.penaltyPerMiss.toLocaleString()}원
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                <span>참여인원 {room.currentMembers} / {room.maxMembers}</span>
              </div>
            </CardContent>
            <div className="p-4 pt-0">
              <Button className="w-full" onClick={() => onJoinRoom(room.id)}>
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
