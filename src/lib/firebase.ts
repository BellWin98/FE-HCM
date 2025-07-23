import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { api } from "./api";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
    try {
        const currentToken = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
        if (currentToken) {
            console.log('FCM Token:', currentToken);
            await api.updateFcmToken(currentToken);
        } else {
            console.log('No registration token available. Request permission to generate one.');
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
    }
}

// 포그라운드 메시지 수신 리스너
onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    // TODO: 수신한 메시지를 UI에 표시하는 로직 구현 (예: sonner, react-hot-toast)
    // 예시: new Notification(payload.notification.title, { body: payload.notification.body });
});