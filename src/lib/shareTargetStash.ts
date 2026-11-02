/**
 * Android 공유 시트(Web Share Target, POST)로 받은 값을 서비스워커가 잠시 맡겨 두는 보관함을 읽는다.
 *
 * 보관 형식 — public/share-target-sw.js 와 공유하는 계약(두 파일 상단에 똑같이 적는다):
 * - Cache 이름: `knowledge-share-target`
 * - `/__share/meta`   → JSON `{ createdAt: number, title, text, url, count }`
 * - `/__share/file-{i}` → 파일 본문(i = 0..count-1). 헤더 `Content-Type`, `X-File-Name`(encodeURIComponent)
 * 페이지는 읽은 즉시 캐시를 통째로 지우고, createdAt 으로부터 SHARE_STASH_TTL_MS 가 지난 보관본은 버린다.
 */
export const SHARE_CACHE_NAME = 'knowledge-share-target';
export const SHARE_STASH_TTL_MS = 600000;

const META_KEY = '/__share/meta';
const fileKey = (i: number): string => `/__share/file-${i}`;

export type SharedPayload = {
  title: string | null;
  text: string | null;
  url: string | null;
  files: File[];
};

type SharedMeta = {
  createdAt: number;
  title: string | null;
  text: string | null;
  url: string | null;
  count: number;
};

const hasCaches = (): boolean => typeof caches !== 'undefined';

const toStringOrNull = (value: unknown): string | null => (typeof value === 'string' ? value : null);

const readFile = async (cache: Cache, i: number): Promise<File | null> => {
  const res = await cache.match(fileKey(i));
  if (!res) return null;
  const rawName = res.headers.get('X-File-Name');
  const name = rawName ? decodeURIComponent(rawName) : `shared-${i}`;
  const type = res.headers.get('Content-Type') ?? '';
  // Blob 구현이 환경마다 달라 arrayBuffer 로 옮겨 담는다.
  const body = await res.arrayBuffer();
  return new File([body], name, { type });
};

const readPayload = async (now: number): Promise<SharedPayload | null> => {
  const cache = await caches.open(SHARE_CACHE_NAME);
  const metaRes = await cache.match(META_KEY);
  if (!metaRes) return null;
  const meta = (await metaRes.json()) as Partial<SharedMeta>;
  if (typeof meta.createdAt !== 'number' || now - meta.createdAt > SHARE_STASH_TTL_MS) return null;

  const count = typeof meta.count === 'number' ? meta.count : 0;
  const files: File[] = [];
  for (let i = 0; i < count; i += 1) {
    const file = await readFile(cache, i);
    if (file) files.push(file);
  }
  return {
    title: toStringOrNull(meta.title),
    text: toStringOrNull(meta.text),
    url: toStringOrNull(meta.url),
    files,
  };
};

/** 보관본을 꺼내고 무조건 지운다. 없거나 TTL 이 지났거나 읽기에 실패하면 null. */
export const takeSharedPayload = async (now: number = Date.now()): Promise<SharedPayload | null> => {
  if (!hasCaches()) return null;
  try {
    return await readPayload(now);
  } catch {
    return null;
  } finally {
    await clearSharedPayload();
  }
};

export const clearSharedPayload = async (): Promise<void> => {
  if (!hasCaches()) return;
  try {
    await caches.delete(SHARE_CACHE_NAME);
  } catch {
    // 지우기 실패는 TTL 로 걸러지므로 무시한다.
  }
};
