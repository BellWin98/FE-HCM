export const HERO_REVEAL_DURATION = 3000;
export const HERO_REVEAL_STAGGER = 500;

/** 상세 기능 쇼케이스: 뷰포트 아래 280px까지 확장해 스크롤 덜 내려도 먼저 노출 */
export const FEATURES_IN_VIEW_OPTIONS: IntersectionObserverInit = {
  rootMargin: '0px 0px 200px 0px',
  threshold: 0,
};
