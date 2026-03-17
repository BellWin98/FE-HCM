import { cn } from '@/lib/utils';
import { useState } from 'react';
import { HeroRevealItem } from './HeroRevealItem';
import { HERO_REVEAL_STAGGER } from './constants';

const FAQ_ITEMS = [
  {
    id: 'penalty-rule',
    question: '벌금 금액과 규칙은 누가 정하나요?',
    answer:
      '방장이 운동방을 개설할 때 직접 정해요. 최소 인증 횟수, 인증 1회 누락 시 낼 벌금, 최대 인원을 설정할 수 있어요.',
  },
  {
    id: 'payment',
    question: '실제 돈 거래는 어떻게 진행되나요?',
    answer:
      '헬창마을은 결제/송금 기능을 제공하지 않아요. 서비스 안에서 미인증 횟수와 예상 벌금만 투명하게 계산해 주고, 실제 정산은 계좌이체나 송금 앱 등 방에서 정한 방식으로 직접 진행해 주세요.',
  },
  {
    id: 'photo',
    question: '운동 인증 사진은 꼭 얼굴이 나와야 하나요?',
    answer:
      '얼굴이 반드시 나올 필요는 없습니다. 운동기구가 나온 사진이나, 어플(타임스탬프) 등으로 인증할 수 있어요.',
  },
];

const FAQAccordion = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-3">
      {FAQ_ITEMS.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5 sm:py-4"
              onClick={() => handleToggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${item.id}`}
            >
              <span className="text-sm font-semibold text-slate-900 sm:text-base">
                {item.question}
              </span>
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 transition-transform',
                  isOpen && 'rotate-45'
                )}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            <div
              id={`faq-panel-${item.id}`}
              className={cn(
                'grid transition-all duration-200',
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 text-xs leading-relaxed text-slate-600 sm:px-5 sm:pb-5 sm:text-sm">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

type FAQSectionProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
  isInView: boolean;
};

export const FAQSection = ({ sectionRef, isInView }: FAQSectionProps) => (
  <section ref={sectionRef} className="bg-slate-50/90 py-20 sm:py-28">
    <div className="container mx-auto max-w-6xl px-4">
      <HeroRevealItem delay={0} revealed={isInView}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">자주 묻는 질문</h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            가입 전에 궁금하실 수 있는 것들을 먼저 정리했어요.
            <br />
            이 외에 궁금한 점이 있다면 언제든지 문의해 주세요.
          </p>
        </div>
      </HeroRevealItem>
      <HeroRevealItem delay={HERO_REVEAL_STAGGER} revealed={isInView}>
        <FAQAccordion />
      </HeroRevealItem>
    </div>
  </section>
);
