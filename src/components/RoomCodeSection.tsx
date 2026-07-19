import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useKakaoShare } from '@/hooks/useKakaoShare';
import { buildRoomInviteUrl } from '@/lib/kakao';

interface RoomCodeSectionProps {
  roomName: string;
  entryCode: string;
  isOwner: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export const RoomCodeSection = ({
  roomName,
  entryCode,
  isOwner,
  onRegenerate,
  isRegenerating = false,
}: RoomCodeSectionProps) => {
  const { share: shareToKakao, isSharing, isAvailable: isKakaoAvailable } = useKakaoShare();

  const handleCopy = async () => {
    if (!entryCode) return;
    try {
      await navigator.clipboard.writeText(entryCode);
      toast('운동방 코드가 복사되었습니다.');
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleCopyInviteLink = async () => {
    if (!entryCode) return;
    try {
      await navigator.clipboard.writeText(buildRoomInviteUrl(entryCode));
      toast('초대 링크가 복사되었습니다.');
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleKakaoShare = () => {
    if (!entryCode) return;
    shareToKakao({ roomName, entryCode });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center flex-wrap">
        <Input
          value={entryCode || '로딩 중...'}
          readOnly
          className="max-w-[200px] font-mono bg-muted"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          disabled={!entryCode}
          title="복사"
        >
          <Copy className="h-4 w-4" />
        </Button>
        {isKakaoAvailable ? (
          <Button
            type="button"
            variant="outline"
            className="bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] border-[#FEE500]"
            onClick={handleKakaoShare}
            disabled={!entryCode || isSharing}
          >
            카카오톡으로 초대
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyInviteLink}
            disabled={!entryCode}
            title="초대 링크 복사"
          >
            <LinkIcon className="h-4 w-4 mr-1" />
            초대 링크 복사
          </Button>
        )}
        {isOwner && onRegenerate && (
          <Button
            type="button"
            variant="outline"
            onClick={onRegenerate}
            disabled={isRegenerating || !entryCode}
            title="코드 변경"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
            코드 변경
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        다른 사람들과 공유할 입장 코드입니다. 복사하거나 초대 링크로 공유하세요.
      </p>
    </div>
  );
};
