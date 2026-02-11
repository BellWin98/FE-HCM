import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

interface RestDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restReason: string;
  onRestReasonChange: (value: string) => void;
  restStartDate: Date | undefined;
  onRestStartDateChange: (date: Date | undefined) => void;
  restEndDate: Date | undefined;
  onRestEndDateChange: (date: Date | undefined) => void;
  onSubmit: () => void;
  onClose: () => void;
  isRegisteringRest: boolean;
  error: string;
  today: Date;
}

export const RestDayDialog = ({
  open,
  onOpenChange,
  restReason,
  onRestReasonChange,
  restStartDate,
  onRestStartDateChange,
  restEndDate,
  onRestEndDateChange,
  onSubmit,
  onClose,
  isRegisteringRest,
  error,
  today,
}: RestDayDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>휴식일 등록</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="rest-reason">휴식 사유</Label>
            <Textarea
              id="rest-reason"
              placeholder="휴식 사유를 입력하세요 (예: 부상, 개인사정 등)"
              value={restReason}
              onChange={(e) => onRestReasonChange(e.target.value)}
              disabled={isRegisteringRest}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>시작일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                    disabled={isRegisteringRest}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {restStartDate ? format(restStartDate, 'yyyy-MM-dd', { locale: ko }) : '날짜 선택'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={restStartDate}
                    onSelect={onRestStartDateChange}
                    locale={ko}
                    disabled={(date) => date < today}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500 p-2"></p>
            </div>

            <div>
              <Label>종료일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                    disabled={isRegisteringRest}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {restEndDate ? format(restEndDate, 'yyyy-MM-dd', { locale: ko }) : '날짜 선택'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={restEndDate}
                    onSelect={onRestEndDateChange}
                    locale={ko}
                    disabled={(date) => date < today || date.getDay() !== 0}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500 p-2">종료일은 일요일만 선택</p>
            </div>
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
            <Button
              onClick={onSubmit}
              disabled={isRegisteringRest || !restReason.trim() || !restStartDate || !restEndDate}
            >
              {isRegisteringRest ? '등록 중...' : '등록'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
