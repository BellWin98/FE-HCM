import { Check, Flame, Leaf } from 'lucide-react';
import { HeroRevealItem } from './HeroRevealItem';
import { HERO_REVEAL_STAGGER } from './constants';

const PENALTY_MODE_FEATURES = [
  '주간 목표 미달 시 벌금 자동 계산',
  '1회 누락당 1,000원~50,000원, 방장이 설정',
  '월요일 자정, 서버가 공정하게 집계',
  '부상·여행엔 휴식일 등록으로 벌금 면제',
];

const FREE_MODE_FEATURES = [
  '벌금 걱정 없이 인증과 기록에만 집중',
  '대시보드·캘린더·채팅 전부 동일하게 제공',
  '매일 저녁 인증 리마인더로 습관 유지',
  '준비되면 언제든 벌금 제도 켜기 가능',
];

type ModeCardProps = {
  icon: React.ReactNode;
  badge: string;
  badgeClassName: string;
  title: string;
  subtitle: string;
  features: string[];
  checkColorClassName: string;
};

const ModeCard = ({
  icon,
  badge,
  badgeClassName,
  title,
  subtitle,
  features,
  checkColorClassName,
}: ModeCardProps) => (
  <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
    <div className="mb-4 flex items-center gap-3">
      {icon}
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClassName}`}
      >
        {badge}
      </span>
    </div>
    <h3 className="font-heading text-lg font-bold text-slate-900 sm:text-xl">{title}</h3>
    <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
    <ul className="mt-5 space-y-2.5">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2 text-xs text-slate-600 sm:text-sm">
          <Check
            className={`mt-0.5 h-4 w-4 shrink-0 ${checkColorClassName}`}
            aria-hidden="true"
          />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  </div>
);

type PenaltyChoiceSectionProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
  isInView: boolean;
};

export const PenaltyChoiceSection = ({ sectionRef, isInView }: PenaltyChoiceSectionProps) => (
  <section ref={sectionRef} className="bg-slate-50/90 py-20 sm:py-28">
    <div className="container mx-auto max-w-6xl px-4">
      <HeroRevealItem delay={0} revealed={isInView}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            독하게 운동하고 싶으면,
            <br />
            벌금제로도 운영할 수 있어요
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            헬창마을에서 벌금까지 자동으로 계산해줘요.
          </p>
        </div>
      </HeroRevealItem>
      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-5 lg:grid-cols-2">
        <HeroRevealItem delay={HERO_REVEAL_STAGGER} revealed={isInView}>
          <ModeCard
            icon={
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100">
                <Flame className="h-5 w-5 text-orange-600" aria-hidden="true" />
              </div>
            }
            badge="벌금 모드"
            badgeClassName="bg-orange-100 text-orange-700"
            title="돈이 걸려야 움직일 것 같으면"
            subtitle=""
            features={PENALTY_MODE_FEATURES}
            checkColorClassName="text-orange-500"
          />
        </HeroRevealItem>
        <HeroRevealItem delay={HERO_REVEAL_STAGGER * 2} revealed={isInView}>
          <ModeCard
            icon={
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                <Leaf className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
            }
            badge="노벌금 모드"
            badgeClassName="bg-emerald-100 text-emerald-700"
            title="부담 없이 운동 하고 싶다면"
            subtitle=""
            features={FREE_MODE_FEATURES}
            checkColorClassName="text-emerald-500"
          />
        </HeroRevealItem>
      </div>
      {/* <HeroRevealItem delay={HERO_REVEAL_STAGGER * 3} revealed={isInView}>
        <p className="mt-8 text-center text-xs text-slate-500 sm:text-sm">
          벌금 모드는 언제든 바꿀 수 있어요. 
          <br />
          규칙 변경은 다음 주 월요일부터 적용되니, 소급 걱정도 없어요.
        </p>
      </HeroRevealItem> */}
    </div>
  </section>
);
