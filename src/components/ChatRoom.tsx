import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ChatMessage } from '@/types';
import { Client, IMessage } from '@stomp/stompjs';
import React, { useEffect, useRef, useState } from 'react';
import SockJS from "sockjs-client";
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

export const ChatRoom = ({ currentWorkoutRoom }) => {

  const { member } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const roomId = currentWorkoutRoom.workoutRoomInfo?.id;
  const accessToken = localStorage.getItem('accessToken');

  // 스크롤 하단 고정
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket 연결
  useEffect(() => {

    // 운동방에 없거나, 로그아웃 시 연결 해제
    if (!roomId || !accessToken) {
        if (clientRef.current && clientRef.current.active) {
            clientRef.current.deactivate();
            clientRef.current = null;
        }
        return;
    }

    const fetchChatHistory = async () => {
        const chatHistoryData = await api.getChatHistory(roomId) as ChatMessage[];
        setMessages(chatHistoryData);
    }

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
            fetchChatHistory();

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

  // 메시지 수신 핸들러
  const onMessageReceived = (message: IMessage) => {
    try {
      const body = JSON.parse(message.body);
      setMessages((prev) => [...prev, body]);
    } catch (e) {
      // ignore
    }
  };

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
        <CardTitle>💬채팅방</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 overflow-y-auto bg-slate-50 rounded p-2 mb-2">
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