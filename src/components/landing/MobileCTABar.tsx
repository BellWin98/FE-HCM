import { Button } from '@/components/ui/button';
import { useHeroReveal } from '@/hooks/useHeroReveal';
import { HeroRevealItem } from './HeroRevealItem';
import { HERO_REVEAL_STAGGER } from './constants';

type MobileCTABarProps = {
  onNavigate: (path: string) => void;
};

/** 모바일 고정 CTA - 마운트 시 HeroRevealItem 스태거 */
export const MobileCTABar = ({ onNavigate }: MobileCTABarProps) => {
  const revealed = useHeroReveal();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <HeroRevealItem delay={0} revealed={revealed}>
          <div className="text-xs leading-snug text-slate-600">
            <p className="font-semibold text-slate-900">지금 바로 운동 인증하러 가볼까요?</p>
            <p>간편 로그인으로 1초 만에 가입해보세요!</p>
          </div>
        </HeroRevealItem>
        <HeroRevealItem delay={HERO_REVEAL_STAGGER} revealed={revealed}>
          <Button
            size="sm"
            className="min-w-[110px] rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700"
            onClick={() => onNavigate('/login')}
            aria-label="헬창마을 시작하기"
          >
            GO! GO!
          </Button>
        </HeroRevealItem>
      </div>
    </div>
  );
};
