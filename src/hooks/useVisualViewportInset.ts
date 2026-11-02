import { useEffect, useState } from 'react';

export interface VisualViewportInset {
  /** 레이아웃 뷰포트 아래쪽에서 화면에 보이지 않는 높이(주로 가상 키보드). */
  bottom: number;
  /** 지금 화면에 보이는 높이. visualViewport 를 지원하지 않으면 null. */
  height: number | null;
}

const NO_INSET: VisualViewportInset = { bottom: 0, height: null };

/**
 * 가상 키보드가 가린 아래쪽 높이와 보이는 높이를 따라간다.
 * Android Chrome 은 키보드가 올라와도 레이아웃 뷰포트(dvh, fixed bottom-0)를 줄이지 않으므로
 * 아래에 붙는 시트는 이 값으로 키보드 위에 다시 맞춰야 한다.
 */
export function useVisualViewportInset(enabled: boolean): VisualViewportInset {
  const [inset, setInset] = useState<VisualViewportInset>(NO_INSET);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!enabled || !viewport) {
      setInset(NO_INSET);
      return;
    }

    const update = (): void => {
      const bottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setInset({ bottom, height: viewport.height });
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return inset;
}
