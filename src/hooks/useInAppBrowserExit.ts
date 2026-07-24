import { useEffect, useState } from 'react';
import { isInAppBrowser, redirectToExternalBrowser } from '@/lib/inAppBrowser';

const FALLBACK_GUIDE_DELAY_MS = 1200;

/**
 * 인앱 브라우저(카카오톡·인스타그램·스레드 등)로 접속한 경우 자동으로 외부 브라우저 이동을 시도하고,
 * 스킴 이동이 불가하거나(주로 iOS 인스타/스레드) 일정 시간이 지나도 여전히 인앱 브라우저에 남아있으면
 * (구버전 앱 등으로 스킴이 동작하지 않은 경우) 안내 UI를 노출하도록 상태를 제공한다.
 */
export const useInAppBrowserExit = () => {
  const [isInApp, setIsInApp] = useState(false);
  const [showFallbackGuide, setShowFallbackGuide] = useState(false);

  useEffect(() => {
    if (!isInAppBrowser()) return;

    setIsInApp(true);
    const redirected = redirectToExternalBrowser();

    // 스킴 이동 자체가 불가한 환경(iOS 인스타/스레드)은 즉시 안내를 노출한다.
    if (!redirected) {
      setShowFallbackGuide(true);
      return;
    }

    // 스킴을 시도했더라도 동작하지 않을 수 있어, 지연 후 폴백 안내를 노출한다.
    const timer = window.setTimeout(() => setShowFallbackGuide(true), FALLBACK_GUIDE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return { isInApp, showFallbackGuide };
};
