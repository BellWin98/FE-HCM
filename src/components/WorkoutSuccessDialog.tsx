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
    // 1. 고인물 구간 (100일 이상) - 인정은 하지만 방심은 금물
    if (totalWorkoutDays >= 365) return { emoji: '👑', message: '1년? 독종이네. 근데 오늘 운동 대충 하면 근육 다 빠지는 거 알지?', color: 'text-yellow-600' };
    if (totalWorkoutDays >= 200) return { emoji: '🦾', message: '이제 운동 안 하면 몸이 쓰레기 된 기분이지? 축하해, 중독이야.', color: 'text-slate-800' };
    if (totalWorkoutDays === 100) return { emoji: '💯', message: '100일? 이제야 사람 몸 같네. 치킨 생각하지 마. 바로 복근 찢어.', color: 'text-red-700' };

    // 2. 습관 정착 구간 (30일 ~ 99일) - 팩트 폭격
    if (totalWorkoutDays === 77) return { emoji: '🎰', message: '77일? 운으로 온 거 아니지? 거울 봐, 아직 멀었어. 더 당겨!', color: 'text-emerald-600' };
    if (totalWorkoutDays === 66) return { emoji: '🧠', message: '66일 지났어. 이제 안 나오면 네 의지가 썩은 거야. 정신 차려!', color: 'text-indigo-700' };
    if (totalWorkoutDays === 50) return { emoji: '🔥', message: '딱 절반 왔어. 여기서 포기하면 여태 흘린 땀 다 하수구에 버리는 거야.', color: 'text-fuchsia-700' };
    if (totalWorkoutDays === 30) return { emoji: '📅', message: '한 달 버텼네? 근데 뱃살은 그대로잖아? 식단 몰래 뭐 처먹었어?', color: 'text-purple-700' };

    // 3. 성장 구간 (10일 ~ 29일) - 자존심 긁기
    if (totalWorkoutDays === 21) return { emoji: '🌱', message: '21일 지났다고 긴장 풀었어? 회원님, 몸매가 아주 푸딩이세요.', color: 'text-lime-700' };
    if (totalWorkoutDays === 14) return { emoji: '🚀', message: '2주 했어? 작심삼일 5번 한 셈 치고 내일 안 튀어오면 죽는다.', color: 'text-cyan-700' };
    if (totalWorkoutDays === 10) return { emoji: '🥉', message: '겨우 10일? 아직 헬린이 티도 못 벗었어. 무게 더 쳐! 엄살 부리지 말고.', color: 'text-blue-700' };

    // 4. 시작 단계 (1일 ~ 9일) - 강력한 압박과 도발
    if (totalWorkoutDays === 7) return { emoji: '🌈', message: '일주일? 나쁘지 않아. 근데 어제 야식 먹은 건 다 태우고 가는 거지?', color: 'text-green-700' };
    if (totalWorkoutDays === 5) return { emoji: '🖐️', message: '평일 5일 출석? 오... 의지박약은 탈출했네? 내일도 지켜본다.', color: 'text-teal-700' };
    if (totalWorkoutDays === 3) return { emoji: '🥚', message: '작심삼일 넘겼네? 내일 안 오면 도로아미타불이야. 돼지로 살기 싫으면 나와.', color: 'text-orange-700' };
    if (totalWorkoutDays === 1) return { emoji: '👟', message: '첫날이야? 힘들다고 징징대지 마. 네 몸뚱이를 봐, 쉴 때가 아니야.', color: 'text-gray-900' };

    // 5. 그 외 일반적인 날 (랜덤 자극)
    if (totalWorkoutDays < 10) {
        return { emoji: '🐣', message: '집에 가고 싶어? 몸매가 그대론데 양심이 있어? 한 세트 더 해!', color: 'text-yellow-700' };
    }

    return { emoji: '💪', message: '한 개만 더! 그거 못 들면 근손실 온다? 악으로 깡으로 들어!', color: 'text-slate-700' };
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
