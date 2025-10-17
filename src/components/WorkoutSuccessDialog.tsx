import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Flame } from 'lucide-react';

interface WorkoutSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStreak: number;
  onNavigate: () => void;
}

export const WorkoutSuccessDialog = ({
  open,
  onOpenChange,
  currentStreak,
  onNavigate,
}: WorkoutSuccessDialogProps) => {
  const getStreakMessage = (streak: number) => {
    if (streak == 100) return { emoji: '💯', message: '100일간의 꾸준함, 그 어떤 목표보다 값집니다 🙌', color: 'text-red-600' };
    if (streak == 50) return { emoji: '😉', message: '50일 달성! 이제 그만두기엔 너무 멀리 왔어요!', color: 'text-fuchsia-600' };
    if (streak == 30) return { emoji: '🔥', message: '한 달 연속 인증! 운동이 자연스러운 일상이 되었네요!', color: 'text-purple-600' };
    if (streak == 10) return { emoji: '💪', message: '대단해요! 10일 동안 스스로를 이겼어요!', color: 'text-blue-600' };
    if (streak == 7) return { emoji: '🎉', message: '훌륭해요! 일주일 연속 달성!', color: 'text-green-600' };
    if (streak == 3) return { emoji: '🌟', message: '운동 습관이 자리 잡는 중이에요!', color: 'text-orange-600' };
    return { emoji: '✨', message: '어제보다 더 건강해졌어요! 계속 가볼까요?', color: 'text-gray-600' };
  };

  const streakInfo = getStreakMessage(currentStreak);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <DialogTitle className="text-center text-2xl">
            운동 인증 완료!
          </DialogTitle>
          <DialogDescription className="text-center space-y-4 pt-4">
            <div className="flex items-center justify-center space-x-2 text-3xl font-bold">
              <Flame className={`h-8 w-8 ${streakInfo.color}`} />
              <span className={streakInfo.color}>
                {currentStreak}일 연속
              </span>
            </div>
            <div className="text-lg font-medium text-gray-700">
              운동을 인증했어요!
            </div>
            <div className="text-base text-gray-600">
              {streakInfo.emoji} {streakInfo.message}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-2 pt-4">
          <Button onClick={onNavigate} size="lg" className="w-full">
            대시보드로 이동
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            size="lg"
            className="w-full"
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
