import { Client } from '@stomp/stompjs';
import { useRef } from 'react';

// 스트릭 마일스톤 정의 (알림을 보낼 스트릭 일수)
const STREAK_MILESTONES = [3, 7, 10, 30, 50, 100];

/**
 * 스트릭이 마일스톤에 해당하는지 확인
 */
export const isStreakMilestone = (streak: number): boolean => {
  return STREAK_MILESTONES.includes(streak);
};

/**
 * 스트릭에 따른 축하 메시지 생성
 */
export const getStreakCelebrationMessage = (nickname: string, streak: number): string => {
  const messages: Record<number, string> = {
    3: `${nickname}님이 3일 연속 운동을 인증했어요! 🌟 운동 습관이 자리 잡는 중이에요!`,
    7: `${nickname}님이 일주일 연속 운동을 달성했어요! 🎉 훌륭해요!`,
    10: `${nickname}님이 10일 연속 운동을 완료했어요! 💪 대단해요!`,
    30: `${nickname}님이 한 달 연속 운동을 인증했어요! 🔥 운동이 일상이 되었네요!`,
    50: `${nickname}님이 50일 연속 운동을 달성했어요! 😉 이제 그만두기엔 너무 멀리 왔어요!`,
    100: `${nickname}님이 100일 연속 운동을 완수했어요! 💯 그 어떤 목표보다 값지네요! 🙌`,
  };

  return messages[streak] || `${nickname}님이 ${streak}일 연속 운동을 인증했어요! 🎊`;
};

/**
 * 채팅방에 스트릭 달성 알림 전송
 */
export const sendStreakNotification = (
  client: Client | null,
  roomId: number,
  nickname: string,
  streak: number,
  accessToken: string
): void => {
  if (!client?.connected) {
    console.warn('WebSocket is not connected. Cannot send streak notification.');
    return;
  }

  if (!isStreakMilestone(streak)) {
    // 마일스톤이 아니면 알림을 보내지 않음
    return;
  }

  const message = getStreakCelebrationMessage(nickname, streak);

  const msg = {
    type: 'TEXT',
    content: message,
  };

  try {
    client.publish({
      destination: `/app/chat/room/${roomId}/send`,
      body: JSON.stringify(msg),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
    });
    console.log(`Streak notification sent: ${message}`);
  } catch (error) {
    console.error('Failed to send streak notification:', error);
  }
};
