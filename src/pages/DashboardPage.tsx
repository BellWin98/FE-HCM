import AvailableWorkoutRooms from '@/components/AvailableWorkoutRooms';
import ChatRoom from '@/components/ChatRoom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MyActivityCard } from '@/components/dashboard/MyActivityCard';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { AvailableRoomsDialog } from '@/components/dialogs/AvailableRoomsDialog';
import { RoomCodeDialog } from '@/components/dialogs/RoomCodeDialog';
import { RestDayDialog } from '@/components/dialogs/RestDayDialog';
import { Layout } from '@/components/layout/Layout';
import MyWorkoutRoom from '@/components/MyWorkoutRoom';
import { PenaltyAccountManager } from '@/components/PenaltyAccountManager';
import PenaltyOverview from '@/components/PenaltyOverview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRestDay } from '@/hooks/useRestDay';
import { useRoomJoin } from '@/hooks/useRoomJoin';
import { toast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import { WorkoutRoom, WorkoutRoomDetail } from '@/types';
import { initializeApp } from 'firebase/app';
import { onMessage } from 'firebase/messaging';
import { getToken } from 'firebase/messaging';
import { getMessaging } from 'firebase/messaging';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// VAPID 키는 웹 푸시 토큰 발급에 필요
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;


const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const today = new Date();
today.setHours(0, 0, 0, 0);

export const DashboardPage = () => {
  const { member } = useAuth();
  const navigate = useNavigate();

  // 커스텀 훅 사용
  const {
    isLoading,
    isMemberInWorkoutRoom,
    joinedRooms,
    availableWorkoutRooms,
    currentWorkoutRoom,
    setCurrentWorkoutRoom,
  } = useDashboardData();

  const roomJoin = useRoomJoin();
  const restDay = useRestDay();

  // FCM 토큰 발급 (로그인 + 운동방 참여 시)
  useEffect(() => {
    if (member && isMemberInWorkoutRoom) {
      const requestPermission = async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, { vapidKey: vapidKey });
          if (!token) return null;
          try {
            await api.registerFcmToken(token);
          } catch (e) {
            console.warn('FCM 토큰 등록 실패 (서버)', e);
          }
        }
      };

      requestPermission();

      // 2. 포그라운드 메시지 수신 리스너 (같은 운동방 타 유저 알림만 Toast로 표시, 발신자 본인은 제외)
      const unsubscribe = onMessage(messaging, (payload) => {
        const data = payload.data as Record<string, string> | undefined;
        console.log("data: " + JSON.stringify(data));
        const senderId = data?.senderId;
        const isFromMe = senderId != null && String(member?.id) === senderId;
        
        if (isFromMe) return;

        const title = data?.title ?? '알림';
        const body = data?.body;
        toast(title, {
          description: body ?? undefined,
          duration: 2000,
        });
      });

      return () => unsubscribe();
    }
  }, [member, isMemberInWorkoutRoom]);

  // 모든 운동방 보기 관련 상태
  const [showAvailableRoomsDialog, setShowAvailableRoomsDialog] = useState(false);
  const [joinedRoomIds, setJoinedRoomIds] = useState<number[]>([]);
  const [isRegeneratingEntryCode, setIsRegeneratingEntryCode] = useState(false);

  // 오늘이 휴식일인지 확인하는 함수
  const isTodayRestDay = () => {
    if (!currentWorkoutRoom) return false;

    const currentMember = currentWorkoutRoom.workoutRoomMembers.find(
      (roomMember) => roomMember.nickname === member?.nickname
    );

    if (!currentMember) return false;

    return currentMember.restInfoList.some((restInfo) => {
      const startDate = new Date(restInfo.startDate);
      const endDate = new Date(restInfo.endDate);
      const todayDate = new Date(today);

      return todayDate >= startDate && todayDate <= endDate;
    });
  };

  const handleWorkoutUpload = () => {
    navigate('/workout/upload', {
      state: { currentWorkoutRoom: currentWorkoutRoom }
    });
  };

  const handleCreateWorkoutRoom = () => navigate('/rooms/create');

  const handleShowAvailableRooms = () => {
    setJoinedRoomIds(joinedRooms.map((r) => r.id));
    setShowAvailableRoomsDialog(true);
  };

  const handleSelectRoom = async (roomId: number) => {
    try {
      const detail = await api.getWorkoutRoomDetail(roomId) as WorkoutRoomDetail;
      try {
        localStorage.setItem('lastViewedWorkoutRoomId', String(roomId));
      } catch {
        // ignore
      }
      setCurrentWorkoutRoom(detail);
    } catch {
      // 무시
    }
  };

  const handleRegenerateEntryCode = async () => {
    const roomId = currentWorkoutRoom?.workoutRoomInfo?.id;
    if (!roomId) return;
    setIsRegeneratingEntryCode(true);
    try {
      await api.regenerateRoomEntryCode(roomId);
      const detail = await api.getWorkoutRoomDetail(roomId) as WorkoutRoomDetail;
      setCurrentWorkoutRoom(detail);
    } catch {
      // 에러 시 토스트 등 처리 가능
    } finally {
      setIsRegeneratingEntryCode(false);
    }
  };

  const handleAvailableRoomsDialogClose = () => {
    setShowAvailableRoomsDialog(false);
  };

  if (isLoading || !availableWorkoutRooms) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="text-lg font-medium text-foreground">데이터를 불러오는 중...</p>
              <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <DashboardHeader
          title={isMemberInWorkoutRoom ? currentWorkoutRoom?.workoutRoomInfo?.name ?? '' : '운동방 목록'}
          subtitle={
            isMemberInWorkoutRoom
              ? `안녕하세요 ${member?.nickname ?? '사용자'}님!`
              : '새로운 운동방에 참여하고 건강한 습관을 만들어보세요!'
          }
          isMemberInWorkoutRoom={isMemberInWorkoutRoom}
          isLoadingAvailableRooms={false}
          joinedRooms={joinedRooms}
          currentRoomId={currentWorkoutRoom?.workoutRoomInfo?.id}
          onShowAvailableRooms={handleShowAvailableRooms}
          onNavigateToMyRooms={() => navigate('/rooms/joined')}
          onSelectRoom={handleSelectRoom}
          onCreateWorkoutRoom={handleCreateWorkoutRoom}
        />

        {/* 통계 카드 */}
        {isMemberInWorkoutRoom && currentWorkoutRoom && (
          <StatsCards
            currentWorkoutRoom={currentWorkoutRoom}
            member={member}
            isTodayRestDay={isTodayRestDay()}
          />
        )}

        {/* 내 활동 카드 */}
        {currentWorkoutRoom && (
          <MyActivityCard
            currentWorkoutRoom={currentWorkoutRoom}
            onWorkoutUpload={handleWorkoutUpload}
            onRestRegister={restDay.handleRestRegister}
          />
        )}

        {/* 탭 컨텐츠 */}
        {currentWorkoutRoom ? (
          <Tabs defaultValue="room" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="room">운동방</TabsTrigger>
              <TabsTrigger value="penalty">벌금 관리</TabsTrigger>
              <TabsTrigger value="chatroom">채팅방</TabsTrigger>
            </TabsList>

            <TabsContent value="room" className="space-y-6">
              <MyWorkoutRoom
                currentWorkoutRoom={currentWorkoutRoom}
                today={today}
                currentMember={member}
                onRegenerateEntryCode={handleRegenerateEntryCode}
                isRegeneratingEntryCode={isRegeneratingEntryCode}
              />
            </TabsContent>

            <TabsContent value="penalty" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PenaltyOverview
                  roomId={currentWorkoutRoom.workoutRoomInfo?.id ?? 0}
                  roomMembers={currentWorkoutRoom.workoutRoomMembers}
                  currentUserId={member?.id || 0}
                />
                <PenaltyAccountManager
                  roomId={currentWorkoutRoom.workoutRoomInfo?.id ?? 0}
                  isOwner={currentWorkoutRoom.workoutRoomInfo?.ownerNickname === member?.nickname}
                />
              </div>
            </TabsContent>

            <TabsContent value="chatroom" className="space-y-6">
              <ChatRoom currentWorkoutRoom={currentWorkoutRoom} />
            </TabsContent>
          </Tabs>
        ) : (
          <AvailableWorkoutRooms
            workoutRooms={availableWorkoutRooms}
            onCreateWorkoutRoom={handleCreateWorkoutRoom}
            onJoinByCode={roomJoin.openRoomCodeDialog}
          />
        )}

        {/* 비밀번호 다이얼로그 */}
        <RoomCodeDialog
          open={roomJoin.showRoomCodeDialog}
          onOpenChange={roomJoin.setShowRoomCodeDialog}
          roomCode={roomJoin.roomCode}
          onRoomCodeChange={roomJoin.handleRoomCodeChange}
          onSubmit={roomJoin.handleCodeSubmit}
          onClose={roomJoin.handleDialogClose}
          isJoining={roomJoin.isJoining}
          error={roomJoin.error}
        />

        {/* 휴식일 등록 다이얼로그 */}
        <RestDayDialog
          open={restDay.showRestDialog}
          onOpenChange={restDay.setShowRestDialog}
          restReason={restDay.restReason}
          onRestReasonChange={restDay.setRestReason}
          restStartDate={restDay.restStartDate}
          onRestStartDateChange={restDay.setRestStartDate}
          restEndDate={restDay.restEndDate}
          onRestEndDateChange={restDay.setRestEndDate}
          onSubmit={restDay.handleRestSubmit}
          onClose={restDay.handleRestDialogClose}
          isRegisteringRest={restDay.isRegisteringRest}
          error={restDay.error}
          today={restDay.today}
        />

        {/* 모든 운동방 보기 다이얼로그 */}
        <AvailableRoomsDialog
          open={showAvailableRoomsDialog}
          onOpenChange={setShowAvailableRoomsDialog}
          rooms={availableWorkoutRooms}
          isLoading={false}
          isAdmin={member?.role === 'ADMIN'}
          joinedRoomIds={joinedRoomIds}
          onJoinByCode={roomJoin.openRoomCodeDialog}
          onClose={handleAvailableRoomsDialogClose}
        />
      </div>
    </Layout>
  );
};

export default DashboardPage;
