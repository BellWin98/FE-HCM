import AvailableWorkoutRooms from '@/components/AvailableWorkoutRooms';
import { Layout } from '@/components/layout/Layout';
import MyWorkoutRoom from '@/components/MyWorkoutRoom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { WorkoutRoom, WorkoutRoomDetail } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertTriangle, Calendar as CalendarIcon, Camera, Pause, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const today = new Date();
today.setHours(0, 0, 0, 0);

export const DashboardPage = () => {
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
  const [showRestDialog, setShowRestDialog] = useState(false);
  const [restReason, setRestReason] = useState('');
  const [restStartDate, setRestStartDate] = useState<Date | undefined>(new Date());
  const [restEndDate, setRestEndDate] = useState<Date | undefined>(new Date());
  const [isRegisteringRest, setIsRegisteringRest] = useState(false);

  // 오늘이 휴식일인지 확인하는 함수
  const isTodayRestDay = () => {
    if (!currentWorkoutRoom) return false;
    
    // const today = format(new Date(), 'yyyy-MM-dd');
    const currentMember = currentWorkoutRoom.workoutRoomMembers.find(
      roomMember => roomMember.nickname === member?.nickname
    );
    
    if (!currentMember) return false;
    
    return currentMember.restInfoList.some(restInfo => {
      const startDate = new Date(restInfo.startDate);
      const endDate = new Date(restInfo.endDate);
      const todayDate = new Date(today);
      
      return todayDate >= startDate && todayDate <= endDate;
    });
  };

  const convertKoreanToEnglish = (text: string) => {
    const koreanToEnglishMap: { [key: string]: string } = {
      'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't', 'ㅛ': 'y', 'ㅕ': 'u', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
      'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g', 'ㅗ': 'h', 'ㅓ': 'j', 'ㅏ': 'k', 'ㅣ': 'l',
      'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v', 'ㅠ': 'b', 'ㅜ': 'n', 'ㅡ': 'm',
      'ㅃ': 'Q', 'ㅉ': 'W', 'ㄸ': 'E', 'ㄲ': 'R', 'ㅆ': 'T', 'ㅒ': 'O', 'ㅖ': 'P'
    };

    return text.split('').map(char => koreanToEnglishMap[char] || char).join('');
  }

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

  const handleRestRegister = () => {

    setRestStartDate(today);

    // 가장 최근 enabled 날짜 찾기 (월요일 중에서)
    const nextMonday = new Date(today);

    /* 오늘부터 휴식일 등록 가능

    // 다음 월요일 찾기
    const daysUntilMonday = (8 - nextMonday.getDay()) % 7;
    if (daysUntilMonday === 0 && nextMonday.getDay() === 1) {
      // 오늘이 월요일이면 오늘을 선택
      setRestStartDate(nextMonday);
    } else {
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      setRestStartDate(nextMonday);
    }
    */
    
    // 종료일 - 가장 최근 enabled 날짜 찾기 (일요일 중에서)
    const nextSunday = new Date(today);
    // 다음 일요일 찾기
    const daysUntilSunday = (7 - nextSunday.getDay()) % 7;
    if (daysUntilSunday === 0 && nextSunday.getDay() === 0) {
      // 오늘이 일요일이면 오늘을 선택
      setRestEndDate(nextSunday);
    } else {
      nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
      if (nextMonday > nextSunday) {
        nextSunday.setDate(nextSunday.getDate() + 7);
      }
      setRestEndDate(nextSunday);
    }
    
    setShowRestDialog(true);
  };

  const handleRestSubmit = async () => {
    setError('');
    if (!restReason.trim() || !restStartDate || !restEndDate) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (restStartDate > restEndDate) {
      setError('시작일은 종료일보다 이전이어야 합니다.');
      return;
    }

    setIsRegisteringRest(true);
    try {
      await api.registerRestDay({
        reason: restReason,
        startDate: format(restStartDate, 'yyyy-MM-dd'),
        endDate: format(restEndDate, 'yyyy-MM-dd')
      });
      
      setShowRestDialog(false);
      setRestReason('');
      setRestStartDate(new Date());
      setRestEndDate(new Date());
      
      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : '휴식일을 등록할 수 없습니다.');
    } finally {
      setIsRegisteringRest(false);
    }
  };

  const handleRestDialogClose = () => {
    setShowRestDialog(false);
    setRestReason('');
    setError('');
  };

  if (isLoading || !availableWorkoutRooms) {
    return <Layout><div>Loading...</div></Layout>; // TODO: 스켈레톤 UI 적용
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-5">
            {isMemberInWorkoutRoom ? currentWorkoutRoom?.workoutRoomInfo.name : '운동방 목록'}
          </h1>
          <p className="text-medium">
            {isMemberInWorkoutRoom ? `안녕하세요 ${member?.nickname ?? '사용자'}님!` : '새로운 운동방에 참여하고 건강한 습관을 만들어보세요!'}
          </p>
        </div>

        {/* 통계 카드 */}
        {isMemberInWorkoutRoom && (
          // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">이번 주 운동</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isTodayRestDay() ? (
                  <div className="flex items-center gap-2">
                    <Pause className="w-6 h-6 text-blue-500" />
                    <span className="text-2xl font-bold text-blue-600">휴식</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold">
                    {currentWorkoutRoom.workoutRoomMembers.find(roomMember => roomMember.nickname === member.nickname)?.weeklyWorkouts}/{currentWorkoutRoom.workoutRoomInfo.minWeeklyWorkouts}회
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 운동일</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentWorkoutRoom.workoutRoomMembers.find(roomMember => roomMember.nickname === member.nickname)?.totalWorkouts}일</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">1회 미인증 시 벌금</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {currentWorkoutRoom.workoutRoomInfo.penaltyPerMiss}원
                </div>
                {/* <p className="text-xs text-muted-foreground">
                  누적 벌금 {member?.totalPenalty.toLocaleString()}원
                </p> */}
              </CardContent>
            </Card>
          </div>
        )}

        {currentWorkoutRoom && (
          <Card>
            <CardHeader>
              <CardTitle>내 활동</CardTitle>
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
              ) /*: isTodayRestDay() ? (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Pause className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">오늘은 휴식일입니다</p>
                      <p className="text-sm text-blue-600">편안히 쉬세요!</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">휴식</Badge>
                </div>
              )*/ : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <Camera className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      {/* <p className="font-medium">미인증</p> */}
                      {/* <p className="text-sm text-muted-foreground">운동을 인증하세요</p> */}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="px-3" onClick={handleWorkoutUpload}>인증하기</Button>
                    <Button variant="outline" className="px-3" onClick={handleRestRegister}>
                      <Pause className="w-4 h-4 mr-1" />
                      휴식
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentWorkoutRoom ? (
          <MyWorkoutRoom currentWorkoutRoom={currentWorkoutRoom} today={today} currentMember={member} />
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
                  onChange={(e) => {
                    const processedValue = convertKoreanToEnglish(e.target.value.replace(/\s/g, ''));
                    if (processedValue.length <= 10) {
                      setPassword(processedValue);
                    }
                  }}
                  minLength={2}
                  maxLength={10}
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

        <Dialog open={showRestDialog} onOpenChange={setShowRestDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>휴식일 등록</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rest-reason">휴식 사유</Label>
                <Textarea
                  id="rest-reason"
                  placeholder="휴식 사유를 입력하세요 (예: 부상, 개인사정 등)"
                  value={restReason}
                  onChange={(e) => setRestReason(e.target.value)}
                  disabled={isRegisteringRest}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>시작일</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                        disabled={isRegisteringRest}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {restStartDate ? format(restStartDate, 'yyyy-MM-dd', { locale: ko }) : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={restStartDate}
                        onSelect={setRestStartDate}
                        locale={ko}
                        disabled={(date) => {
                          // return date < today || date.getDay() !== 1;
                          return date < today;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-gray-500 p-2"></p>
                </div>
                
                <div>
                  <Label>종료일</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                        disabled={isRegisteringRest}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {restEndDate ? format(restEndDate, 'yyyy-MM-dd', { locale: ko }) : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={restEndDate}
                        onSelect={setRestEndDate}
                        locale={ko}
                        disabled={(date) => {
                          return date < today || date.getDay() !== 0;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-gray-500 p-2">종료일은 일요일만 선택</p>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleRestDialogClose}>
                  취소
                </Button>
                <Button 
                  onClick={handleRestSubmit} 
                  disabled={isRegisteringRest || !restReason.trim() || !restStartDate || !restEndDate}
                >
                  {isRegisteringRest ? '등록 중...' : '등록'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default DashboardPage;