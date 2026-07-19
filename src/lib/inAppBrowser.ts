/**
 * 카카오톡 인앱 브라우저 감지 및 외부 브라우저(사파리/크롬/삼성 인터넷 등 OS 기본 브라우저)로
 * 강제 이동시키기 위한 유틸리티.
 *
 * 카카오톡 인앱 브라우저(iOS)는 100vh, safe-area 등 일부 레이아웃이 깨지는 알려진 이슈가 있어
 * 딥링크로 유입된 경우 가능하면 기본 브라우저로 빠져나가도록 유도한다.
 */

export const isKakaoTalkInAppBrowser = (): boolean => /kakaotalk/i.test(navigator.userAgent);

export const isIos = (): boolean => /iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * 카카오톡이 iOS/Android 공통으로 지원하는 전용 스킴으로, 인앱 브라우저를 닫고
 * OS 기본 브라우저(iOS는 사파리, Android는 사용자가 지정한 기본 브라우저·크롬·삼성 인터넷 등)에서
 * 해당 URL을 새로 연다.
 */
export const buildKakaoExternalBrowserUrl = (targetUrl: string): string =>
  `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`;

export const redirectToExternalBrowser = (targetUrl: string = window.location.href): void => {
  window.location.href = buildKakaoExternalBrowserUrl(targetUrl);
};
