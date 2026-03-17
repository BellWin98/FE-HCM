import { HeroRevealItem } from './HeroRevealItem';
import { HERO_REVEAL_STAGGER } from './constants';
import { Zap } from 'lucide-react';

type PricingSectionProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
  isInView: boolean;
};

export const PricingSection = ({ sectionRef, isInView }: PricingSectionProps) => (
  <section ref={sectionRef} className="py-20 sm:py-28">
    <div className="container mx-auto max-w-6xl px-4">
      <div className="mx-auto max-w-3xl text-center">
        <HeroRevealItem delay={0} revealed={isInView}>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            <Zap className="h-3.5 w-3.5" />
            지금은 베타 기간, 전 기능 무료
          </p>
        </HeroRevealItem>
        <HeroRevealItem delay={HERO_REVEAL_STAGGER} revealed={isInView}>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            헬창마을은 아직 베타 서비스 단계이기 때문에,
            <br />
            플랫폼 이용료 없이 모든 기능을 무료로 사용하실 수 있어요.
          </p>
        </HeroRevealItem>
      </div>
    </div>
  </section>
);
