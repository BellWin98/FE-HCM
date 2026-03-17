import { useEffect, useState } from 'react';

/** 토스 스타일: 마운트 시 스태거 페이드인 (히어로 등 첫 화면용) */
export const useHeroReveal = (enabled = true): boolean => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const id = requestAnimationFrame(() => {
      setRevealed(true);
    });
    return () => cancelAnimationFrame(id);
  }, [enabled]);

  return revealed;
};
