import { Layout } from '@/components/layout/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { WorkoutRoom, WorkoutRoomDetail } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertTriangle, Calendar as CalendarIcon, Camera, CheckCircle2, Circle, LogIn, Plus, TrendingUp, Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { member } = useAuth();
  const navigate = useNavigate();
  
  // API 로딩 및 방 참여 여부 시뮬레이션 상태
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isMemberInWorkoutRoom, setIsMemberInWorkoutRoom] = useState(false); 
  const [availableWorkoutRooms, setAvailableWorkoutRooms] = useState<WorkoutRoom[]>([]);
  const [currentWorkoutRoom, setCurrentWorkoutRoom] = useState<WorkoutRoomDetail | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const loadDashboardStats = async () => {
      setIsLoading(true);
      const isMemberInWorkoutRoom = await api.isMemberInWorkoutRoom() as boolean;
      setIsMemberInWorkoutRoom(isMemberInWorkoutRoom);

      if (isMemberInWorkoutRoom) {
        const currentWorkoutRoom = await api.getCurrentWorkoutRoom() as WorkoutRoomDetail;
        setCurrentWorkoutRoom(currentWorkoutRoom);
      } else {
        const availableWorkoutRooms = await api.getAvailableWorkoutRooms() as WorkoutRoom[];
        setAvailableWorkoutRooms(availableWorkoutRooms);
      }
      setIsLoading(false);
    };

    loadDashboardStats();
  }, [isMemberInWorkoutRoom]);

  const handleWorkoutUpload = () => navigate('/workout/upload');
  const handleCreateWorkoutRoom = () => navigate('/rooms/create');
  const handleJoinWorkoutRoom = async (workoutRoomId: number) => {
    setSelectedRoomId(workoutRoomId);
    setShowPasswordDialog(true);
  }
  const handlePasswordSubmit = async () => {
    setError('');
    if (!selectedRoomId || !password.trim()) return;

    setIsJoining(true);
    try {
      await api.joinWorkoutRoomByEntryCode(selectedRoomId, password);
      setShowPasswordDialog(false);
      setPassword('');
      setSelectedRoomId(null);

      // 방 참여 후 페이지 새로고침 또는 상태 업데이트
      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : '방에 입장할 수 없습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleDialogClose = () => {
    setShowPasswordDialog(false);
    setPassword('');
    setSelectedRoomId(null);
  }

  if (isLoading || !availableWorkoutRooms) {
    return <Layout><div>Loading...</div></Layout>; // TODO: 스켈레톤 UI 적용
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">
            안녕하세요, {member?.nickname ?? '사용자'}님! 👋
          </h1>
          <p className="text-blue-100">
            {isMemberInWorkoutRoom ? '오늘도 팀원들과 함께 목표를 달성해보세요!' : '새로운 운동방에 참여하고 건강한 습관을 만들어보세요!'}
          </p>
        </div>

        {/* 통계 카드 */}
        {isMemberInWorkoutRoom && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">이번 주 운동</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {0}/{currentWorkoutRoom.workoutRoomInfo.minWeeklyWorkouts}회
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 운동일</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{member?.totalWorkoutDays}일</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">미납 벌금</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {0}원
                </div>
                <p className="text-xs text-muted-foreground">
                  누적 벌금 {member?.totalPenalty.toLocaleString()}원
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {currentWorkoutRoom && (
          <Card>
            <CardHeader>
              <CardTitle>오늘의 운동 현황</CardTitle>
            </CardHeader>
            <CardContent>
              {currentWorkoutRoom.currentMemberTodayWorkoutRecord ? (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">운동 인증 완료!</p>
                      <p className="text-sm text-muted-foreground">
                        {currentWorkoutRoom.currentMemberTodayWorkoutRecord?.workoutType} - {currentWorkoutRoom.currentMemberTodayWorkoutRecord?.duration}분
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

        {currentWorkoutRoom ? (
          <MyWorkoutRoom currentWorkoutRoom={currentWorkoutRoom} />
        ) : (
          <AvailableWorkoutRooms workoutRooms={availableWorkoutRooms} onCreateWorkoutRoom={handleCreateWorkoutRoom} onJoinWorkoutRoom={handleJoinWorkoutRoom} />
        )}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>운동방 참여</DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <Input
                  type='password'
                  placeholder='방 비밀번호를 입력하세요'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  disabled={isJoining}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className='flex justify-end space-x-2'>
                <Button variant='outline' onClick={handleDialogClose}>
                  취소
                </Button>
                <Button onClick={handlePasswordSubmit} disabled={isJoining || !password.trim()}>
                  {isJoining ? '참여 중...' : '참여하기'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

// --- 컴포넌트 ---

function MyWorkoutRoom({ currentWorkoutRoom }: { currentWorkoutRoom: WorkoutRoomDetail }) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const renderDayContent = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dailyStatus = currentWorkoutRoom.workoutRoomMembers.map(member => {
      let record = 'pending';
      

      const hasWorkoutRecord = member.workoutRecords.some(
        workoutRecord => workoutRecord?.workoutDate === dateStr
      );

      if (hasWorkoutRecord) {
        record = 'completed';
      } else {
        const isOnRest = member.restInfoList.some(restInfo => {
          const startDate = new Date(restInfo?.startDate);
          const endDate = new Date(restInfo?.endDate);
          const targetDate = new Date(dateStr);

          return targetDate >= startDate && targetDate <= endDate;
        });

        if (isOnRest) {
          record = 'rest';
        }
      }

      return {
        nickname: member.nickname,
        status: record,
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
      <MemberStatus currentWorkoutRoom={currentWorkoutRoom} />
    </div>
  );
}

function MemberStatus({ currentWorkoutRoom }: { currentWorkoutRoom: WorkoutRoomDetail }) {
  const weeklyGoal = currentWorkoutRoom.workoutRoomInfo.minWeeklyWorkouts;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">🔥 {currentWorkoutRoom.workoutRoomInfo.name}</CardTitle>
            <CardDescription>함께 운동하는 멤버들의 주간 현황입니다.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentWorkoutRoom.workoutRoomMembers.map(member => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={member.profileUrl} alt={member.nickname} />
                <AvatarFallback>{member.nickname.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{member.nickname}</span>
              {currentWorkoutRoom.currentMemberTodayWorkoutRecord?.workoutDate ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">오늘 인증 완료</Badge>
              ) : (
                <Badge variant="outline">미인증</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* <span className="text-sm text-muted-foreground mr-2">인증 횟수:</span> */}
              {Array.from({ length: weeklyGoal }).map((_, i) => (
                i < member.weeklyWorkouts
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

function AvailableWorkoutRooms({ workoutRooms, onCreateWorkoutRoom, onJoinWorkoutRoom }: { workoutRooms: WorkoutRoom[], onCreateWorkoutRoom: () => void, onJoinWorkoutRoom: (workoutRoomId: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">참여 가능한 운동방</h2>
        <Button onClick={onCreateWorkoutRoom}>
          <Plus className="mr-2 h-4 w-4" /> 방 만들기
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workoutRooms.map(workoutRoom => (
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
            <div className="p-4 pt-0">
              <Button className="w-full" onClick={() => onJoinWorkoutRoom(workoutRoom.id)}>
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
