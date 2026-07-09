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
import { useState } from 'react';

const SERVICE_URL = 'https://www.bellwin.co.kr';

const loadImageFromFile = (file: File) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('이미지를 불러오지 못했어요.'));
    };
    image.src = imageUrl;
  });
};

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number
) => {
  const imageRatio = image.width / image.height;
  const canvasRatio = width / height;
  const drawWidth = imageRatio > canvasRatio ? height * imageRatio : width;
  const drawHeight = imageRatio > canvasRatio ? height : width / imageRatio;
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
};

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const drawWrappedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);

  lines.slice(0, maxLines).forEach((line, index) => {
    const lineText = index === maxLines - 1 && lines.length > maxLines ? `${line}...` : line;
    context.fillText(lineText, x, y + index * lineHeight);
  });
};

const createWorkoutShareImage = async ({
  workoutImage,
  workoutDate,
  workoutTypeText,
  workoutDurationText,
}: {
  workoutImage: File;
  workoutDate: string;
  workoutTypeText: string;
  workoutDurationText: string;
}) => {
  const canvas = document.createElement('canvas');
  // 1. 캔버스 비율 9:16 (인스타그램 스토리 최적화)
  const width = 1440;
  const height = 1440; 
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('공유 이미지를 만들 수 없어요.');
  }

  // 2. 원본 사진 렌더링
  const image = await loadImageFromFile(workoutImage);
  drawCoverImage(context, image, width, height);

  // 3. 사진 배경을 살짝 어둡게 (글자 가독성 확보)
  context.fillStyle = 'rgba(0, 0, 0, 0.15)';
  context.fillRect(0, 0, width, height);

  // 4. 우측 상단 카드 배치 계산 (기존 대비 절반 크기)
  const cardWidth = 500; // 기존 920의 절반
  const cardHeight = 250; // 기존 420의 약 절반
  const cardRadius = 24; // 기존 48의 절반
  const marginX = 60; // 우측 여백
  const marginY = 80; // 상단 여백
  
  const cardX = width - cardWidth - marginX; // 우측 정렬 위치
  const cardY = marginY;

  // 5. 흰색 카드 배경 + 그림자 적용
  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.2)';
  context.shadowBlur = 20; // 그림자도 절반으로
  context.shadowOffsetY = 8;
  context.fillStyle = 'rgba(255, 255, 255, 0.96)';
  drawRoundedRect(context, cardX, cardY, cardWidth, cardHeight, cardRadius); 
  context.fill();
  context.restore(); // 텍스트에 그림자 들어가지 않게 리셋

  // 6. 카드 내부 텍스트 렌더링 (Padding 40px)
  const pad = 40;
  const startX = cardX + pad; // 텍스트 시작 X 좌표
  const endX = cardX + cardWidth - pad; // 우측 정렬을 위한 끝 X 좌표
  const innerWidth = cardWidth - pad * 2;

  // [상태 뱃지 : HCM (파란색)]
  context.fillStyle = '#2563EB'; // Tailwind blue-600
  context.font = '800 25px Pretendard, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText('HCM', startX, cardY + 36);

  // [서비스 URL : 카드 내 우측 상단 (검정색)]
  context.fillStyle = '#111827'; // Tailwind gray-900 (검정색)
  context.font = '600 25px Pretendard, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  context.textAlign = 'right';
  context.fillText('www.bellwin.co.kr', endX, cardY + 36);
  context.textAlign = 'left'; // 캔버스 정렬 상태 원상 복구

  // [날짜 타이틀]
  context.fillStyle = '#111827';
  context.font = '800 30px Pretendard, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText(workoutDate, startX, cardY + 84);

  // [가로 구분선]
  context.beginPath();
  context.moveTo(startX, cardY + 114);
  context.lineTo(endX, cardY + 114);
  context.strokeStyle = '#E5E7EB';
  context.lineWidth = 1;
  context.stroke();

  // [상세 정보 레이블 및 데이터]
  const labelY1 = cardY + 154;
  const labelY2 = cardY + 188;
  const valueOffsetX = 84; // '운동 종류' 라벨과 데이터 사이 간격

  // 라벨 (회색)
  context.fillStyle = '#6B7280';
  context.font = '600 24px Pretendard, system-ui, -apple-system, sans-serif';
  context.fillText('운동 종류', startX, labelY1);
  context.fillText('운동 시간', startX, labelY2);

  // 데이터 (검은색) - 텍스트 넘침 방지를 위한 maxWidth 280 적용
  context.fillStyle = '#1F2937';
  context.font = '700 24px Pretendard, system-ui, -apple-system, sans-serif';
  context.fillText(workoutTypeText, startX + valueOffsetX, labelY1, 280);
  context.fillText(workoutDurationText, startX + valueOffsetX, labelY2, 280);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error('공유 이미지 저장에 실패했어요.'));
      }
    }, 'image/png');
  });

  return new File([blob], 'bellwin-workout-share.png', { type: 'image/png' });
};

