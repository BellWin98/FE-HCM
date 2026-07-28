import { useState } from 'react';
import { HeroRevealItem } from './HeroRevealItem';
import { HERO_REVEAL_STAGGER } from './constants';
import { LegalDialog } from './LegalDialog';
import { LEGAL_EFFECTIVE_DATE, PRIVACY_POLICY_SECTIONS, TERMS_OF_SERVICE_SECTIONS } from './legalContent';

type WelcomeFooterProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
  isInView: boolean;
};

export const WelcomeFooter = ({ sectionRef, isInView }: WelcomeFooterProps) => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
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
              onClick={() => setIsPrivacyOpen(true)}
            >
              개인정보처리방침
            </button>
            <button
              type="button"
              className="text-xs text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
              aria-label="서비스 이용약관 보기"
              onClick={() => setIsTermsOpen(true)}
            >
              이용약관
            </button>
            <a
              href="mailto:bellwin98@gmail.com"
              className="text-xs text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
              aria-label="헬창마을 문의 메일 보내기"
            >
              문의하기 bellwin98@gmail.com
            </a>
          </div>
        </HeroRevealItem>
      </div>

      <LegalDialog
        open={isPrivacyOpen}
        onOpenChange={setIsPrivacyOpen}
        title="개인정보처리방침"
        effectiveDate={LEGAL_EFFECTIVE_DATE}
        sections={PRIVACY_POLICY_SECTIONS}
      />
      <LegalDialog
        open={isTermsOpen}
        onOpenChange={setIsTermsOpen}
        title="이용약관"
        effectiveDate={LEGAL_EFFECTIVE_DATE}
        sections={TERMS_OF_SERVICE_SECTIONS}
      />
    </footer>
  );
};
