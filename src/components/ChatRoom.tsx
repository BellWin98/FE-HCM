import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ChatMessage, RoomMember, isChatContentType, isSystemChatType } from '@/types';
import { Client, IMessage } from '@stomp/stompjs';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import SockJS from "sockjs-client";
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Loader2, Target, Award, X } from 'lucide-react';
import { ensureFcmToken } from '@/lib/firebase';
import { Textarea } from './ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080';
const SCROLL_BOTTOM_THRESHOLD_PX = 60;
const MAX_CHAT_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type ChatRoomProps = {
  currentWorkoutRoom: {
    workoutRoomInfo?: {
      id?: number;
      name?: string;
      ownerNickname?: string;
      minWeeklyWorkouts?: number;
    } | null;
    workoutRoomMembers?: RoomMember[];
  };
};

type ChatMessageWithDisplay = ChatMessage & {
  displayTime?: string;
  displayDate?: string;
  isFirstOfGroup?: boolean;
  showAvatar?: boolean;
  showNickname?: boolean;
  profileUrl?: string;
  memberInfo?: RoomMember;
};

type ChatMessageItemProps = {
  msg: ChatMessageWithDisplay;
  isMine: boolean;
  onImageClick?: (url: string) => void;
  onMemberProfileClick?: (member: RoomMember) => void;
  onMemberProfileKeyDown?: (e: React.KeyboardEvent, member: RoomMember) => void;
};

