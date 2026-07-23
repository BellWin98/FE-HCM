import { Button } from '@/components/ui/button';
import { Copy, MessageCircle, Share2, Ticket } from 'lucide-react';
import { HeroRevealItem } from './HeroRevealItem';
import { HERO_REVEAL_STAGGER } from './constants';

const SAMPLE_ENTRY_CODE = 'HCM2026';

type InviteSectionProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
  isInView: boolean;
  onNavigate: (path: string) => void;
};

/** 초대 코드 공유 화면을 시각화한 목업 카드 (실제 동작은 로그인 후 방에서 제공) */
const InviteCodeMockup = () => (
  <div
    className="relative mx-auto w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5"
    aria-hidden="true"
  >
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
      <Ticket className="h-4 w-4 text-indigo-500" />
      <span>운동방 입장 코드</span>
    </div>
    <div className="mt-3 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/60 py-5 text-center">
      <span className="font-number text-2xl font-bold tracking-[0.3em] text-indigo-700 tabular-nums">
        {SAMPLE_ENTRY_CODE}
      </span>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#FEE500] py-2.5 text-xs font-semibold text-slate-900">
        <MessageCircle className="h-3.5 w-3.5" />
        카카오톡 초대
      </div>
      <div className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600">
        <Copy className="h-3.5 w-3.5" />
        링크 복사
      </div>
    </div>
    <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-400">
      친구는 링크 클릭 → 간편 로그인 → 자동으로 방 입장
    </p>
  </div>
);

export const InviteSection = ({ sectionRef, isInView, onNavigate }: InviteSectionProps) => (
  <section ref={sectionRef} className="py-20 sm:py-28">
    <div className="container mx-auto max-w-6xl px-4">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <HeroRevealItem delay={0} revealed={isInView}>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Share2 className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-amber-600">친구 초대</span>
            </div>
            <h2 className="mb-4 font-heading text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
              혼자 시작해도 좋지만,
              <br />
              함께일 때 3배 더 오래 가요
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-600 sm:text-base">
              방을 만들면 운동방 입장 코드가 생겨요.
              <br />
              카카오톡으로 친구에게 공유해보세요!
            </p>
            <ul className="mb-8 space-y-2 text-xs text-slate-600 sm:text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500" aria-hidden="true">
                  ①
                </span>
                <span>같은 운동방 친구가 인증하면 푸시로 바로 알려줘요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500" aria-hidden="true">
                  ②
                </span>
                <span>누가 운동을 몇 번 했는지 대시보드에서 확인해요</span>
              </li>
            </ul>
            <Button
              size="lg"
              onClick={() => onNavigate('/login')}
              className="rounded-full bg-amber-500 px-8 py-5 font-heading text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-transform duration-150 hover:scale-[1.02] hover:bg-amber-600 sm:text-base"
              aria-label="운동방 만들고 친구 초대 코드 받기"
            >
              방 만들고 초대 코드 받기
            </Button>
          </div>
        </HeroRevealItem>
        <HeroRevealItem delay={HERO_REVEAL_STAGGER} revealed={isInView}>
          <InviteCodeMockup />
        </HeroRevealItem>
      </div>
    </div>
  </section>
);
