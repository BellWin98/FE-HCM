// Android 공유 시트(Web Share Target, POST multipart)로 들어온 값을 받아 두는 서비스워커 조각.
// vite-plugin-pwa 가 만든 sw.js 가 workbox.importScripts 로 불러온다(firebase-messaging-sw.js 와는 별개).
// POST /notes/share 만 가로채고, 그 외 요청은 건드리지 않아 workbox 가 그대로 처리한다.
//
// 보관 형식 — src/lib/shareTargetStash.ts 와 공유하는 계약(두 파일 상단에 똑같이 적는다):
// - Cache 이름: `knowledge-share-target`
// - `/__share/meta`   → JSON `{ createdAt: number, title, text, url, count }`
// - `/__share/file-{i}` → 파일 본문(i = 0..count-1). 헤더 `Content-Type`, `X-File-Name`(encodeURIComponent)
// 페이지는 읽은 즉시 캐시를 통째로 지우고, createdAt 으로부터 10분(600000ms)이 지난 보관본은 버린다.

const SHARE_CACHE_NAME = 'knowledge-share-target';
const SHARE_PATH = '/notes/share';
const SHARE_REDIRECT = '/notes/share?shared=1';

const toStringOrNull = (value) => (typeof value === 'string' ? value : null);

const stashSharedRequest = async (request) => {
  const formData = await request.formData();
  const files = formData.getAll('files').filter((entry) => typeof entry !== 'string');

  await caches.delete(SHARE_CACHE_NAME);
  const cache = await caches.open(SHARE_CACHE_NAME);

  await cache.put(
    '/__share/meta',
    new Response(
      JSON.stringify({
        createdAt: Date.now(),
        title: toStringOrNull(formData.get('title')),
        text: toStringOrNull(formData.get('text')),
        url: toStringOrNull(formData.get('url')),
        count: files.length,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    ),
  );

  await Promise.all(
    files.map((file, i) =>
      cache.put(
        `/__share/file-${i}`,
        new Response(file, {
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'X-File-Name': encodeURIComponent(file.name || `shared-${i}`),
          },
        }),
      ),
    ),
  );
};

const handleShareTarget = async (request) => {
  try {
    await stashSharedRequest(request);
  } catch (error) {
    // 실패해도 같은 주소로 보낸다. 페이지는 보관본이 없으면 파일 없이 연다.
    console.error('[share-target] 공유 값 보관 실패', error);
  }
  return Response.redirect(SHARE_REDIRECT, 303);
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'POST') return;
  if (new URL(request.url).pathname !== SHARE_PATH) return;
  event.respondWith(handleShareTarget(request));
});
