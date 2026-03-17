import { cn } from '@/lib/utils';
import { useState } from 'react';
import { HeroRevealItem } from './HeroRevealItem';
import { HERO_REVEAL_STAGGER } from './constants';

const FAQ_ITEMS = [
  {
    id: 'penalty-rule',
    question: '벌금 금액과 규칙은 누가 정하나요?',
    answer: (
      <>
        방장이 운동방을 개설할 때 직접 정해요.
        <br /><br />
        최소 운동 인증 횟수, 인증 1회 누락 시 낼 벌금,
        <br />
        최대 인원 및 운동방 입장코드를 설정할 수 있어요.
      </>
    ),
  },
  {
    id: 'rest-day',
    question: '운동을 쉬고 싶은 날에는 어떻게 하나요?',
    answer: (
      <>
        휴식일 등록 기능을 사용하세요!
        <br />
        휴식일이 포함된 주에는, 벌금이 부과되지 않아요.
      </>
    ),
  },
  {
    id: 'payment',
    question: '헬창마을에서 실제로 돈 거래가 이루어지나요?',
    answer:(
      <>
        헬창마을은 결제/송금 기능을 제공하지 않아요.
        <br /><br />
        운동 미인증 횟수에 따른 벌금만 투명하게 계산해주고 있으니
        <br />
        실제 정산은 계좌이체나 송금 앱 등으로 직접 진행해 주세요
      </>
    ),
  },
  {
    id: 'photo',
    question: '운동 인증 사진에 꼭 얼굴이 나와야 하나요?',
    answer:(
      <>
        헬창마을에서 운동 사진을 검증하지는 않아요.
        <br />
        얼굴이 꼭 나올 필요는 없지만, 운동과 관련된 사진이면 됩니다!
        <br /><br />
        ex: 운동기구가 나온 사진, 어플(타임스탬프) 기록 등
      </>
    ),
  },
  {
    id: 'photo1',
    question: '운동 인증 사진에 꼭 얼굴이 나와야 하나요?',
    answer:(
      <>
        헬창마을에서 운동 사진을 검증하지는 않아요.
        <br />
        얼굴이 꼭 나올 필요는 없지만, 운동과 관련된 사진이면 됩니다!
        <br /><br />
        ex: 운동기구가 나온 사진, 어플(타임스탬프) 기록 등
      </>
    ),
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
