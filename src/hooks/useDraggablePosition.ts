import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';

export interface DragPosition {
  left: number;
  top: number;
}

/** 이만큼 움직이기 전까지는 손떨림으로 보고 탭으로 처리한다. */
const DRAG_THRESHOLD = 8;
/** 화면 가장자리와 띄울 최소 간격. */
const EDGE_MARGIN = 8;

const readStored = (key: string): DragPosition | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const pos = parsed as Partial<DragPosition> | null;
    if (typeof pos?.left !== 'number' || typeof pos?.top !== 'number') return null;
    return { left: pos.left, top: pos.top };
  } catch {
    return null;
  }
};

const writeStored = (key: string, pos: DragPosition): void => {
  try {
    localStorage.setItem(key, JSON.stringify(pos));
  } catch {
    // 사파리 개인 정보 보호 모드 등 저장소를 못 쓰면 이번 세션 동안만 유지한다.
  }
};

const clamp = (pos: DragPosition, width: number, height: number, topInset: number): DragPosition => {
  const minTop = topInset + EDGE_MARGIN;
  const maxLeft = Math.max(EDGE_MARGIN, window.innerWidth - width - EDGE_MARGIN);
  const maxTop = Math.max(minTop, window.innerHeight - height - EDGE_MARGIN);
  return {
    left: Math.min(Math.max(pos.left, EDGE_MARGIN), maxLeft),
    top: Math.min(Math.max(pos.top, minTop), maxTop),
  };
};

export interface DraggablePositionOptions {
  /**
   * 화면 위쪽에서 비워 둘 높이(px). 끌 때마다 다시 읽는다.
   * 고정 헤더처럼 더 높은 z-index 로 덮는 요소가 있으면 그 아래로만 옮길 수 있게 한다 — 뒤로 숨으면 다시 잡을 수 없다.
   */
  getTopInset?: () => number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  moved: boolean;
}

export interface DraggablePosition {
  /** 사용자가 옮긴 자리. 아직 옮긴 적이 없으면 null(기본 자리 사용). */
  position: DragPosition | null;
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
    /** 끌어서 옮긴 직후 브라우저가 보내는 click 을 삼킨다. */
    onClickCapture: (event: ReactMouseEvent<HTMLElement>) => void;
  };
}

/**
 * 화면에 고정(fixed)된 요소를 포인터로 끌어 옮기고, 옮긴 자리를 `storageKey` 로 기억한다.
 * 위치는 뷰포트 기준 left/top(px)이며, 화면 밖으로 나가지 않게 붙잡는다.
 */
export const useDraggablePosition = (
  storageKey: string,
  { getTopInset }: DraggablePositionOptions = {},
): DraggablePosition => {
  const [position, setPosition] = useState<DragPosition | null>(() => readStored(storageKey));
  const getTopInsetRef = useRef(getTopInset);
  getTopInsetRef.current = getTopInset;
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const sizeRef = useRef({ width: 56, height: 56 });
  const lastPositionRef = useRef<DragPosition | null>(null);

  const clampToScreen = useCallback(
    (pos: DragPosition, width: number, height: number): DragPosition =>
      clamp(pos, width, height, getTopInsetRef.current?.() ?? 0),
    [],
  );

  // 처음 그릴 때(예전에 헤더 밑으로 저장된 자리 포함)와 화면 회전·크기 변경 후에도
  // 버튼이 화면 밖이나 헤더 뒤에 남지 않게 다시 붙잡는다.
  const hasPosition = position !== null;
  useEffect(() => {
    if (!hasPosition) return;
    const handleResize = (): void => {
      setPosition((prev) => {
        if (!prev) return prev;
        const next = clampToScreen(prev, sizeRef.current.width, sizeRef.current.height);
        return next.left === prev.left && next.top === prev.top ? prev : next;
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasPosition, clampToScreen]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLElement>): void => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width || sizeRef.current.width;
    const height = rect.height || sizeRef.current.height;
    sizeRef.current = { width, height };
    suppressClickRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width,
      height,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLElement>): void => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved) {
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (distance < DRAG_THRESHOLD) return;
      drag.moved = true;
    }
    const next = clampToScreen(
      { left: event.clientX - drag.offsetX, top: event.clientY - drag.offsetY },
      drag.width,
      drag.height,
    );
    lastPositionRef.current = next;
    setPosition(next);
  }, [clampToScreen]);

  const finishDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>): void => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (!drag.moved) return;
      suppressClickRef.current = true;
      if (lastPositionRef.current) writeStored(storageKey, lastPositionRef.current);
    },
    [storageKey],
  );

  const handleClickCapture = useCallback((event: ReactMouseEvent<HTMLElement>): void => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    position,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
      onClickCapture: handleClickCapture,
    },
  };
};
