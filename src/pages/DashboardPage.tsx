import AvailableWorkoutRooms from '@/components/AvailableWorkoutRooms';
import { Layout } from '@/components/layout/Layout';
import MyWorkoutRoom from '@/components/MyWorkoutRoom';
import { PenaltyAccountManager } from '@/components/PenaltyAccountManager';
import { PenaltyAccountView } from '@/components/PenaltyAccountView';
import { PenaltyPaymentComponent } from '@/components/PenaltyPayment';
import PenaltyOverview from '@/components/PenaltyOverview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { WorkoutRoom, WorkoutRoomDetail } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertTriangle, Calendar as CalendarIcon, Camera, Pause, TrendingUp, List, Trophy, Users, CreditCard, Receipt, Dumbbell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const today = new Date();
today.setHours(0, 0, 0, 0);

export const DashboardPage = () => {
  const { member } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
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
  const [showAvailableRoomsDialog, setShowAvailableRoomsDialog] = useState(false);
  const [isLoadingAvailableRooms, setIsLoadingAvailableRooms] = useState(false);
  const [joinedRoomIds, setJoinedRoomIds] = useState<number[]>([]);

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

  // 한글을 영어로 변환하는 함수
  const koreanToEnglish = (text: string): string => {
    const koreanMap: { [key: string]: string } = {
      // 자음
      'ㄱ': 'r', 'ㄲ': 'R', 'ㄴ': 's', 'ㄷ': 'e', 'ㄸ': 'E', 'ㄹ': 'f',
      'ㅁ': 'a', 'ㅂ': 'q', 'ㅃ': 'Q', 'ㅅ': 't', 'ㅆ': 'T', 'ㅇ': 'd',
      'ㅈ': 'w', 'ㅉ': 'W', 'ㅊ': 'c', 'ㅋ': 'z', 'ㅌ': 'x', 'ㅍ': 'v', 'ㅎ': 'g',
      // 모음
      'ㅏ': 'k', 'ㅐ': 'o', 'ㅑ': 'i', 'ㅒ': 'O', 'ㅓ': 'j', 'ㅔ': 'p',
      'ㅕ': 'u', 'ㅖ': 'P', 'ㅗ': 'h', 'ㅘ': 'hk', 'ㅙ': 'ho', 'ㅚ': 'hl',
      'ㅛ': 'y', 'ㅜ': 'n', 'ㅝ': 'nj', 'ㅞ': 'np', 'ㅟ': 'nl', 'ㅠ': 'b', 'ㅡ': 'm', 'ㅢ': 'ml', 'ㅣ': 'l',
      // 완성된 글자
      '가': 'rk', '각': 'rk', '간': 'rks', '갇': 'rke', '갈': 'rkf', '갉': 'rka', '갊': 'rkq', '갋': 'rkt', '갌': 'rkd', '갍': 'rkw', '갎': 'rkc', '갏': 'rkz',
      '나': 'sk', '낙': 'sk', '난': 'sks', '낟': 'ske', '날': 'skf', '낡': 'ska', '낢': 'skq', '낣': 'skt', '낤': 'skd', '낥': 'skw', '낦': 'skc', '낧': 'skz',
      '다': 'ek', '닥': 'ek', '단': 'eks', '닫': 'eke', '달': 'ekf', '닭': 'eka', '닮': 'ekq', '닯': 'ekt', '닰': 'ekd', '닱': 'ekw', '닲': 'ekc', '닳': 'ekz',
      '라': 'fk', '락': 'fk', '란': 'fks', '랃': 'fke', '랄': 'fkf', '랅': 'fka', '랆': 'fkq', '랇': 'fkt', '랈': 'fkd', '랉': 'fkw', '랊': 'fkc', '랋': 'fkz',
      '마': 'ak', '막': 'ak', '만': 'aks', '맏': 'ake', '말': 'akf', '맑': 'aka', '맒': 'akq', '맓': 'akt', '맔': 'akd', '맕': 'akw', '맖': 'akc', '맗': 'akz',
      '바': 'qk', '박': 'qk', '반': 'qks', '받': 'qke', '발': 'qkf', '밝': 'qka', '밞': 'qkq', '밟': 'qkt', '밠': 'qkd', '밡': 'qkw', '밢': 'qkc', '밣': 'qkz',
      '사': 'tk', '삭': 'tk', '산': 'tks', '삳': 'tke', '살': 'tkf', '삵': 'tka', '삶': 'tkq', '삷': 'tkt', '삸': 'tkd', '삹': 'tkw', '삺': 'tkc', '삻': 'tkz',
      '아': 'dk', '악': 'dk', '안': 'dks', '앋': 'dke', '알': 'dkf', '앍': 'dka', '앎': 'dkq', '앏': 'dkt', '앐': 'dkd', '앑': 'dkw', '앒': 'dkc', '앓': 'dkz',
      '자': 'wk', '작': 'wk', '잔': 'wks', '잗': 'wke', '잘': 'wkf', '잚': 'wka', '잛': 'wkq', '잜': 'wkt', '잝': 'wkd', '잞': 'wkw', '잟': 'wkc', '잠': 'wkz',
      '차': 'ck', '착': 'ck', '찬': 'cks', '찯': 'cke', '찰': 'ckf', '찱': 'cka', '찲': 'ckq', '찳': 'ckt', '찴': 'ckd', '찵': 'ckw', '찶': 'ckc', '찷': 'ckz',
      '카': 'zk', '칵': 'zk', '칸': 'zks', '칻': 'zke', '칼': 'zkf', '칽': 'zka', '칾': 'zkq', '칿': 'zkt', '캀': 'zkd', '캁': 'zkw', '캂': 'zkc', '캃': 'zkz',
      '타': 'xk', '탁': 'xk', '탄': 'xks', '탇': 'xke', '탈': 'xkf', '탉': 'xka', '탊': 'xkq', '탋': 'xkt', '탌': 'xkd', '탍': 'xkw', '탎': 'xkc', '탏': 'xkz',
      '파': 'vk', '팩': 'vk', '판': 'vks', '팯': 'vke', '팰': 'vkf', '팱': 'vka', '팲': 'vkq', '팳': 'vkt', '팴': 'vkd', '팵': 'vkw', '팶': 'vkc', '팷': 'vkz',
      '하': 'gk', '학': 'gk', '한': 'gks', '핟': 'gke', '할': 'gkf', '핡': 'gka', '핢': 'gkq', '핣': 'gkt', '핤': 'gkd', '핥': 'gkw', '핦': 'gkc', '핧': 'gkz'
    };
  
    return text.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, (char) => koreanMap[char] || char);
  };

  useEffect(() => {
    const loadDashboardStats = async () => {
      setIsLoading(true);
      const isMemberInWorkoutRoom = await api.isMemberInWorkoutRoom() as boolean;
      setIsMemberInWorkoutRoom(isMemberInWorkoutRoom);
      const availableWorkoutRooms = await api.getAvailableWorkoutRooms() as WorkoutRoom[];
      setAvailableWorkoutRooms(availableWorkoutRooms);

      // 라우터 state에 currentWorkoutRoom이 오면 우선 반영
      const state = location.state as { currentWorkoutRoom?: WorkoutRoomDetail } | null;
      if (state?.currentWorkoutRoom) {
        setCurrentWorkoutRoom(state.currentWorkoutRoom);
        try {
          localStorage.setItem('lastViewedWorkoutRoomId', String(state.currentWorkoutRoom.workoutRoomInfo.id));
        } catch {
          // ignore: storage may be unavailable
        }
      } else if (isMemberInWorkoutRoom) {
        let restored: WorkoutRoomDetail | null = null;
        try {
          const lastId = localStorage.getItem('lastViewedWorkoutRoomId');
          if (lastId) {
            restored = await api.getWorkoutRoomDetail(Number(lastId)) as WorkoutRoomDetail;
          }
        } catch {
          // ignore: best-effort restore
        }

        if (restored) {
          setCurrentWorkoutRoom(restored);
        } else {
          const currentWorkoutRoom = await api.getCurrentWorkoutRoom() as WorkoutRoomDetail;
          setCurrentWorkoutRoom(currentWorkoutRoom);
        }
      }
      setIsLoading(false);
    };

    loadDashboardStats();
  }, [isMemberInWorkoutRoom, location.state]);

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
      
      navigate('/dashboard');
      // window.location.reload();
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

  const handleShowAvailableRooms = async () => {
    setIsLoadingAvailableRooms(true);
    try {
      setAvailableWorkoutRooms(availableWorkoutRooms);
      // ADMIN 전용: 내가 이미 참여한 방 목록을 불러와서 표시/제어
      if (member?.role === 'ADMIN') {
        try {
          const myRooms = await api.getMyJoinedWorkoutRooms() as WorkoutRoom[];
          setJoinedRoomIds(myRooms.map(r => r.id));
        } catch (e) {
          // 무시: 실패해도 다이얼로그는 열림
        }
      }
      setShowAvailableRoomsDialog(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : '운동방 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoadingAvailableRooms(false);
    }
  };

  const handleAvailableRoomsDialogClose = () => {
    setShowAvailableRoomsDialog(false);
    setAvailableWorkoutRooms([]);
  };

  if (isLoading || !availableWorkoutRooms) {
    return <Layout><div>Loading...</div></Layout>; // TODO: 스켈레톤 UI 적용
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-5">
                {isMemberInWorkoutRoom ? currentWorkoutRoom?.workoutRoomInfo.name : '운동방 목록'}
              </h1>
              <p className="text-medium">
                {isMemberInWorkoutRoom ? `안녕하세요 ${member?.nickname ?? '사용자'}님!` : '새로운 운동방에 참여하고 건강한 습관을 만들어보세요!'}
              </p>
            </div>
            {member?.role === 'ADMIN' && (
              <div className="flex flex-col sm:flex-row gap-1.5">
                {isMemberInWorkoutRoom && (
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm px-3 py-2"
                    onClick={handleShowAvailableRooms}
                    disabled={isLoadingAvailableRooms}
                  >
                    <span className="truncate">{isLoadingAvailableRooms ? '로딩 중...' : '모든 운동방 보기'}</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm px-3 py-2"
                  onClick={() => navigate('/admin/rooms')}
                >
                  <span className="truncate">내 운동방 보기</span>
                </Button>
              </div>
            )}
          </div>
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
              <CardTitle className='text-xl font-bold'>내 활동</CardTitle>
            </CardHeader>
            <CardContent>
              {currentWorkoutRoom.currentMemberTodayWorkoutRecord ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1.5 sm:mb-1">오늘 운동 완료!</p>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5 sm:mb-1">
                        {currentWorkoutRoom.currentMemberTodayWorkoutRecord?.workoutTypes?.map((type, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5"
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        운동시간: {currentWorkoutRoom.currentMemberTodayWorkoutRecord?.duration}분
                      </p>
                    </div>
                  </div>
                  {/* <Badge variant="secondary" className="bg-green-100 text-green-800 self-start sm:self-auto">완료</Badge> */}
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
          <Tabs defaultValue="room" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="room">운동방</TabsTrigger>
              <TabsTrigger value="penalty">벌금 관리</TabsTrigger>
              {/* <TabsTrigger value="account">계좌 정보</TabsTrigger> */}
            </TabsList>
            
            <TabsContent value="room" className="space-y-6">
              <MyWorkoutRoom currentWorkoutRoom={currentWorkoutRoom} today={today} currentMember={member} />
            </TabsContent>
            
            <TabsContent value="penalty" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PenaltyOverview 
                  roomId={currentWorkoutRoom.workoutRoomInfo.id}
                  roomMembers={currentWorkoutRoom.workoutRoomMembers}
                  currentUserId={member?.id || 0}
                />
                <PenaltyAccountManager 
                    roomId={currentWorkoutRoom.workoutRoomInfo.id} 
                    isOwner={currentWorkoutRoom.workoutRoomInfo.ownerNickname === member?.nickname} 
                /> 
              </div>
             
              {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PenaltyPaymentComponent 
                  roomId={currentWorkoutRoom.workoutRoomInfo.id} 
                  userId={member?.id || 0} 
                />
              </div> */}
            </TabsContent>
            
            <TabsContent value="account" className="space-y-6">
              {/* <PenaltyAccountView roomId={currentWorkoutRoom.workoutRoomInfo.id} /> */}
              <PenaltyAccountManager 
                  roomId={currentWorkoutRoom.workoutRoomInfo.id} 
                  isOwner={currentWorkoutRoom.workoutRoomInfo.ownerNickname === member?.nickname} 
              />
            </TabsContent>
          </Tabs>
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
                    const processedValue = koreanToEnglish(e.target.value.replace(/\s/g, ''));
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

        {/* 모든 운동방 보기 다이얼로그 */}
        <Dialog open={showAvailableRoomsDialog} onOpenChange={setShowAvailableRoomsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                모든 운동방
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {isLoadingAvailableRooms ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">로딩 중...</div>
                </div>
              ) : availableWorkoutRooms.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">등록된 운동방이 없습니다.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableWorkoutRooms.map(workoutRoom => (
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
                            <span>참여인원 {workoutRoom.currentMembers} / {workoutRoom.maxMembers}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            방장: {workoutRoom.ownerNickname}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            기간: {format(new Date(workoutRoom.startDate), 'yyyy-MM-dd')} ~ {workoutRoom.endDate ? format(new Date(workoutRoom.endDate), 'yyyy-MM-dd') : ""}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={workoutRoom.isActive ? "default" : "secondary"}>
                              {workoutRoom.isActive ? "활성" : "비활성"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                      {member?.role === 'ADMIN' && (
                        <div className="p-4 pt-0">
                          {joinedRoomIds.includes(workoutRoom.id) ? (
                            <Button className="w-full" variant="outline" disabled>
                              참여중
                            </Button>
                          ) : (
                            <Button className="w-full" onClick={() => { setSelectedRoomId(workoutRoom.id); setShowPasswordDialog(true); }}>
                              참여하기
                            </Button>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={handleAvailableRoomsDialogClose}>
                닫기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default DashboardPage;