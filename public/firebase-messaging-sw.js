// Firebase Messaging 서비스워커 (백그라운드 푸시 처리)
// 이 파일은 /public 루트에 존재해야 하며, PWA 빌드 시 함께 배포된다.

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: self?.ENV?.VITE_FIREBASE_API_KEY || "{{VITE_FIREBASE_API_KEY}}",
  authDomain:
    self?.ENV?.VITE_FIREBASE_AUTH_DOMAIN || "{{VITE_FIREBASE_AUTH_DOMAIN}}",
  projectId:
    self?.ENV?.VITE_FIREBASE_PROJECT_ID || "{{VITE_FIREBASE_PROJECT_ID}}",
  messagingSenderId:
    self?.ENV?.VITE_FIREBASE_SENDER_ID || "{{VITE_FIREBASE_SENDER_ID}}",
  appId: self?.ENV?.VITE_FIREBASE_APP_ID || "{{VITE_FIREBASE_APP_ID}}",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 백그라운드 메시지 수신 시 표시
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, path } = payload.data || {};
  const notificationTitle = title || "새 알림";
  const notificationOptions = {
    body: body || "",
    icon: icon || "/icons/pwa-192x192.png",
    tag: "chat-message",
    priority: "high",
    data: {
      url: path || "/",
      timestamp: Date.now(),
    },
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(targetUrl));
});
