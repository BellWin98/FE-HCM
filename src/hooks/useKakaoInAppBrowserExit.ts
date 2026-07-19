import { useEffect, useState } from 'react';
import { isKakaoTalkInAppBrowser, redirectToExternalBrowser } from '@/lib/inAppBrowser';

const FALLBACK_GUIDE_DELAY_MS = 1200;

/**
 * 카카오톡 인앱 브라우저로 접속한 경우 자동으로 외부 브라우저 이동을 시도하고,
 * 일정 시간이 지나도 여전히 인앱 브라우저에 남아있으면(구버전 카카오톡 등으로 스킴이
 * 동작하지 않은 경우) 안내 UI를 노출하도록 상태를 제공한다.
 */
export const useKakaoInAppBrowserExit = () => {
  const [isKakaoInApp, setIsKakaoInApp] = useState(false);
  const [showFallbackGuide, setShowFallbackGuide] = useState(false);

  useEffect(() => {
    if (!isKakaoTalkInAppBrowser()) return;

    setIsKakaoInApp(true);
    redirectToExternalBrowser();

    const timer = window.setTimeout(() => setShowFallbackGuide(true), FALLBACK_GUIDE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return { isKakaoInApp, showFallbackGuide };
};
