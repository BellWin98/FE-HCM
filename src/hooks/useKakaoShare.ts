import { useState } from 'react';
import { isKakaoShareAvailable, shareRoomInvite } from '@/lib/kakao';
import { toast } from '@/components/ui/sonner';

interface ShareRoomInviteParams {
  roomName: string;
  entryCode: string;
}

export const useKakaoShare = () => {
  const [isSharing, setIsSharing] = useState(false);

  const share = async (params: ShareRoomInviteParams): Promise<void> => {
    setIsSharing(true);
    try {
      await shareRoomInvite(params);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '카카오톡 공유에 실패했습니다.');
    } finally {
      setIsSharing(false);
    }
  };

  return { share, isSharing, isAvailable: isKakaoShareAvailable() };
};
