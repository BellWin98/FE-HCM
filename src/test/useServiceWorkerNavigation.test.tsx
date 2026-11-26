import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { useServiceWorkerNavigation } from '@/hooks/useServiceWorkerNavigation';

const Probe = () => {
  useServiceWorkerNavigation();
  const { pathname } = useLocation();
  return <div data-testid="path">{pathname}</div>;
};

const renderProbe = () =>
  render(
    <MemoryRouter initialEntries={['/start']}>
      <Routes>
        <Route path="*" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  );

const stubServiceWorker = (value: EventTarget | undefined) =>
  Object.defineProperty(navigator, 'serviceWorker', { value, configurable: true });

describe('useServiceWorkerNavigation', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
  });

  it('navigatesOnPushMessage', () => {
    const sw = new EventTarget();
    stubServiceWorker(sw);
    renderProbe();
    act(() => {
      sw.dispatchEvent(new MessageEvent('message', { data: { type: 'PUSH_NAVIGATE', url: '/notes' } }));
    });
    expect(screen.getByTestId('path').textContent).toBe('/notes');
  });

  it('ignoresOtherMessages', () => {
    const sw = new EventTarget();
    stubServiceWorker(sw);
    renderProbe();
    act(() => {
      sw.dispatchEvent(new MessageEvent('message', { data: { type: 'SKIP_WAITING' } }));
    });
    expect(screen.getByTestId('path').textContent).toBe('/start');
  });

  it('removesListenerOnUnmount', () => {
    const sw = new EventTarget();
    stubServiceWorker(sw);
    const { unmount } = renderProbe();
    unmount();
    expect(() =>
      sw.dispatchEvent(new MessageEvent('message', { data: { type: 'PUSH_NAVIGATE', url: '/notes' } })),
    ).not.toThrow();
  });

  it('noServiceWorker_noop', () => {
    stubServiceWorker(undefined);
    expect(() => renderProbe()).not.toThrow();
    expect(screen.getByTestId('path').textContent).toBe('/start');
  });
});
