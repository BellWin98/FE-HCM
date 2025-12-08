import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ChatMessage } from '@/types';
import { Client, IMessage } from '@stomp/stompjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SockJS from "sockjs-client";
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { ensureFcmToken } from '@/lib/firebaseMessaging';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

export const ChatRoom = ({ currentWorkoutRoom }) => {

  const { member } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 이전 메시지 로딩 상태
  const [hasMore, setHasMore] = useState(true); // 더 불러올 메시지가 있는지
  const [nextCursor, setNextCursor] = useState<number | null>(null); // 다음 페이지 커서

  const clientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // 맨 아래로 스크롤
  const scrollContainerRef = useRef<HTMLDivElement | null>(null) // 스크롤 이벤트 감지용

  const roomId = currentWorkoutRoom.workoutRoomInfo?.id;
  const accessToken = localStorage.getItem('accessToken');

  // FCM 토큰 등록 (한 번만)
  useEffect(() => {
    ensureFcmToken().catch(() => {
      // 사용자가 권한을 거부한 경우 무시
    });
  }, []);

  // 맨 처음 로드 시 또는 새 메시지 수신 시 채팅방 내부 스크롤만 하단으로 이동
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  // 스크롤 시 이전 대화 기록 불러오기
  const fetchOlderMessages = useCallback(async () => {
    if (!hasMore || isLoading || !nextCursor) return;

    setIsLoading(true);

    try {
      const { messages: olderMessages, nextCursorId, hasNext } = await api.getChatHistory(roomId, nextCursor);

      // 스크롤 위치 보존을 위해 현재 스크롤 높이 저장
      const scrollContainer = scrollContainerRef.current;
      const prevScrollHeight = scrollContainer?.scrollHeight || 0;

      setMessages((prev) => [...olderMessages, ...prev]);
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
  }, [roomId, nextCursor, hasMore, isLoading]);

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    if (scrollContainerRef.current?.scrollTop === 0) {
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
        const body = JSON.parse(message.body);
        setMessages((prev) => [...prev, body]);

        // 새로운 메시지를 받으면 '읽음' 처리
        api.updateLastRead(roomId);
      } catch (e) {
        // ignore
      }
    };    

    const fetchInitialMessages = async () => {
      try {
        const { messages: initialMessages, nextCursorId, hasNext } = await api.getChatHistory(roomId);
        setMessages(initialMessages);
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
  }, [roomId, accessToken]);

  // 메시지 전송
  const sendMessage = () => {
    if (!input.trim() || !clientRef.current?.connected) return;
    const msg = {
      type: 'TEXT',
      content: input,
    };
    clientRef.current.publish({
      destination: `/app/chat/room/${roomId}/send`,
      body: JSON.stringify(msg),
      headers: { Authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json'
      },
    });
    setInput('');
    setTimeout(() => api.updateLastRead(roomId), 500); // 서버 반영 시간 고려 약간의 딜레이

    // 동일 운동방 사용자에게 푸시 알림 트리거
    if (roomId) {
      api.notifyChat(roomId, { message: input }).catch((err) => {
        console.warn('채팅 알림 전송 실패', err);
      });
    }
  };

  // 이미지 첨부
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const sendImage = async () => {
    if (!file || !clientRef.current?.connected) return;
    // 실제로는 파일 업로드 API를 먼저 호출해서 imageUrl을 받아야 함
    // 여기서는 예시로만 작성
    const formData = new FormData();
    formData.append('file', file);
    // TODO: 업로드 API 연동 필요
    // const res = await api.uploadChatImage(roomId, formData);
    // const imageUrl = res.url;
    const imageUrl = URL.createObjectURL(file); // 임시
    const msg = {
      type: 'IMAGE',
      content: '',
      imageUrl,
      roomId,
    };
    clientRef.current.publish({
      destination: `/app/chat/room/${roomId}/send`,
      body: JSON.stringify(msg),
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setFile(null);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className='text-xl font-bold'>💬 채팅방</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-64 overflow-y-auto bg-slate-50 rounded p-2 mb-2 flex flex-col"
        >
          {isLoading && (
            <div className="flex justify-center items-center p-2">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}          
          {messages.map((msg) => {
            const isMine = msg.sender === member.nickname;
            return (
              <div
                key={msg.id}
                className={`mb-2 flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <span className={`text-xs ${isMine ? 'text-blue-600' : 'text-gray-500'}`}>{msg.sender} {msg.type === 'IMAGE' && '[이미지]'}</span>
                {msg.type === 'IMAGE' ? (
                  <img src={msg.imageUrl} alt="첨부 이미지" className="max-w-xs max-h-40 rounded" />
                ) : (
                  <span className={`text-sm px-3 py-1 rounded-lg ${isMine ? 'bg-blue-100 text-blue-900' : 'bg-white text-gray-900 border'}`}>{msg.content}</span>
                )}
                <span className={`text-[10px] text-gray-400 ${isMine ? 'self-end' : 'self-start'}`}>
                  {msg.timestamp && new Date(msg.timestamp).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            placeholder="메시지를 입력하세요"
            className="flex-1"
          />
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="chat-image-upload" />
          {/* <label htmlFor="chat-image-upload">
            <Button type="button" variant="outline">이미지</Button>
          </label> */}
          <Button type="button" onClick={sendMessage} disabled={!isConnected || !input.trim()}>전송</Button>
          {file && <Button type="button" onClick={sendImage} variant="secondary">첨부</Button>}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatRoom; 