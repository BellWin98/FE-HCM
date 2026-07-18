import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { getEarliestPenaltyEffectiveMonday } from '@/lib/workoutRoomRules';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

interface PenaltyScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  penaltyEnabled: boolean;
  pendingPenaltyEnabled?: boolean | null;
  pendingPenaltyPerMiss?: number | null;
  penaltyChangeEffectiveDate?: string | null;
  targetEnabled: boolean;
  onTargetEnabledChange: (enabled: boolean) => void;
  penaltyPerMiss: string;
  onPenaltyPerMissChange: (value: string) => void;
  effectiveDate: Date | undefined;
  onEffectiveDateChange: (date: Date | undefined) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  error: string;
  today: Date;
}

export const PenaltyScheduleDialog = ({
  open,
  onOpenChange,
  penaltyEnabled,
  pendingPenaltyEnabled,
  pendingPenaltyPerMiss,
  penaltyChangeEffectiveDate,
  targetEnabled,
  onTargetEnabledChange,
  penaltyPerMiss,
  onPenaltyPerMissChange,
  effectiveDate,
  onEffectiveDateChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  today,
}: PenaltyScheduleDialogProps) => {
  const earliestMonday = getEarliestPenaltyEffectiveMonday(today);
  const hasPendingChange = pendingPenaltyEnabled !== null && pendingPenaltyEnabled !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>운영 방식 바꾸기</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            현재 이 운동방은 {penaltyEnabled ? '벌금제로 운영되고 있어요.' : '벌금없이 운영되고 있어요.'}
          </p>

          {hasPendingChange && (
            <Alert>
              <AlertDescription>
                {penaltyChangeEffectiveDate} 부터 벌금이{' '}
                {pendingPenaltyEnabled ? `부과돼요.(회당 ${pendingPenaltyPerMiss?.toLocaleString()}원)` : '부과되지 않아요'}
                <br /><br />
                아래에서 새로 예약 시 기존 예약은 무시됩니다.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="target-penalty-enabled">벌금제 사용 여부</Label>
              <p className="text-xs text-gray-500">{targetEnabled ? '사용' : '미사용 (벌금 없이 운동방 운영)'}</p>
            </div>
            <Switch id="target-penalty-enabled" checked={targetEnabled} onCheckedChange={onTargetEnabledChange} />
          </div>

          {targetEnabled && (
            <div>
              <Label htmlFor="schedule-penalty-amount">1회 누락당 벌금 (원)</Label>
              <Input
                id="schedule-penalty-amount"
                type="number"
                min="1000"
                max="50000"
                step="1000"
                value={penaltyPerMiss}
                onChange={(e) => onPenaltyPerMissChange(e.target.value)}
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label>전환 예정일</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal mt-1"
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {effectiveDate ? format(effectiveDate, 'yyyy-MM-dd', { locale: ko }) : '날짜 선택'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={effectiveDate}
                  onSelect={onEffectiveDateChange}
                  locale={ko}
                  disabled={(date) => date.getDay() !== 1 || date < earliestMonday}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-gray-500 p-2">
              월요일만 선택 가능하며, 오늘로부터 최소 7일 이후여야 합니다. 
              <br />(가장 빠른 날짜:{' '}
              {format(earliestMonday, 'yyyy-MM-dd', { locale: ko })})
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting || !effectiveDate}>
              {isSubmitting ? '예약 중...' : '예약'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
