import { CalendarCheck, PlusCircle, Share2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { HeroRevealItem } from './HeroRevealItem';
import { HERO_REVEAL_STAGGER } from './constants';

type StepConfig = {
  id: string;
  step: number;
  icon: LucideIcon;
  iconBgClassName: string;
  iconColorClassName: string;
  title: string;
  /** 줄바꿈은 \n으로 구분 */
  description: string;
};

const STEP_ITEMS: StepConfig[] = [
  {
    id: 'create',
    step: 1,
    icon: PlusCircle,
    iconBgClassName: 'bg-indigo-100',
    iconColorClassName: 'text-indigo-600',
    title: '운동방을 만들어요',
    description:
      '주간 목표 횟수와 벌금액만 정하면 끝.\n벌금이 부담스럽다면 끄고 시작해도 돼요.',
  },
  {
    id: 'invite',
    step: 2,
    icon: Share2,
    iconBgClassName: 'bg-amber-100',
    iconColorClassName: 'text-amber-600',
    title: '친구를 초대해요',
    description:
      '입장 코드를 카카오톡으로 공유하면\n친구는 클릭 한 번으로 바로 들어와요.',
  },
  {
    id: 'certify',
    step: 3,
    icon: CalendarCheck,
    iconBgClassName: 'bg-emerald-100',
    iconColorClassName: 'text-emerald-600',
    title: '인증하면, 계산은 자동',
    description:
      '사진 한 장으로 10초 인증.\n매주 월요일 자정, 집계는 앱이 알아서 해요.',
  },
];

type HowItWorksSectionProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
  isInView: boolean;
};

export const HowItWorksSection = ({ sectionRef, isInView }: HowItWorksSectionProps) => (
  <section id="how-it-works" ref={sectionRef} className="scroll-mt-24 bg-white/70 py-20 sm:py-28">
    <div className="container mx-auto max-w-6xl px-4">
      <HeroRevealItem delay={0} revealed={isInView}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            시작까지 딱 3단계, 1분이면 충분해요
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            복잡한 설정도, 예치금도 없어요.
            <br />
            방 만들고 친구만 초대하면 오늘부터 바로 시작이에요.
          </p>
        </div>
      </HeroRevealItem>
      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
        {STEP_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <HeroRevealItem
              key={item.id}
              delay={HERO_REVEAL_STAGGER * (index + 1)}
              revealed={isInView}
            >
              <div className="relative h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <span
                  className="absolute -top-3 left-6 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
                  aria-hidden="true"
                >
                  {item.step}
                </span>
                <div
                  className={`mb-4 mt-2 flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBgClassName}`}
                >
                  <Icon className={`h-5 w-5 ${item.iconColorClassName}`} />
                </div>
                <h3 className="mb-2 font-heading text-base font-bold text-slate-900 sm:text-lg">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                  {item.description.split('\n').map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </p>
              </div>
            </HeroRevealItem>
          );
        })}
      </div>
    </div>
  </section>
);