const ChatMessageItem = memo(({ msg, isMine, onImageClick, onMemberProfileClick, onMemberProfileKeyDown }: ChatMessageItemProps) => {
  const isFirstOfGroup = msg.isFirstOfGroup ?? true;
  const unreadCount = Number(msg.unreadCount ?? 0);

  const handleImageKeyDown = useCallback(
    (e: React.KeyboardEvent, url: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onImageClick?.(url);
      }
    },
    [onImageClick],
  );

  const renderImage = (imageUrl: string | undefined) => {
    if (!imageUrl) return null;
    return (
      <button
        type="button"
        onClick={() => onImageClick?.(imageUrl)}
        onKeyDown={(e) => handleImageKeyDown(e, imageUrl)}
        className="cursor-pointer rounded-lg p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="이미지 크게 보기"
      >
        <img
          src={imageUrl}
          alt="첨부 이미지"
          className="max-h-40 max-w-[200px] rounded-lg"
        />
      </button>
    );
  };

  return (
    <div
      className={`flex min-w-0 w-full ${isMine ? 'justify-end' : 'justify-start'} ${isFirstOfGroup ? 'mt-2' : 'mt-0.5'}`}
    >
      {!isMine && (
        <div className="mr-1.5 flex shrink-0 flex-col items-center">
          {msg.showAvatar ? (
            <div
              role="button"
              tabIndex={0}
              aria-label={`${msg.sender} 프로필 보기`}
              className="flex items-center justify-center cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
              onClick={() => msg.memberInfo && onMemberProfileClick?.(msg.memberInfo)}
              onKeyDown={(e) => msg.memberInfo && onMemberProfileKeyDown?.(e, msg.memberInfo)}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={msg.profileUrl ?? msg.memberInfo?.profileUrl} alt={msg.sender} />
                <AvatarFallback className="text-xs">
                  {msg.sender?.slice(0, 2).toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>
      )}

      <div className={`flex min-w-0 max-w-[78%] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && msg.showNickname && (
          <span className="mb-0.5 text-xs text-muted-foreground">{msg.sender}</span>
        )}
        <div className="flex min-w-0 items-end gap-1">
          {!isMine && (
            <>
              {msg.type === 'IMAGE' ? (
                renderImage(msg.imageUrl)
              ) : (
                <span className="max-w-full whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2 text-sm text-card-foreground shadow-sm">
                  {msg.content}
                </span>
              )}
              <span className="shrink-0 pb-0.5 text-[10px] text-muted-foreground">
                {msg.displayTime}
              </span>
              {unreadCount > 0 && (
                <span className="ml-0.5 shrink-0 pb-0.5 text-[10px] text-primary">
                  {unreadCount}
                </span>
              )}
            </>
          )}

          {isMine && (
            <>
              <span className="shrink-0 pb-0.5 text-[10px] text-muted-foreground">
                {msg.displayTime}
              </span>
              {unreadCount > 0 && (
                <span className="ml-0.5 shrink-0 pb-0.5 text-[10px] text-primary">
                  {unreadCount}
                </span>
              )}
              {msg.type === 'IMAGE' ? (
                renderImage(msg.imageUrl)
              ) : (
                <span className="max-w-full whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary/10 px-3 py-2 text-sm text-primary">
                  {msg.content}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessageItem.displayName = 'ChatMessageItem';

export const ChatRoom = ({ currentWorkoutRoom }: ChatRoomProps) => {

  const { member } = useAuth();

  const [messages, setMessages] = useState<ChatMessageWithDisplay[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 이전 메시지 로딩 상태
  const [hasMore, setHasMore] = useState(true); // 더 불러올 메시지가 있는지
  const [nextCursor, setNextCursor] = useState<number | null>(null); // 다음 페이지 커서
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);

  const clientRef = useRef<Client | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null); // 스크롤 이벤트 감지용
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isUserNearBottomRef = useRef(true);
  const isMobile = useIsMobile();
  const roomId = currentWorkoutRoom.workoutRoomInfo?.id;
  const accessToken = localStorage.getItem('accessToken');

  // FCM 토큰 등록 (한 번만)
  useEffect(() => {
    ensureFcmToken().catch(() => {
      // 사용자가 권한을 거부한 경우 무시
    });
  }, []);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const formatTimestamp = useCallback((timestamp?: string | number | Date | null): string => {
    if (!timestamp) {
      return '';
    }
    try {
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) {
        return '';
      }
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const period = hours < 12 ? '오전' : '오후';
      const hour12 = hours % 12 === 0 ? 12 : hours % 12;

      return `${period} ${hour12}:${minutes}`;
    } catch {
      return '';
    }
  }, []);

  const formatDateLabel = useCallback((timestamp?: string | number | Date | null): string => {
    if (!timestamp) {
      return '';
    }
    try {
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) {
        return '';
      }
      const today = new Date();
      const isSameDay =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

      if (isSameDay) {
        return '오늘';
      }

      const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      const weekday = weekdayNames[date.getDay()];

      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${weekday}`;
    } catch {
      return '';
    }
  }, []);

  const updateIsUserNearBottom = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      isUserNearBottomRef.current = true;
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    isUserNearBottomRef.current = distanceFromBottom < SCROLL_BOTTOM_THRESHOLD_PX;
  }, []);

  const handleMemberProfileClick = useCallback((member: RoomMember) => {
    setSelectedMember(member);
  }, []);

  const handleMemberProfileKeyDown = useCallback((e: React.KeyboardEvent, member: RoomMember) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedMember(member);
    }
  }, []);

  const decorateMessagesForKakaoStyle = useCallback(
    (rawMessages: ChatMessageWithDisplay[]): ChatMessageWithDisplay[] => {
      const workoutRoomMembers = currentWorkoutRoom.workoutRoomMembers ?? [];

      return rawMessages.map((msg, index, arr) => {
        const prev = arr[index - 1];
        const currentDateLabel = formatDateLabel(msg.timestamp);
        const prevDateLabel = prev ? formatDateLabel(prev.timestamp) : undefined;

        const isDifferentSender = !prev || prev.sender !== msg.sender;
        const isDifferentDate = !prev || currentDateLabel !== prevDateLabel;

        let isFirstOfGroup = false;
        if (isDifferentSender || isDifferentDate) {
          isFirstOfGroup = true;
        }

        const memberInfo = workoutRoomMembers.find((m) => m.nickname === msg.sender);

        return {
          ...msg,
          displayTime: msg.displayTime ?? formatTimestamp(msg.timestamp),
          displayDate: currentDateLabel,
          isFirstOfGroup,
          showAvatar: !isDifferentDate && !msg.type?.includes('SYSTEM') && !isFirstOfGroup ? false : true,
          showNickname: isFirstOfGroup,
          profileUrl: memberInfo?.profileUrl ?? msg.profileUrl,
          memberInfo: memberInfo ?? msg.memberInfo,
        };
      });
    },
    [currentWorkoutRoom.workoutRoomMembers, formatDateLabel, formatTimestamp],
  );

  // 스크롤 시 이전 대화 기록 불러오기
  const fetchOlderMessages = useCallback(async () => {
    if (!hasMore || isLoading || !nextCursor) return;

    setIsLoading(true);

    try {
      const { messages: olderMessages, nextCursorId, hasNext } = await api.getChatHistory(roomId, nextCursor);

      // 스크롤 위치 보존을 위해 현재 스크롤 높이 저장
      const scrollContainer = scrollContainerRef.current;
      const prevScrollHeight = scrollContainer?.scrollHeight || 0;

      const mappedOlder = olderMessages.map((msg: ChatMessageWithDisplay) => ({
        ...msg,
        displayTime: msg.displayTime ?? formatTimestamp(msg.timestamp),
        displayDate: msg.displayDate ?? formatDateLabel(msg.timestamp),
      }));

      setMessages((prev) => decorateMessagesForKakaoStyle([...mappedOlder, ...prev]));
      setNextCursor(nextCursorId);
      setHasMore(hasNext);

      // 렌더링 후 스크롤 위치 복원
      if (scrollContainer) {
        // 비동기적으로 DOM 업데이트가 완료된 후 스크롤 위치 조정
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight - prevScrollHeight;
        });
      }
    } catch (error) {
      console.error('Failed to fetch old messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, nextCursor, hasMore, isLoading, formatTimestamp, formatDateLabel, decorateMessagesForKakaoStyle]);

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    updateIsUserNearBottom();
    const scrollTop = scrollContainerRef.current?.scrollTop ?? 0;
    if (scrollTop <= 20) {
      fetchOlderMessages();
    }
  };

  // WebSocket 연결 및 초기 메시지 로드
  useEffect(() => {

    // 운동방에 없거나, 로그아웃 시 연결 해제
    if (!roomId || !accessToken) {
      if (clientRef.current && clientRef.current.active) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      return;
    }

    // 메시지 수신 핸들러
    const onMessageReceived = (message: IMessage) => {
      try {
        const body = JSON.parse(message.body) as ChatMessageWithDisplay;

        // 시스템/읽음 상태 전용 메시지 타입이면 별도 처리
        if (isSystemChatType(body.type)) {
          // READ_STATUS 인 경우, 기존 메시지들의 unreadCount만 갱신
          if (body.type === 'READ_STATUS') {
            const updated = (body as unknown as { updatedMessages?: { messageId: string; unreadCount: number }[] }).updatedMessages;
            if (updated && Array.isArray(updated)) {
              setMessages((prev) =>
                prev.map((msg) => {
                  const found = updated.find((u) => String(u.messageId) === String(msg.id));
                  if (!found) {
                    return msg;
                  }
                  return {
                    ...msg,
                    unreadCount: found.unreadCount,
                  };
                }),
              );
            }
          }
          // SYSTEM/READ_STATUS 등은 말풍선으로 렌더링하지 않음
          return;
        }

        // 일반 채팅 메시지(TEXT, IMAGE 등)
        if (isChatContentType(body.type)) {
          const mappedBody: ChatMessageWithDisplay = {
            ...body,
            displayTime: formatTimestamp(body.timestamp),
            displayDate: formatDateLabel(body.timestamp),
          };
          setMessages((prev) => decorateMessagesForKakaoStyle([...prev, mappedBody]));

          // 새로운 메시지를 받으면 '읽음' 처리
          api.updateLastRead(roomId);
        }
      } catch (e) {
        // ignore
      }
    };

    const fetchInitialMessages = async () => {
      try {
        const { messages: initialMessages, nextCursorId, hasNext } = await api.getChatHistory(roomId);
        const mappedInitial = (initialMessages ?? []).map((msg: ChatMessageWithDisplay) => ({
          ...msg,
          displayTime: msg.displayTime ?? formatTimestamp(msg.timestamp),
          displayDate: msg.displayDate ?? formatDateLabel(msg.timestamp),
        }));
        setMessages(decorateMessagesForKakaoStyle(mappedInitial));
        setNextCursor(nextCursorId);
        setHasMore(hasNext);

        // 메시지를 모두 불러온 후, '읽음' 처리 요청
        await api.updateLastRead(roomId);

      } catch (error) {
        console.error("Failed to fetch initial chat history:", error);
      }
    };

    // 이미 연결된 경우, 중복 연결 방지
    if (clientRef.current && clientRef.current.active) {
      return;
    }
    const client = new Client({
      webSocketFactory: () => {
        return new SockJS(`${WS_URL}/wss`);
      },
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      // debug: (str) => {
      //     console.log(new Date(), str);
      // },
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);

        // 구독
        client.subscribe(`/topic/chat/room/${roomId}`, onMessageReceived);

        // 구독 후 초기 메시지 로드
        fetchInitialMessages();

        // (선택) 입장 메시지 전송 등
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        setIsConnected(false);
        alert('채팅 서버 연결 오류: ' + frame.headers['message']);
      },
    });
    client.activate();
    clientRef.current = client;
    return () => {
      if (clientRef.current && clientRef.current.active) {
        client.deactivate();
      }
    };
  }, [roomId, accessToken, formatTimestamp, formatDateLabel, decorateMessagesForKakaoStyle]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !clientRef.current?.connected) return;
    const content = input.trim();
    const msg = {
      type: 'TEXT',
      content,
    };
    clientRef.current.publish({
      destination: `/app/chat/room/${roomId}/send`,
      body: JSON.stringify(msg),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json'
      },
    });
    setInput('');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
    setTimeout(() => api.updateLastRead(roomId), 500); // 서버 반영 시간 고려 약간의 딜레이

    if (roomId) {
      api.notifyRoomMembers(roomId, {
        title: member.nickname + "님이 메시지를 보냈어요!",
        body: content,
        type: "CHAT",
      }).catch((notifyErr) => {
        console.warn('채팅 알림 전송 실패', notifyErr);
      });
    }
  }, [input, roomId, accessToken, member.nickname]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 모바일: Enter 시 기본 줄바꿈만 허용 (전송 안 함)
    if (isMobile) {
      return;
    }

    // 데스크톱: Enter -> 전송, Shift+Enter -> 줄바꿈
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        sendMessage();
      }
    }
  };

  const clearFile = useCallback(() => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imagePreviewUrl]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFileError(null);
    if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
      setFileError('JPEG, PNG, WebP 형식만 업로드 가능합니다.');
      setFile(null);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (selectedFile.size > MAX_CHAT_IMAGE_SIZE_BYTES) {
      setFileError('이미지 크기는 10MB 이하여야 합니다.');
      setFile(null);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(selectedFile));
    setFile(selectedFile);
  }, [imagePreviewUrl]);

  const sendImage = useCallback(async () => {
    if (!file || !roomId || !clientRef.current?.connected) return;
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.uploadChatImage(roomId, formData);
      const imageUrl = res.imageUrl ?? '';
      const msg = {
        type: 'IMAGE',
        content: '',
        imageUrl,
      };
      clientRef.current.publish({
        destination: `/app/chat/room/${roomId}/send`,
        body: JSON.stringify(msg),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
      });
      clearFile();
      setTimeout(() => api.updateLastRead(roomId), 500);
      api.notifyRoomMembers(roomId, {
        title: member.nickname + '님이 사진을 보냈어요!',
        body: '사진',
        type: 'CHAT',
      }).catch((notifyErr) => {
        console.warn('채팅 알림 전송 실패', notifyErr);
      });
      setTimeout(() => textareaRef.current?.focus(), 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.';
      alert(message);
    } finally {
      setIsUploadingImage(false);
    }
  }, [file, roomId, accessToken, member.nickname, clearFile]);

  const handleSubmit = useCallback(() => {
    if (file) {
      sendImage();
    } else if (input.trim()) {
      sendMessage();
    }
  }, [file, input, sendImage, sendMessage]);

  return (
    <>
      <Dialog
        open={!!enlargedImageUrl}
        onOpenChange={(open) => !open && setEnlargedImageUrl(null)}
      >
        <DialogContent className="max-h-[90vh] w-auto max-w-[95vw] border-0 bg-transparent p-2 shadow-none">
          {enlargedImageUrl && (
            <img
              src={enlargedImageUrl}
              alt="확대된 이미지"
              className="max-h-[85vh] max-w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!selectedMember}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMember(null);
          }
        }}
      >
        <DialogContent
          className="max-w-md max-h-[90vh] overflow-y-auto"
          aria-labelledby="member-profile-title"
          aria-describedby="member-profile-description"
        >
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle id="member-profile-title">멤버 프로필</DialogTitle>
              </DialogHeader>
              <div id="member-profile-description" className="space-y-4">
                <div className="flex flex-col items-center gap-3 pb-4 border-b">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedMember.profileUrl} alt={selectedMember.nickname} />
                    <AvatarFallback className="text-xl">
                      {selectedMember.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h2 className="text-xl font-bold flex items-center justify-center gap-1">
                      {selectedMember.nickname}
                      {selectedMember.nickname === currentWorkoutRoom.workoutRoomInfo?.ownerNickname && (
                        <Badge variant="secondary" className="text-xs">방장</Badge>
                      )}
                    </h2>
                    <div className="flex items-center justify-center gap-1 mt-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        가입일: {format(new Date(selectedMember.joinedAt), 'yyyy년 MM월 dd일', { locale: ko })}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedMember.bio && (
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <p className="text-sm font-semibold mb-1">소개글</p>
                    <p className="text-sm whitespace-pre-line break-words text-muted-foreground">
                      {selectedMember.bio}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Target className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">총 운동 일수</p>
                      <p className="text-lg font-bold">{selectedMember.totalWorkouts}일</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Award className="h-4 w-4 text-orange-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">이번 주 달성</p>
                      <p className="text-lg font-bold">
                        {selectedMember.weeklyWorkouts} / {currentWorkoutRoom.workoutRoomInfo?.minWeeklyWorkouts ?? 0}회
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <span className="text-red-500 shrink-0" aria-hidden>💰</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">누적 벌금</p>
                      <p className="text-lg font-bold">{selectedMember.totalPenalty.toLocaleString()}원</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Card className="mt-6 flex min-w-0 flex-col h-[60vh] sm:h-[400px]">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between py-2 sm:py-3">
        <CardTitle className="text-base sm:text-xl font-bold flex items-center gap-2">
          <span>💬 채팅방</span>
        </CardTitle>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span
            className={`rounded-full px-2 py-0.5 ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
          >
            {isConnected ? '연결됨' : '연결 끊김'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden pb-2 sm:pb-3">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-muted rounded-md px-3 pt-2 pb-2 sm:px-4 sm:pt-3 sm:pb-3"
        >
          {isLoading && (
            <div className="flex justify-center items-center p-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!hasMore && (
            <div className="mb-2 text-center text-[11px] text-muted-foreground">
              이전 대화가 더 이상 없습니다.
            </div>
          )}
          {messages
            .filter((msg) => !isSystemChatType(msg.type))
            .map((msg, index, filtered) => {
            const isMine = msg.sender === member.nickname;
            const prev = filtered[index - 1];
            const showDateDivider = !prev || prev.displayDate !== msg.displayDate;

            return (
              <React.Fragment key={msg.id}>
                {showDateDivider && msg.displayDate && (
                  <div className="my-3 flex items-center justify-center">
                    <span className="rounded-full bg-background border border-border px-3 py-1 text-[11px] text-muted-foreground">
                      {msg.displayDate}
                    </span>
                  </div>
                )}
                <ChatMessageItem
                  msg={msg}
                  isMine={isMine}
                  onImageClick={(url) => url && setEnlargedImageUrl(url)}
                  onMemberProfileClick={msg.memberInfo ? handleMemberProfileClick : undefined}
                  onMemberProfileKeyDown={msg.memberInfo ? handleMemberProfileKeyDown : undefined}
                />
              </React.Fragment>
            );
          })}
        </div>
        {fileError && (
          <p className="text-xs text-destructive px-1" role="alert">
            {fileError}
          </p>
        )}
        {file && imagePreviewUrl && (
          <div className="flex min-w-0 shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/50 p-2">
            <img
              src={imagePreviewUrl}
              alt="첨부 이미지 미리보기"
              className="h-14 w-14 shrink-0 rounded object-cover"
            />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFile}
                disabled={isUploadingImage}
                className="shrink-0"
                aria-label="이미지 취소"
              >
                <X className="h-4 w-4" />
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                onPointerDown={(e) => e.preventDefault()}
                disabled={!isConnected || isUploadingImage}
                className="shrink-0"
                aria-label="이미지 전송"
              >
                {isUploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  '전송'
                )}
              </Button>
            </div>
          </div>
        )}
        <div className="mt-1 flex min-w-0 shrink-0 items-end gap-2 border-t border-border bg-background pt-2 pb-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="chat-image-upload"
            aria-label="채팅 이미지 선택"
          />
          <label
            htmlFor="chat-image-upload"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground text-xl hover:bg-muted/80"
            aria-label="이미지 첨부"
          >
            +
          </label>
          <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-input bg-background px-3 py-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요"
              rows={1}
              className="max-h-[96px] min-h-[36px] min-w-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            onClick={handleSubmit}
            onPointerDown={(e) => e.preventDefault()}
            disabled={!isConnected || (file ? false : !input.trim()) || isUploadingImage}
            className="h-9 shrink-0 px-4 text-sm font-medium disabled:opacity-50"
            variant={file || input.trim() ? 'default' : 'secondary'}
            aria-label={file ? '이미지 전송' : '메시지 전송'}
          >
            {isUploadingImage ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              '전송'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  );
};

export default ChatRoom; 