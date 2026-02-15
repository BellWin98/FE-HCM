import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, Flame } from 'lucide-react';

interface WorkoutSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalWorkoutDays: number;
  // onNavigate: () => void;
}

export const WorkoutSuccessDialog = ({
  open,
  onOpenChange,
  totalWorkoutDays,
  // onNavigate,
}: WorkoutSuccessDialogProps) => {
  const getWorkoutMessage = (totalWorkoutDays: number) => {
    // 1. 고인물 구간 (100일 이상) - 레전드 인정 + 꾸준함 독려
    if (totalWorkoutDays >= 365)
      return { emoji: '👑', message: '365일 돌파! 당신은 이미 전설이에요. 근데 전설은 오늘도 멈추지 않죠?', color: 'text-yellow-600' };
    if (totalWorkoutDays >= 200)
      return { emoji: '🦾', message: '200일 넘었어요! 운동이 습관이 아니라 본능이 된 사람. 오늘의 나도 어제보다 강해졌어요.', color: 'text-slate-800' };
    if (totalWorkoutDays === 100)
      return { emoji: '💯', message: '100일 달성! 세 자릿수 클럽 입성을 축하해요 🎉 여기까지 온 끈기, 진짜 대단해요.', color: 'text-red-700' };

    // 2. 습관 정착 구간 (30일 ~ 99일) - 성장 실감 + 응원
    if (totalWorkoutDays === 77)
      return { emoji: '🎰', message: '77일! 럭키세븐이 두 번이나! 운이 아니라 실력으로 만든 기록이에요 💪', color: 'text-emerald-600' };
    if (totalWorkoutDays === 66)
      return { emoji: '🧠', message: '66일이면 습관이 완전히 자리잡는 시기래요. 이제 운동은 당신의 일부예요!', color: 'text-indigo-700' };
    if (totalWorkoutDays === 50)
      return { emoji: '🔥', message: '50일 돌파! 반백일의 땀방울이 모여 지금의 당신을 만들었어요. 뒤돌아보면 엄청 멀리 왔죠?', color: 'text-fuchsia-700' };
    if (totalWorkoutDays === 30)
      return { emoji: '📅', message: '한 달 완주! 30일 전의 나에게 자랑해도 돼요. 이 루틴, 절대 놓치지 마세요!', color: 'text-purple-700' };

    // 3. 성장 구간 (10일 ~ 29일) - 변화 감지 + 기대감
    if (totalWorkoutDays === 21)
      return { emoji: '🌱', message: '21일! 습관의 씨앗이 싹을 틔웠어요 🌿 거울 속 표정이 달라지고 있을걸요?', color: 'text-lime-700' };
    if (totalWorkoutDays === 14)
      return { emoji: '🚀', message: '2주 연속 인증! 작심삼일은 이미 옛말이에요. 이 페이스 그대로 가볼까요?', color: 'text-cyan-700' };
    if (totalWorkoutDays === 10)
      return { emoji: '🥉', message: '10일 달성! 두 자릿수 진입이에요 🎊 몸이 슬슬 반응하기 시작하는 타이밍!', color: 'text-blue-700' };

    // 4. 시작 단계 (1일 ~ 9일) - 첫걸음 칭찬 + 내일도 도전
    if (totalWorkoutDays === 7)
      return { emoji: '🌈', message: '일주일 완성! 7일의 기적을 만든 건 바로 당신이에요. 다음 주도 함께 가볼까요?', color: 'text-green-700' };
    if (totalWorkoutDays === 5)
      return { emoji: '🖐️', message: '5일째 인증! 손가락 하나하나가 노력의 증거예요 ✋ 내일이면 벌써 6일!', color: 'text-teal-700' };
    if (totalWorkoutDays === 3)
      return { emoji: '🥚', message: '3일 돌파! 작심삼일? 아니요, 이건 시작이에요. 내일의 나는 더 강해질 거예요!', color: 'text-orange-700' };
    if (totalWorkoutDays === 1)
      return { emoji: '👟', message: '위대한 첫걸음! 시작이 반이래요. 오늘 운동한 나, 진심으로 멋져요 🙌', color: 'text-gray-900' };

    // 5. 그 외 일반적인 날 (따뜻한 자극)
    if (totalWorkoutDays < 10) {
      return { emoji: '🐣', message: '오늘도 해냈어요! 매일 조금씩 성장 중 📈 꾸준함이 최고의 재능이에요.', color: 'text-yellow-700' };
    }

    return { emoji: '💪', message: '오늘도 인증 완료! 어제의 나보다 한 뼘 더 성장한 하루예요. 내일도 화이팅!', color: 'text-slate-700' };
  };




  const workoutMessageInfo = getWorkoutMessage(totalWorkoutDays);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm w-[90vw] p-4">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <DialogTitle className="text-center text-xl">
            운동 인증 완료!
          </DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-3">
            <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
              <Flame className={`h-6 w-6 ${workoutMessageInfo.color}`} />
              <span className={workoutMessageInfo.color}>
                총 {totalWorkoutDays}일 인증했어요!
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {workoutMessageInfo.emoji} {workoutMessageInfo.message}
            </div>            
            <div className="text-xs text-gray-400">
              5초 후 자동으로 대시보드로 이동합니다.
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
