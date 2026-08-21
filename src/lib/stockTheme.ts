/**
 * 주식 화면에서 공유하는 Tailwind 클래스 토큰.
 * 이전에는 각 컴포넌트가 `dark` boolean prop 을 받아 JS 삼항으로 클래스를 골랐지만,
 * 실제로는 항상 false 로 내려와 다크 스타일이 죽어 있었다. `dark:` 변형으로 통일해
 * 앱 전역 테마 설정을 그대로 따르게 한다.
 */
export const STOCK_CARD_BG = 'bg-white border-gray-200 dark:bg-gray-800/50 dark:border-gray-700';
export const STOCK_TEXT_MUTED = 'text-gray-600 dark:text-gray-400';
export const STOCK_TEXT_PRIMARY = 'text-gray-900 dark:text-gray-100';
export const STOCK_BORDER = 'border-gray-200 dark:border-gray-700';
export const STOCK_ROW_BORDER = 'border border-gray-200 dark:border-gray-700';

/** 선택된 세그먼트 버튼(현재가/평가금, 최신순/오래된순 등)의 반전 배경. */
export const STOCK_SEGMENT_ACTIVE = 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900';
