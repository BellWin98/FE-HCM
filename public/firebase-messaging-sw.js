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

const PUSH_NAVIGATE = "PUSH_NAVIGATE";

// src/lib/pushNavigation.ts 의 toPushUrl 과 규칙이 같아야 한다(이 파일은 import 불가).
function toPushUrl(path) {
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\")
  )
    return "/";
  return path;
}

// 백그라운드 메시지 수신 시 표시
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, tag, path } = payload.data || {};
  const notificationTitle = title || "새 알림";
  const notificationOptions = {
    body: body || "",
    icon: icon || "/icons/pwa-192x192.png",
    // tag: tag,
    priority: "high",
    data: { url: toPushUrl(path) },
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = toPushUrl(event.notification.data?.url);
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const sameOrigin = windowClients.filter((c) =>
          c.url.startsWith(self.location.origin),
        );
        // 이 SW 는 페이지를 제어하지 않아 client.navigate() 가 실패하므로 postMessage 로 앱에 이동을 맡긴다.
        const client =
          sameOrigin.find((c) => c.focused) ||
          sameOrigin.find((c) => c.visibilityState === "visible") ||
          sameOrigin[0];
        if (!client) return clients.openWindow(targetUrl);
        return client.focus().then((focused) => {
          (focused || client).postMessage({ type: PUSH_NAVIGATE, url: targetUrl });
        });
      }),
  );
});
