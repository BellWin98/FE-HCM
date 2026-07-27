import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, deleteToken, isSupported, onMessage } from 'firebase/messaging';
import { api } from './api';

/**
 * Firebase + FCM 초기화 및 토큰 등록을 관리하는 단일 진입점.
 * 여러 컴포넌트에서 호출되더라도 실제 초기화/토큰 요청은 한 번만 수행된다.
 */
let registrationPromise: Promise<string | null> | null = null;
let cachedToken: string | null = null;
let foregroundHandlerRegistered = false;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const ensureApp = (): void => {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
};

const isFcmSupported = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }
  return await isSupported().catch(() => false);
};

const requestBrowserPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  const current = Notification.permission;
  if (current === 'granted' || current === 'denied') {
    return current;
  }
  return await Notification.requestPermission();
};

/**
 * 알림 권한 요청 → FCM 토큰 발급 → 서버 등록까지 수행한다.
 * 이미 진행 중/완료된 경우 같은 결과를 재사용한다(중복 등록 방지).
 * 권한이 없거나 미지원 환경이면 null을 반환한다.
 */
export const ensureFcmToken = async (): Promise<string | null> => {
  if (registrationPromise) return registrationPromise;

  registrationPromise = (async () => {
    if (!(await isFcmSupported())) return null;

    const permission = await requestBrowserPermission();
    if (permission !== 'granted') return null;

    // VAPID 키는 웹 푸시 토큰 발급에 필요
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VITE_FIREBASE_VAPID_KEY가 설정되지 않아 FCM 토큰을 발급할 수 없습니다.');
      return null;
    }

    ensureApp();
    const messaging = getMessaging();

    const token = await getToken(messaging, { vapidKey }).catch((err) => {
      console.error('FCM 토큰 발급 실패', err);
      return null;
    });
    if (!token) return null;

    cachedToken = token;

    // 서버에 토큰 등록 (사용자-토큰 매핑)
    try {
      await api.registerFcmToken(token);
    } catch (e) {
      console.warn('FCM 토큰 등록 실패 (서버)', e);
    }

    return token;
  })();

  return registrationPromise;
};

/**
 * 포그라운드 메시지 수신 핸들러를 등록한다(앱 전체에서 한 번만).
 */
export const registerForegroundMessageHandler = async (
  onForegroundMessage: (payload: unknown) => void
): Promise<void> => {
  if (foregroundHandlerRegistered) return;
  if (!(await isFcmSupported())) return;

  ensureApp();
  const messaging = getMessaging();
  foregroundHandlerRegistered = true;
  onMessage(messaging, (payload: unknown) => onForegroundMessage(payload));
};

/**
 * 로그아웃 시 호출. 서버의 토큰 매핑을 제거하고 로컬 토큰도 폐기한다(best-effort).
 * 실패하더라도 로그아웃 흐름은 계속 진행되어야 한다.
 */
export const unregisterFcmToken = async (): Promise<void> => {
  try {
    if (!(await isFcmSupported())) return;
    if (Notification.permission !== 'granted') return;

    ensureApp();
    const messaging = getMessaging();

    let token = cachedToken;
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!token && vapidKey) {
      token = await getToken(messaging, { vapidKey }).catch(() => null);
    }

    if (token) {
      await api.deleteFcmToken(token).catch((e) => console.warn('FCM 토큰 해제 실패 (서버)', e));
      await deleteToken(messaging).catch(() => {});
    }
  } catch (e) {
    console.warn('FCM 토큰 해제 중 오류', e);
  } finally {
    registrationPromise = null;
    cachedToken = null;
    foregroundHandlerRegistered = false;
  }
};
