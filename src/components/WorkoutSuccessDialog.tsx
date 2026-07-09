import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Flame } from 'lucide-react';

interface WorkoutSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalWorkoutDays: number;
  remainingWeeklyWorkouts: number | null;
  onConfirm: () => void;
}

export const WorkoutSuccessDialog = ({
  open,
  onOpenChange,
  totalWorkoutDays,
  remainingWeeklyWorkouts,
  onConfirm,
}: WorkoutSuccessDialogProps) => {
  const weeklyWorkoutMessage =
    remainingWeeklyWorkouts === null
      ? '이번 주 남은 운동 횟수를 불러오지 못했어요.'
      : remainingWeeklyWorkouts === 0
        ? '이번 주 운동 횟수를 모두 채웠어요!'
        : `이번 주 남은 운동 ${remainingWeeklyWorkouts}회`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xs sm:max-w-sm w-[90vw] p-4 [&>button]:hidden"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <DialogTitle className="text-center text-xl">
            운동 인증 완료!
          </DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-3">
            <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
              <Flame className="h-6 w-6 text-orange-600" />
              <span className="text-orange-600">
                총 {totalWorkoutDays}회 인증했어요
              </span>
            </div>
            <div
              className={`text-sm font-bold ${
                remainingWeeklyWorkouts === 0 ? 'text-green-600' : 'text-blue-600'
              }`}
            >
              {weeklyWorkoutMessage}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" className="w-full" onClick={onConfirm}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
