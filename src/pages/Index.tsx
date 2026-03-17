import { useAuth } from '@/contexts/AuthContext';
import {
  FAQSection,
  FeatureShowcase,
  FEATURES_IN_VIEW_OPTIONS,
  HeroSection,
  MobileCTABar,
  PricingSection,
  SocialProofSection,
  WelcomeFooter,
  WelcomeHeader,
} from '@/components/landing';
import { useInView } from '@/hooks/useInView';
import { Navigate, useNavigate } from 'react-router-dom';

export const WelcomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const socialProofInView = useInView();
  const featuresInView = useInView(FEATURES_IN_VIEW_OPTIONS);
  const pricingInView = useInView();
  const faqInView = useInView();
  const footerInView = useInView();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen min-h-[100dvh] overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-safe">
      <MobileCTABar onNavigate={navigate} />
      <WelcomeHeader onNavigate={navigate} />

      <main>
        <HeroSection navigate={navigate} />
        <SocialProofSection
          sectionRef={socialProofInView.ref}
          isInView={socialProofInView.isInView}
        />
        <FeatureShowcase
          sectionRef={featuresInView.ref}
          isInView={featuresInView.isInView}
        />
        {/* 고객 후기 섹션 - 재활성화 시 FadeInSection + 카드 리스트 사용 */}
        {/* <section className="bg-slate-50/80 py-16 sm:py-20">...</section> */}
        <PricingSection
          sectionRef={pricingInView.ref}
          isInView={pricingInView.isInView}
        />
        <FAQSection sectionRef={faqInView.ref} isInView={faqInView.isInView} />
      </main>

      <WelcomeFooter sectionRef={footerInView.ref} isInView={footerInView.isInView} />
    </div>
  );
};

export default WelcomePage;
