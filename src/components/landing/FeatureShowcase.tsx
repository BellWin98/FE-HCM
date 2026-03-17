import { HeroRevealItem } from './HeroRevealItem';
import { FEATURE_SHOWCASE_ITEMS } from './featureShowcaseData';
import { FeatureShowcaseItem } from './FeatureShowcaseItem';
import { HERO_REVEAL_STAGGER } from './constants';

type FeatureShowcaseProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
  isInView: boolean;
};

export const FeatureShowcase = ({ sectionRef, isInView }: FeatureShowcaseProps) => (
  <section ref={sectionRef} className="py-20 sm:py-28">
    <div className="container mx-auto max-w-6xl px-4">
      <HeroRevealItem delay={200} revealed={isInView}>
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          왜 꼭 헬창마을이어야 할까요?
        </h2>
      </HeroRevealItem>
      <HeroRevealItem delay={HERO_REVEAL_STAGGER} revealed={isInView}>
        <p className="mx-auto mt-5 max-w-2xl text-center text-sm text-slate-600 sm:text-base">
          기능이 아니라, 오로지 사용성과 편의성에 집중했어요.
          <br /><br />
          대시보드, 운동 인증, 벌금 집계, 인증 캘린더, 채팅방까지.
          <br /><br />
          헬창마을 안에서 전부 해결되도록 설계했어요.
        </p>
      </HeroRevealItem>
      <div className="mx-auto mt-16 max-w-5xl space-y-24">
        {FEATURE_SHOWCASE_ITEMS.map((item, index) => (
          <HeroRevealItem
            key={item.id}
            delay={HERO_REVEAL_STAGGER * (index + 2)}
            revealed={isInView}
          >
            <FeatureShowcaseItem item={item} />
          </HeroRevealItem>
        ))}
      </div>
    </div>
  </section>
);
