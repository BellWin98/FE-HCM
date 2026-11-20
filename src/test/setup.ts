import '@testing-library/jest-dom';

// jsdom doesn't implement ResizeObserver; Radix UI primitives (e.g. Switch) rely on it.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom doesn't implement the Pointer Capture APIs or scrollIntoView; Radix UI Select uses both
// while opening its listbox, and without them the trigger click throws instead of opening.
if (typeof Element !== 'undefined' && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}
// jsdom doesn't implement PointerEvent; without it fireEvent.pointer* falls back to a plain Event
// and drops clientX/clientY/button/pointerId, so drag handlers can't be tested.
if (typeof window !== 'undefined' && !window.PointerEvent) {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom doesn't implement matchMedia; several UI components (e.g. use-mobile hook) rely on it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}
