import { describe, expect, it } from 'vitest';
import { scrollTopToReveal } from '@/lib/textareaCaret';

describe('scrollTopToReveal', () => {
  const view = { scrollTop: 0, clientHeight: 100 };

  it('커서가 보이는 영역 안이면 그대로 둔다', () => {
    expect(scrollTopToReveal({ top: 20, bottom: 40 }, view)).toBe(0);
  });

  it('커서가 아래로 벗어나면 커서 아래 끝이 보이도록 내린다', () => {
    expect(scrollTopToReveal({ top: 180, bottom: 200 }, view)).toBe(100);
  });

  it('커서가 위로 벗어나면 커서 위 끝까지 올린다', () => {
    expect(scrollTopToReveal({ top: 30, bottom: 50 }, { scrollTop: 80, clientHeight: 100 })).toBe(30);
  });
});
