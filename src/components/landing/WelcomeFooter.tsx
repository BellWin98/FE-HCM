import { HeroRevealItem } from './HeroRevealItem';
import { HERO_REVEAL_STAGGER } from './constants';

type WelcomeFooterProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
  isInView: boolean;
};

export const WelcomeFooter = ({ sectionRef, isInView }: WelcomeFooterProps) => (
  <footer ref={sectionRef} className="border-t border-slate-200 bg-slate-50/80 py-10">
    <div className="container mx-auto max-w-6xl px-4 text-center text-xs text-slate-500 sm:text-sm">
      <HeroRevealItem delay={0} revealed={isInView}>
        <p>© 2026 HCM. All rights reserved.</p>
      </HeroRevealItem>
      <HeroRevealItem delay={HERO_REVEAL_STAGGER} revealed={isInView}>
        <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <button
            type="button"
            className="text-xs text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
            aria-label="개인정보 처리방침 보기"
          >
            개인정보처리방침
          </button>
          <button
            type="button"
            className="text-xs text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
            aria-label="서비스 이용약관 보기"
          >
            이용약관
          </button>
          <button
            type="button"
            className="text-xs text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
            aria-label="헬창마을 문의 메일 보내기"
          >
            문의하기 bellwin98@gmail.com
          </button>
        </div>
      </HeroRevealItem>
    </div>
  </footer>
);
