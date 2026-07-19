import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export type PwaInstallPlatform = 'android' | 'ios';

const DISMISS_STORAGE_KEY = 'pwaInstallDismissedAt';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7일

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

const wasDismissedRecently = (): boolean => {
  const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
  if (!dismissedAt) {
    return false;
  }
  return Date.now() - Number(dismissedAt) < DISMISS_COOLDOWN_MS;
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
    if (isStandaloneDisplay() || wasDismissedRecently()) {
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
      localStorage.removeItem(DISMISS_STORAGE_KEY);
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
    localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
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
