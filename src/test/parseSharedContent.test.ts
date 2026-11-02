import { describe, expect, it } from 'vitest';
import { parseSharedContent } from '@/lib/parseSharedContent';

describe('parseSharedContent', () => {
  it('url 이 있으면 sourceUrl = url, sourceText = title', () => {
    expect(parseSharedContent({ title: '기사 제목', url: 'https://example.com/a' })).toEqual({
      sourceUrl: 'https://example.com/a',
      sourceText: '기사 제목',
    });
  });

  it('url 이 없고 text 에 "제목 URL" 이 오면 URL 을 뽑고 나머지를 sourceText 로 쓴다', () => {
    expect(parseSharedContent({ text: '제목 https://naver.me/abc' })).toEqual({
      sourceUrl: 'https://naver.me/abc',
      sourceText: '제목',
    });
  });

  it('title 도 있으면 sourceText 는 title 우선', () => {
    expect(parseSharedContent({ title: '타이틀', text: '본문 https://naver.me/abc' })).toEqual({
      sourceUrl: 'https://naver.me/abc',
      sourceText: '타이틀',
    });
  });

  it('http(s) 가 아닌 url 은 버린다', () => {
    expect(parseSharedContent({ title: '제목', url: 'javascript:alert(1)' })).toEqual({
      sourceText: '제목',
    });
    expect(parseSharedContent({ url: 'ftp://example.com' })).toEqual({});
  });

  it('http(s) 스킴은 대소문자를 구분하지 않는다', () => {
    expect(parseSharedContent({ url: 'HTTPS://Example.com' }).sourceUrl).toBe('HTTPS://Example.com');
  });

  it('sourceText 는 500자로 자른다', () => {
    const result = parseSharedContent({ title: 'a'.repeat(600) });
    expect(result.sourceText).toHaveLength(500);
  });

  it('빈 값이면 빈 객체', () => {
    expect(parseSharedContent({ title: '  ', text: null, url: '' })).toEqual({});
  });
});
