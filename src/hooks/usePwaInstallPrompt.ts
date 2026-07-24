import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export type PwaInstallPlatform = 'android' | 'ios';

export type PwaInstallSnoozeDuration = 'today' | 'week';

const SNOOZE_STORAGE_KEY = 'pwa-install-snooze-until';

// 스누즈 만료 시각(ms)을 반환한다. '오늘'은 오늘 자정까지, '일주일'은 7일 뒤까지 배너를 숨긴다.
const getSnoozeUntil = (duration: PwaInstallSnoozeDuration): number => {
  if (duration === 'today') {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return endOfToday.getTime();
  }
  return Date.now() + 7 * 24 * 60 * 60 * 1000;
};

const isSnoozed = (): boolean => {
  try {
    const raw = window.localStorage.getItem(SNOOZE_STORAGE_KEY);
    if (!raw) {
      return false;
    }
    const until = Number(raw);
    if (Number.isNaN(until)) {
      return false;
    }
    if (Date.now() >= until) {
      window.localStorage.removeItem(SNOOZE_STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

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
  snooze: (duration: PwaInstallSnoozeDuration) => void;
}

export const usePwaInstallPrompt = (): UsePwaInstallPromptResult => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<PwaInstallPlatform | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay() || isSnoozed()) {
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

  const snooze = useCallback((duration: PwaInstallSnoozeDuration) => {
    try {
      window.localStorage.setItem(SNOOZE_STORAGE_KEY, String(getSnoozeUntil(duration)));
    } catch {
      // localStorage 접근이 차단된 경우 무시하고 세션 동안만 숨긴다.
    }
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

  return { visible, platform, promptInstall, dismiss, snooze };
};
