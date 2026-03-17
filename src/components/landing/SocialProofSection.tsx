import { useCountUp } from '@/hooks/useCountUp';
import { CheckCircle2 } from 'lucide-react';
import { HeroRevealItem } from './HeroRevealItem';
import { HERO_REVEAL_STAGGER } from './constants';

const SocialProofStats = () => {
  const stat1 = useCountUp({ target: 600, duration: 5000 });
  const stat2 = useCountUp({ target: 6, duration: 5000 });
  const stat3 = useCountUp({ target: 88, duration: 5000 });

  return (
    <div className="grid w-full max-w-xl grid-cols-3 gap-3 text-center text-xs sm:text-sm">
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2.5">
        <p className="text-sm font-semibold text-slate-900">
          {stat1.toLocaleString()}
          회+
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">총 운동 인증 횟수</p>
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2.5">
        <p className="text-sm font-semibold text-slate-900">
          {stat2.toLocaleString()}
          개
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">현재 운영 중인 방</p>
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2.5">
        <p className="text-sm font-semibold text-slate-900">{stat3}%</p>
        <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">벌금 완납률</p>
      </div>
    </div>
  );
};

type SocialProofSectionProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
  isInView: boolean;
};

export const SocialProofSection = ({ sectionRef, isInView }: SocialProofSectionProps) => (
  <section ref={sectionRef} className="border-y border-slate-200 bg-white/80 py-6">
    <div className="container mx-auto max-w-6xl px-4">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <HeroRevealItem delay={0} revealed={isInView}>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 sm:text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>현재 13명의 유저가 꾸준히 운동을 인증하고 있어요!</span>
          </div>
        </HeroRevealItem>
        <HeroRevealItem delay={HERO_REVEAL_STAGGER} revealed={isInView}>
          <SocialProofStats />
        </HeroRevealItem>
      </div>
    </div>
  </section>
);
