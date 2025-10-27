import { Client } from '@stomp/stompjs';
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

/**
 * WebSocket 연결을 관리하는 커스텀 훅
 * ChatRoom 컴포넌트 외부에서도 WebSocket 클라이언트에 접근할 수 있도록 함
 */
export const useWebSocket = (roomId: number | null, accessToken: string | null) => {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 운동방에 없거나, 로그아웃 시 연결 해제
    if (!roomId || !accessToken) {
      if (clientRef.current && clientRef.current.active) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      setIsConnected(false);
      return;
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
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
      },
      onStompError: (frame) => {
        setIsConnected(false);
        console.error('WebSocket error:', frame.headers['message']);
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

  return {
    client: clientRef.current,
    isConnected,
  };
};
