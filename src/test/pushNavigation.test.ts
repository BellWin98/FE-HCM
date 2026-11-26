import { describe, expect, it, vi } from 'vitest';
import { PUSH_NAVIGATE, pushToastOptions, toPushUrl } from '@/lib/pushNavigation';

describe('toPushUrl', () => {
  it('toPushUrl_empty_returnsRoot', () => {
    expect(toPushUrl('')).toBe('/');
    expect(toPushUrl(undefined)).toBe('/');
    expect(toPushUrl(null)).toBe('/');
  });

  it('toPushUrl_keepsAppPath', () => {
    expect(toPushUrl('/notes')).toBe('/notes');
  });

  it('toPushUrl_rejectsExternal', () => {
    expect(toPushUrl('https://evil.com')).toBe('/');
    expect(toPushUrl('//evil.com')).toBe('/');
    expect(toPushUrl('/\\evil.com')).toBe('/');
    expect(toPushUrl('notes')).toBe('/');
  });
});

describe('pushToastOptions', () => {
  it('pushToastOptions_withPath_actionNavigates', () => {
    const navigate = vi.fn();
    const options = pushToastOptions({ body: 'b', path: '/notes' }, navigate);
    expect(options.description).toBe('b');
    expect(options.duration).toBe(2000);
    expect(options.action?.label).toBe('보기');
    options.action?.onClick();
    expect(navigate).toHaveBeenCalledWith('/notes');
  });

  it('pushToastOptions_noPath_noAction', () => {
    const options = pushToastOptions({ body: 'b', path: '' }, vi.fn());
    expect(options.action).toBeUndefined();
  });

  it('exposes message type constant', () => {
    expect(PUSH_NAVIGATE).toBe('PUSH_NAVIGATE');
  });
});
