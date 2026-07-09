import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { CheckCircle2, Copy, Flame, Instagram, MessageCircle } from 'lucide-react';

interface WorkoutSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalWorkoutDays: number;
  remainingWeeklyWorkouts: number | null;
  workoutImage?: File | null;
  workoutTypes: string[];
  workoutDuration: number | null;
  onConfirm: () => void;
}

export const WorkoutSuccessDialog = ({
  open,
  onOpenChange,
  totalWorkoutDays,
  remainingWeeklyWorkouts,
  workoutImage,
  workoutTypes,
  workoutDuration,
  onConfirm,
}: WorkoutSuccessDialogProps) => {
  const weeklyWorkoutMessage =
    remainingWeeklyWorkouts === null
      ? '이번 주 남은 운동 횟수를 불러오지 못했어요.'
      : remainingWeeklyWorkouts === 0
        ? '이번 주 운동 횟수를 모두 채웠어요!'
        : `이번 주 남은 운동 ${remainingWeeklyWorkouts}회`;
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const workoutTypeText = workoutTypes.length > 0 ? workoutTypes.join(', ') : '미입력';
  const workoutDurationText = workoutDuration ? `${workoutDuration}분` : '미입력';
  const shareText = [
    '운동 인증 완료!',
    `운동 종류: ${workoutTypeText}`,
    `운동 시간: ${workoutDurationText}`,
    `총 ${totalWorkoutDays}회 인증했어요.`,
    weeklyWorkoutMessage,
    '#운동인증 #HCM',
  ].join('\n');
  const shareData: ShareData = {
    title: '운동 인증 완료!',
    text: shareText,
    url: shareUrl,
  };

  const copyShareText = async (platform?: string) => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success(
        platform
          ? `${platform}에 붙여넣을 인증 문구를 복사했어요.`
          : '인증 문구를 복사했어요.'
      );
    } catch {
      toast.error('인증 문구 복사에 실패했어요.');
    }
  };

  const openNativeShare = async (platform: string) => {
    if (!navigator.share) return false;

    const canShareWorkoutImage =
      workoutImage && navigator.canShare?.({ files: [workoutImage] });
    const nativeShareData: ShareData = canShareWorkoutImage
      ? { ...shareData, files: [workoutImage] }
      : shareData;

    try {
      await navigator.share(nativeShareData);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return true;
      }

      toast.error(`${platform} 공유를 열지 못했어요.`);
      return false;
    }
  };

  const handleKakaoShare = async () => {
    const didOpenShare = await openNativeShare('카카오톡');
    if (!didOpenShare) {
      await copyShareText('카카오톡');
    }
  };

  const handleInstagramShare = async () => {
    const didOpenShare = await openNativeShare('인스타그램');
    if (didOpenShare) return;

    await copyShareText('인스타그램');
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  };

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
            <div className="space-y-1 rounded-md border bg-muted/40 px-3 py-2 text-left text-xs leading-relaxed text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">운동 종류</span> {workoutTypeText}
              </div>
              <div>
                <span className="font-medium text-foreground">운동 시간</span> {workoutDurationText}
              </div>
              {workoutImage ? (
                <div>
                  <span className="font-medium text-foreground">공유 사진</span> 첫 번째 인증 사진
                </div>
              ) : null}
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              SNS에 운동 인증을 공유해보세요.
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 border-[#FEE500] bg-[#FEE500] text-[#191919] hover:bg-[#F4DC00] hover:text-[#191919]"
              onClick={handleKakaoShare}
            >
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              카톡 공유
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700"
              onClick={handleInstagramShare}
            >
              <Instagram className="mr-2 h-4 w-4" aria-hidden="true" />
              인스타 공유
            </Button>
          </div>
          <Button type="button" variant="ghost" className="h-9 w-full text-xs" onClick={() => copyShareText()}>
            <Copy className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            인증 문구 복사
          </Button>
        </div>
        <DialogFooter className="sm:space-x-0">
          <Button type="button" className="w-full" onClick={onConfirm}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
