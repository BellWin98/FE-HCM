import { Button } from '@/components/ui/button';
import { useHeroReveal } from '@/hooks/useHeroReveal';
import { BarChart3 } from 'lucide-react';
import { FeatureMedia } from './FeatureMedia';
import { HeroRevealItem } from './HeroRevealItem';
import { HERO_REVEAL_STAGGER } from './constants';

type HeroSectionProps = {
  navigate: (path: string) => void;
};

export const HeroSection = ({ navigate }: HeroSectionProps) => {
  const revealed = useHeroReveal();

  return (
    <section className="container mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_minmax(0,1fr)] lg:gap-14">
        <div className="flex flex-col">
          <HeroRevealItem delay={HERO_REVEAL_STAGGER} revealed={revealed}>
            <h1 className="mb-6 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl sm:leading-tight lg:text-6xl">
              헬창마을은 <br /><br />벌금 관리형
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                운동 인증 플랫폼입니다.
              </span>
              <br />
            </h1>
          </HeroRevealItem>
          <HeroRevealItem delay={HERO_REVEAL_STAGGER * 2} revealed={revealed}>
            <p className="mb-10 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              벌금 관리는 신경쓰지 마세요 <br /> 운동에만 집중할 수 있게 도와드릴게요
            </p>
          </HeroRevealItem>
          <HeroRevealItem delay={HERO_REVEAL_STAGGER * 3} revealed={revealed}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/login')}
                className="rounded-full bg-indigo-600 px-10 py-6 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-transform duration-150 hover:scale-[1.02] hover:bg-indigo-700 sm:text-lg"
                aria-label="헬창마을 무료로 시작하고 운동방 만들기"
              >
                운동 인증 하러가기
              </Button>
              <div className="text-center text-xs leading-relaxed text-slate-500 sm:text-sm">
                <p>간편 로그인으로 누구나 1초 만에 가입할 수 있어요.</p>
              </div>
            </div>
          </HeroRevealItem>
        </div>

        <HeroRevealItem delay={HERO_REVEAL_STAGGER * 4} revealed={revealed}>
          <div className="relative">
            <div className="pointer-events-none absolute -inset-x-6 -top-6 -bottom-10 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-amber-500/10 blur-3xl" />
            <div className="relative rounded-3xl border border-slate-200/80 bg-white/80 p-3 shadow-lg shadow-slate-900/5 backdrop-blur">
              <FeatureMedia
                src="/images/demo/main.gif"
                alt="헬창마을 서비스 데모 화면"
                icon={BarChart3}
                placeholderBg="bg-gradient-to-br from-indigo-500 to-violet-600"
                aspectRatio="9/16"
              />
            </div>
          </div>
        </HeroRevealItem>
      </div>
    </section>
  );
};
