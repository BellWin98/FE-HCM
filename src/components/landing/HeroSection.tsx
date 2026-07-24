import { Button } from '@/components/ui/button';
import { useHeroReveal } from '@/hooks/useHeroReveal';
import { BarChart3, BellOff, CreditCard, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FeatureMedia } from './FeatureMedia';
import { HeroRevealItem } from './HeroRevealItem';
import { HERO_REVEAL_STAGGER } from './constants';

type TrustChip = {
  id: string;
  icon: LucideIcon;
  label: string;
};

const TRUST_CHIPS: TrustChip[] = [
  { id: 'no-deposit', icon: CreditCard, label: '예치금·결제 없음' },
  { id: 'no-penalty', icon: BellOff, label: '벌금 없이도 시작 가능' },
  { id: 'quick-login', icon: Zap, label: '1초 간편 로그인' },
];

type HeroSectionProps = {
  navigate: (path: string) => void;
};

export const HeroSection = ({ navigate }: HeroSectionProps) => {
  const revealed = useHeroReveal();

  const handleScrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="container mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_minmax(0,1fr)] lg:gap-14">
        <div className="flex flex-col">
          <HeroRevealItem delay={HERO_REVEAL_STAGGER} revealed={revealed}>
            <h1 className="mb-6 max-w-2xl font-heading text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl sm:leading-tight lg:text-6xl">
              &ldquo;내일부터 운동해야지!&rdquo;
              <br /><br />
              정말 하실건가요?
              <br /><br />
              작심삼일의 진짜 이유는
              <br />
              의지가 아닙니다.
              <br /><br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              "혼자"였기 때문입니다.
              </span>
            </h1>
          </HeroRevealItem>
          <HeroRevealItem delay={HERO_REVEAL_STAGGER * 2} revealed={revealed}>
            <p className="mb-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              헬창마을은 친구들과 함께하는 
              <br />
              운동 인증 서비스입니다.
              <br /><br />
              혼자 운동하지 말고, {' '}
              <span className="font-semibold text-slate-800">친구들과 같이 하세요</span>
            </p>
          </HeroRevealItem>
          {/* <HeroRevealItem delay={HERO_REVEAL_STAGGER * 2} revealed={revealed}>
            <ul className="mb-8 flex flex-wrap gap-2">
              {TRUST_CHIPS.map((chip) => {
                const ChipIcon = chip.icon;
                return (
                  <li
                    key={chip.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600"
                  >
                    <ChipIcon className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
                    {chip.label}
                  </li>
                );
              })}
            </ul>
          </HeroRevealItem> */}
          <HeroRevealItem delay={HERO_REVEAL_STAGGER * 3} revealed={revealed}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/login')}
                className="rounded-full bg-indigo-600 px-10 py-6 font-heading text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-transform duration-150 hover:scale-[1.02] hover:bg-indigo-700 sm:text-lg"
                aria-label="헬창마을 무료로 시작하고 운동방 만들기"
              >
                무료로 운동방 만들기
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={handleScrollToHowItWorks}
                className="rounded-full px-6 py-6 text-sm font-semibold text-slate-600 hover:text-indigo-600 sm:text-base"
                aria-label="헬창마을 이용 방법 3단계 보기"
              >
                어떻게 시작하나요? ↓
              </Button>
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
