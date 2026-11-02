import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  SHARE_CACHE_NAME,
  SHARE_STASH_TTL_MS,
  clearSharedPayload,
  takeSharedPayload,
} from '@/lib/shareTargetStash';

// jsdom 에는 CacheStorage 가 없으므로 Map 기반 가짜를 주입한다.
type FakeCache = Map<string, Response>;
const keyOf = (req: RequestInfo | URL) =>
  typeof req === 'string' ? req : req instanceof URL ? req.pathname : new URL(req.url).pathname;

const createFakeCaches = () => {
  const stores = new Map<string, FakeCache>();
  const storage = {
    stores,
    async open(name: string) {
      let store = stores.get(name);
      if (!store) {
        store = new Map();
        stores.set(name, store);
      }
      const s = store;
      return {
        async match(req: RequestInfo | URL) {
          return s.get(keyOf(req))?.clone();
        },
        async put(req: RequestInfo | URL, res: Response) {
          s.set(keyOf(req), res);
        },
      };
    },
    async delete(name: string) {
      return stores.delete(name);
    },
  };
  return storage;
};

let fake: ReturnType<typeof createFakeCaches>;

const stash = async (
  meta: { createdAt: number; title: string | null; text: string | null; url: string | null },
  files: { name: string; type: string; body: string }[]
) => {
  const cache = await fake.open(SHARE_CACHE_NAME);
  await cache.put(
    '/__share/meta',
    new Response(JSON.stringify({ ...meta, count: files.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  );
  for (const [i, f] of files.entries()) {
    await cache.put(
      `/__share/file-${i}`,
      new Response(f.body, {
        headers: { 'Content-Type': f.type, 'X-File-Name': encodeURIComponent(f.name) },
      })
    );
  }
};

beforeEach(() => {
  fake = createFakeCaches();
  (globalThis as unknown as { caches: unknown }).caches = fake;
});

afterEach(() => {
  delete (globalThis as unknown as { caches?: unknown }).caches;
});

describe('shareTargetStash', () => {
  it('보관본의 파일 2개(이름·타입 보존)와 title/text/url 을 돌려준다', async () => {
    const now = 1_000_000;
    await stash({ createdAt: now - 1000, title: '제목', text: '본문', url: 'https://example.com/a' }, [
      { name: '캡처 1.png', type: 'image/png', body: 'png-bytes' },
      { name: 'b.jpg', type: 'image/jpeg', body: 'jpg-bytes' },
    ]);

    const payload = await takeSharedPayload(now);

    expect(payload).not.toBeNull();
    expect(payload!.title).toBe('제목');
    expect(payload!.text).toBe('본문');
    expect(payload!.url).toBe('https://example.com/a');
    expect(payload!.files).toHaveLength(2);
    expect(payload!.files[0]).toBeInstanceOf(File);
    expect(payload!.files[0].name).toBe('캡처 1.png');
    expect(payload!.files[0].type).toBe('image/png');
    expect(payload!.files[0].size).toBe('png-bytes'.length);
    expect(payload!.files[1].name).toBe('b.jpg');
    expect(payload!.files[1].type).toBe('image/jpeg');
  });

  it('한 번 꺼내면 지워져서 두 번째 호출은 null 이다', async () => {
    const now = 1_000_000;
    await stash({ createdAt: now, title: null, text: null, url: null }, [
      { name: 'a.png', type: 'image/png', body: 'x' },
    ]);

    expect(await takeSharedPayload(now)).not.toBeNull();
    expect(await takeSharedPayload(now)).toBeNull();
  });

  it('createdAt 이 11분 전이면 null 을 돌려주고 캐시도 지운다', async () => {
    const now = 10_000_000;
    await stash({ createdAt: now - 11 * 60 * 1000, title: 't', text: null, url: null }, [
      { name: 'a.png', type: 'image/png', body: 'x' },
    ]);
    expect(SHARE_STASH_TTL_MS).toBe(600000);

    expect(await takeSharedPayload(now)).toBeNull();
    expect(fake.stores.has(SHARE_CACHE_NAME)).toBe(false);
  });

  it('보관본이 없으면 null 이다', async () => {
    expect(await takeSharedPayload()).toBeNull();
  });

  it('caches 가 없는 환경에서는 null 을 돌려준다', async () => {
    delete (globalThis as unknown as { caches?: unknown }).caches;

    expect(await takeSharedPayload()).toBeNull();
    await expect(clearSharedPayload()).resolves.toBeUndefined();
  });

  it('clearSharedPayload 는 보관 캐시를 지운다', async () => {
    await stash({ createdAt: Date.now(), title: null, text: null, url: null }, []);

    await clearSharedPayload();

    expect(fake.stores.has(SHARE_CACHE_NAME)).toBe(false);
  });
});
