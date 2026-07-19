import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export type PwaInstallPlatform = 'android' | 'ios';

const isStandaloneDisplay = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIosDevice = (): boolean => {
  const ua = window.navigator.userAgent;
  const isIphoneOrIpod = /iPhone|iPod/.test(ua);
  // iPadOS 13+는 UA에 Mac으로 표시되므로 터치 지원 여부로 구분한다.
  const isIpad = /iPad/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  return isIphoneOrIpod || isIpad;
};

interface UsePwaInstallPromptResult {
  visible: boolean;
  platform: PwaInstallPlatform | null;
  promptInstall: () => void;
  dismiss: () => void;
}

export const usePwaInstallPrompt = (): UsePwaInstallPromptResult => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<PwaInstallPlatform | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) {
      return;
    }

    // iOS는 beforeinstallprompt를 지원하지 않으므로 안내 배너를 바로 노출한다.
    if (isIosDevice()) {
      setPlatform('ios');
      setVisible(true);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setPlatform('android');
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const promptInstall = useCallback(() => {
    if (!deferredPrompt) {
      return;
    }

    void deferredPrompt.prompt();
    void deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null);
      setVisible(false);
    });
  }, [deferredPrompt]);

  return { visible, platform, promptInstall, dismiss };
};
