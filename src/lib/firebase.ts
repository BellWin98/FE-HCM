import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { api } from './api';

/**
 * Firebase + FCM 초기화 및 토큰 등록을 관리한다.
 * 여러 컴포넌트에서 호출되더라도 실제 초기화/토큰 요청은 한 번만 수행된다.
 */
let registrationPromise: Promise<string | null> | null = null;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const ensureApp = () => {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
};

const requestBrowserPermission = async () => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  const current = Notification.permission;
  if (current === 'granted' || current === 'denied') {
    return current;
  }
  return await Notification.requestPermission();
};

export const ensureFcmToken = async (
  onForegroundMessage?: (payload: unknown) => void
): Promise<string | null> => {
  if (registrationPromise) return registrationPromise;

  registrationPromise = (async () => {
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;

    const permission = await requestBrowserPermission();
    if (permission !== 'granted') return null;

    ensureApp();
    const messaging = getMessaging();

    // VAPID 키는 웹 푸시 토큰 발급에 필요
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey }).catch((err) => {
      console.error('FCM 토큰 발급 실패', err);
      return null;
    });
    if (!token) return null;

    // 서버에 토큰 등록 (사용자-토큰 매핑)
    try {
      await api.registerFcmToken(token);
    } catch (e) {
      console.warn('FCM 토큰 등록 실패 (서버)', e);
    }

    if (onForegroundMessage) {
      onMessage(messaging, (payload) => onForegroundMessage(payload));
    }

    return token;
  })();

  return registrationPromise;
};


