import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface RoomCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomCode: string;
  onRoomCodeChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isJoining: boolean;
  error: string;
}

export const RoomCodeDialog = ({
  open,
  onOpenChange,
  roomCode,
  onRoomCodeChange,
  onSubmit,
  onClose,
  isJoining,
  error,
}: RoomCodeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>운동방 참여</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              placeholder="운동방 코드를 입력하세요"
              value={roomCode}
              onChange={(e) => onRoomCodeChange(e.target.value)}
              minLength={6}
              maxLength={10}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              disabled={isJoining}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={onSubmit} disabled={isJoining || !roomCode.trim()}>
              {isJoining ? '참여 중...' : '참여하기'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