interface WorkoutSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalWorkoutDays: number;
  remainingWeeklyWorkouts: number | null;
  workoutImage?: File | null;
  workoutDate: string;
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
  workoutDate,
  workoutTypes,
  workoutDuration,
  onConfirm,
}: WorkoutSuccessDialogProps) => {
  const [sharingPlatform, setSharingPlatform] = useState<string | null>(null);
  const weeklyWorkoutMessage =
    remainingWeeklyWorkouts === null
      ? '이번 주 남은 운동 횟수를 불러오지 못했어요.'
      : remainingWeeklyWorkouts === 0
        ? '이번 주 운동 횟수를 모두 채웠어요!'
        : `이번 주 남은 운동 ${remainingWeeklyWorkouts}회`;
  const workoutTypeText = workoutTypes.length > 0 ? workoutTypes.join(', ') : '미입력';
  const workoutDurationText = workoutDuration ? `${workoutDuration}분` : '미입력';
  const shareText = [
    '운동 인증 완료!',
    `운동 날짜: ${workoutDate}`,
    `운동 종류: ${workoutTypeText}`,
    `운동 시간: ${workoutDurationText}`,
    `총 ${totalWorkoutDays}회 인증했어요.`,
    weeklyWorkoutMessage,
    '#운동인증 #HCM',
  ].join('\n');
  const shareData: ShareData = {
    title: '운동 인증 완료!',
    text: shareText,
    url: SERVICE_URL,
  };

  const copyShareText = async (platform?: string) => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${SERVICE_URL}`);
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

    try {
      let capturedImage: File | null = null;

      if (workoutImage) {
        capturedImage = await createWorkoutShareImage({
          workoutImage,
          workoutDate,
          workoutTypeText,
          workoutDurationText,
        });
      }

      const canShareCapturedImage =
        capturedImage && navigator.canShare?.({ files: [capturedImage] });
      const nativeShareData: ShareData = canShareCapturedImage
        ? { ...shareData, files: [capturedImage] }
        : shareData;

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
    setSharingPlatform('카카오톡');
    try {
      const didOpenShare = await openNativeShare('카카오톡');
      if (!didOpenShare) {
        await copyShareText('카카오톡');
      }
    } finally {
      setSharingPlatform(null);
    }
  };

  const handleInstagramShare = async () => {
    setSharingPlatform('인스타그램');
    try {
      const didOpenShare = await openNativeShare('인스타그램');
      if (didOpenShare) return;

      await copyShareText('인스타그램');
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    } finally {
      setSharingPlatform(null);
    }
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
                <span className="font-medium text-foreground">운동 날짜</span> {workoutDate}
              </div>
              <div>
                <span className="font-medium text-foreground">운동 종류</span> {workoutTypeText}
              </div>
              <div>
                <span className="font-medium text-foreground">운동 시간</span> {workoutDurationText}
              </div>
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
              disabled={sharingPlatform !== null}
            >
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              {sharingPlatform === '카카오톡' ? '생성 중' : '카톡 공유'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700"
              onClick={handleInstagramShare}
              disabled={sharingPlatform !== null}
            >
              <Instagram className="mr-2 h-4 w-4" aria-hidden="true" />
              {sharingPlatform === '인스타그램' ? '생성 중' : '인스타 공유'}
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