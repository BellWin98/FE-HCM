import { useEffect } from 'react';
import { ensureFcmToken, registerForegroundMessageHandler } from '@/lib/firebase';
import { toast } from '@/components/ui/sonner';
import type { Member } from '@/types';

interface UseFcmOptions {
  /** false이면 토큰 등록/리스너 등록을 하지 않는다(예: 로그인 전, 방 미참여). */
  enabled?: boolean;
  /** 포그라운드 알림에서 본인 발신 여부를 판별하기 위한 현재 사용자. */
  member?: Member | null;
}

/**
 * FCM 토큰 등록과 포그라운드 메시지 처리를 한 곳에서 담당하는 훅.
 * 권한 요청/토큰 발급/서버 등록은 `ensureFcmToken`(중복 방지 처리됨)에 위임하고,
 * 포그라운드 수신 시 같은 운동방 타 유저 알림만 토스트로 표시한다(본인 발신·CHAT은 제외).
 */
export const useFcm = ({ enabled = true, member }: UseFcmOptions = {}): void => {
  const memberId = member?.id;

  useEffect(() => {
    if (!enabled) return;

    void ensureFcmToken();

    void registerForegroundMessageHandler((payload) => {
      const data = (payload as { data?: Record<string, string> } | undefined)?.data;
      if (!data) return;

      const senderId = data.senderId;
      const isFromMe = senderId != null && memberId != null && String(memberId) === senderId;
      const isChatNotification = data.type === 'CHAT';
      if (isFromMe || isChatNotification) return;

      const title = data.title ?? '알림';
      const body = data.body;
      toast(title, {
        description: body ?? undefined,
        duration: 2000,
      });
    });
  }, [enabled, memberId]);
};
