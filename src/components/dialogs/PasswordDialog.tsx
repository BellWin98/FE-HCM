import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isJoining: boolean;
  error: string;
}

export const PasswordDialog = ({
  open,
  onOpenChange,
  password,
  onPasswordChange,
  onSubmit,
  onClose,
  isJoining,
  error,
}: PasswordDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>운동방 참여</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="방 비밀번호를 입력하세요"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              minLength={2}
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
            <Button onClick={onSubmit} disabled={isJoining || !password.trim()}>
              {isJoining ? '참여 중...' : '참여하기'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
