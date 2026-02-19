import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface RoomCodeSectionProps {
  entryCode: string;
  isOwner: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export const RoomCodeSection = ({
  entryCode,
  isOwner,
  onRegenerate,
  isRegenerating = false,
}: RoomCodeSectionProps) => {
  const handleCopy = async () => {
    if (!entryCode) return;
    try {
      await navigator.clipboard.writeText(entryCode);
      toast('운동방 코드가 복사되었습니다.');
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-2">
      <Label>운동방 코드</Label>
      <div className="flex gap-2 items-center">
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
        {isOwner
          ? '친구들에게 공유할 입장 코드입니다. 코드 변경 시 이전 코드는 사용할 수 없습니다.'
          : '친구들과 공유할 입장 코드입니다. 복사하여 공유하세요.'}
      </p>
    </div>
  );
};
