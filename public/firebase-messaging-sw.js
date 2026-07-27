// Firebase Messaging 서비스워커 (백그라운드 푸시 처리)
// 이 파일은 /public 루트에 존재해야 하며, PWA 빌드 시 함께 배포된다.
//
// 주의: 서비스워커는 Vite의 import.meta.env 치환을 받지 못하고, 빌드 시 self.ENV를 주입하는 코드도
// 없다. 아래 Firebase 웹 설정 값은 클라이언트에 그대로 노출되는 공개 값이므로(비밀키 아님) 직접
// 하드코딩한다. 값이 바뀌면 프로젝트 .env(VITE_FIREBASE_*)와 함께 이 파일도 갱신할 것.

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyBPjnBqV8pdGnfVhVs8UTPq2afBu71vaRc",
  authDomain: "healchangvillage.firebaseapp.com",
  projectId: "healchangvillage",
  messagingSenderId: "1013869429319",
  appId: "1:1013869429319:web:42e34913724461a9b92762",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 백그라운드 메시지 수신 시 표시 (백엔드는 data-only 메시지를 보내므로 여기서 직접 렌더링한다)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, url } = payload.data || {};
  const notificationTitle = title || "새 알림";
  const notificationOptions = {
    body: body || "",
    icon: icon || "/icons/pwa-192x192.png",
    // 알림 클릭 시 이동할 경로를 notification.data에 실어 둔다 (notificationclick에서 사용).
    data: { url: url || "/dashboard" },
    priority: "high",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";
  // 이미 열린 창이 있으면 포커스, 없으면 새 창을 연다.
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      }),
  );
});
