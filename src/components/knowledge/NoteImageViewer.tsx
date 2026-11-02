import { useCallback, useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';

interface NoteImageViewerProps {
  images: string[];
  startIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const iconButtonClass =
  'absolute z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30';

const NoteImageViewer = ({ images, startIndex, open, onOpenChange }: NoteImageViewerProps) => {
  const [index, setIndex] = useState<number>(startIndex);
  const [api, setApi] = useState<CarouselApi>();
  const pushedRef = useRef(false);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const lastIndex = images.length - 1;

  // 열릴 때마다 시작 위치로 맞춘다.
  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  // 임베라 캐러셀을 현재 인덱스에 맞춘다(스와이프로 바뀐 경우는 아래 select 이벤트가 반영).
  useEffect(() => {
    if (!api || !open) return;
    if (api.selectedScrollSnap() !== index && api.scrollSnapList().length > index) {
      api.scrollTo(index, true);
    }
  }, [api, open, index]);

  useEffect(() => {
    if (!api) return;
    const handleSelect = (): void => {
      if (api.scrollSnapList().length === 0) return;
      setIndex(api.selectedScrollSnap());
    };
    api.on('select', handleSelect);
    return () => {
      api.off('select', handleSelect);
    };
  }, [api]);

  // 열림 동안 history 항목 하나를 쌓아 두고, 뒤로 가기(popstate)로 닫히게 한다.
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ noteImageViewer: true }, '');
    pushedRef.current = true;

    const handlePopState = (): void => {
      pushedRef.current = false;
      onOpenChangeRef.current(false);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // 버튼/Esc로 닫혀 쌓아 둔 항목이 남아 있으면 정확히 한 번 소비한다.
      if (pushedRef.current) {
        pushedRef.current = false;
        window.history.back();
      }
    };
  }, [open]);

  const handlePrev = useCallback((): void => {
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  const handleNext = useCallback((): void => {
    setIndex((current) => Math.min(lastIndex, current + 1));
  }, [lastIndex]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.defaultPrevented) return; // 캐러셀이 이미 처리함
    if (event.key === 'ArrowRight') handleNext();
    else if (event.key === 'ArrowLeft') handlePrev();
  };

  if (images.length === 0) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          onKeyDown={handleKeyDown}
          aria-describedby={undefined}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black focus:outline-none"
        >
          <DialogPrimitive.Title className="sr-only">메모 이미지 보기</DialogPrimitive.Title>
          <DialogPrimitive.Close aria-label="닫기" className={`${iconButtonClass} right-3 top-3`}>
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 text-sm font-medium text-white">
            {index + 1}/{images.length}
          </div>

          <Carousel setApi={setApi} opts={{ startIndex }} className="h-full w-full [&>div]:h-full">
            <CarouselContent className="ml-0 h-full">
              {images.map((src, i) => (
                <CarouselItem key={`${src}-${i}`} className="flex h-full items-center justify-center pl-0">
                  <img src={src} alt={`이미지 ${i + 1}/${images.length}`} className="max-h-full max-w-full object-contain" />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <button
            type="button"
            aria-label="이전 이미지"
            onClick={handlePrev}
            disabled={index === 0}
            className={`${iconButtonClass} left-3 top-1/2 -translate-y-1/2`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="다음 이미지"
            onClick={handleNext}
            disabled={index === lastIndex}
            className={`${iconButtonClass} right-3 top-1/2 -translate-y-1/2`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default NoteImageViewer;
