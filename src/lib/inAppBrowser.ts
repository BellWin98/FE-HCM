/**
 * 인앱 브라우저(카카오톡·인스타그램·스레드 등) 감지 및 외부 브라우저(사파리/크롬/삼성 인터넷 등
 * OS 기본 브라우저)로 강제 이동시키기 위한 유틸리티.
 *
 * 인앱 브라우저(특히 iOS)는 100vh, safe-area 등 일부 레이아웃이 깨지는 알려진 이슈가 있어
 * 딥링크로 유입된 경우 가능하면 기본 브라우저로 빠져나가도록 유도한다.
 */

export const isKakaoTalkInAppBrowser = (): boolean => /kakaotalk/i.test(navigator.userAgent);

/** 인스타그램 인앱 브라우저(피드/스토리/DM 링크 등에서 열리는 웹뷰). */
export const isInstagramInAppBrowser = (): boolean => /instagram/i.test(navigator.userAgent);

/** 스레드(Threads) 인앱 브라우저. 내부 코드네임인 "Barcelona"가 UA에 포함되는 경우가 있다. */
export const isThreadsInAppBrowser = (): boolean => /threads|barcelona/i.test(navigator.userAgent);

/** 강제 외부 브라우저 이동을 지원/시도할 대상 인앱 브라우저인지 여부. */
export const isInAppBrowser = (): boolean =>
  isKakaoTalkInAppBrowser() || isInstagramInAppBrowser() || isThreadsInAppBrowser();

export const isIos = (): boolean => /iphone|ipad|ipod/i.test(navigator.userAgent);

export const isAndroid = (): boolean => /android/i.test(navigator.userAgent);

/**
 * 카카오톡이 iOS/Android 공통으로 지원하는 전용 스킴으로, 인앱 브라우저를 닫고
 * OS 기본 브라우저(iOS는 사파리, Android는 사용자가 지정한 기본 브라우저·크롬·삼성 인터넷 등)에서
 * 해당 URL을 새로 연다.
 */
export const buildKakaoExternalBrowserUrl = (targetUrl: string): string =>
  `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`;

/**
 * Android용 intent 스킴. 인스타그램·스레드처럼 전용 외부 브라우저 스킴이 없는 인앱 브라우저에서도
 * 크롬(Chrome)으로 URL을 강제로 열도록 유도한다.
 */
export const buildAndroidChromeIntentUrl = (targetUrl: string): string => {
  const withoutScheme = targetUrl.replace(/^https?:\/\//, '');
  return `intent://${withoutScheme}#Intent;scheme=https;package=com.android.chrome;end`;
};

/**
 * 현재 인앱 브라우저 종류/플랫폼에 맞춰 외부 브라우저 강제 이동을 시도한다.
 *
 * @returns 이동 스킴을 실제로 시도했는지 여부. `false`인 경우(주로 iOS의 인스타그램·스레드처럼
 * 프로그래매틱 탈출 스킴이 없는 환경) 호출 측에서 안내 UI로 폴백해야 한다.
 */
export const redirectToExternalBrowser = (targetUrl: string = window.location.href): boolean => {
  // 카카오톡: iOS/Android 공통 전용 스킴 사용.
  if (isKakaoTalkInAppBrowser()) {
    window.location.href = buildKakaoExternalBrowserUrl(targetUrl);
    return true;
  }

  // 인스타그램·스레드: Android는 intent 스킴으로 크롬을 강제 실행할 수 있다.
  if (isAndroid()) {
    window.location.href = buildAndroidChromeIntentUrl(targetUrl);
    return true;
  }

  // iOS의 인스타그램·스레드는 외부 브라우저로 빠져나가는 공개 스킴이 없어 안내 UI로 폴백한다.
  return false;
};
