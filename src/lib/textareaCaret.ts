/**
 * textarea 커서의 세로 위치를 재고 커서가 보이도록 스크롤한다.
 * 브라우저는 사용자가 직접 입력할 때만 커서를 따라 스크롤하고, 코드로 넣은 편집(execCommand·setRangeText)에서는
 * 스크롤하지 않는다. 그래서 Enter 를 가로채 직접 줄바꿈을 넣으면 커서가 칸 아래로 사라진다.
 */

export interface CaretBox {
  top: number;
  bottom: number;
}

interface ScrollView {
  scrollTop: number;
  clientHeight: number;
}

/** 커서(top~bottom, 내용 기준 px)가 보이도록 하는 scrollTop. 이미 보이면 지금 값 그대로. */
export const scrollTopToReveal = (caret: CaretBox, view: ScrollView): number => {
  if (caret.bottom > view.scrollTop + view.clientHeight) return caret.bottom - view.clientHeight;
  if (caret.top < view.scrollTop) return caret.top;
  return view.scrollTop;
};

// 줄바꿈 위치에 영향을 주는 스타일만 거울 textarea 로 옮긴다.
const MIRRORED_STYLES = [
  'boxSizing',
  'width',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'lineHeight',
  'tabSize',
  'textTransform',
  'whiteSpace',
  'wordBreak',
  'overflowWrap',
] as const;

const lineHeightOf = (style: CSSStyleDeclaration): number =>
  parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2 || 20;

/**
 * 커서 줄의 위·아래(textarea 내용 기준 px). 커서 앞 글만 담은 같은 모양의 숨은 textarea 높이로 잰다.
 * 커서 앞 글은 실제 칸과 똑같이 줄바꿈되므로 그 높이가 곧 커서 줄의 아래 끝이다.
 */
export const measureCaret = (textarea: HTMLTextAreaElement): CaretBox => {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement('textarea');
  MIRRORED_STYLES.forEach((prop) => {
    mirror.style[prop] = style[prop] ?? '';
  });
  mirror.style.position = 'absolute';
  mirror.style.top = '-9999px';
  mirror.style.left = '-9999px';
  mirror.style.visibility = 'hidden';
  mirror.style.height = '0';
  mirror.style.overflow = 'hidden';
  mirror.setAttribute('aria-hidden', 'true');
  mirror.tabIndex = -1;
  mirror.value = textarea.value.slice(0, textarea.selectionEnd);
  document.body.appendChild(mirror);
  const bottom = mirror.scrollHeight - (parseFloat(style.paddingBottom) || 0);
  mirror.remove();
  return { top: bottom - lineHeightOf(style), bottom };
};

/** 커서가 칸 밖에 있으면 보이도록 칸을 스크롤한다. */
export const revealCaret = (textarea: HTMLTextAreaElement): void => {
  const next = scrollTopToReveal(measureCaret(textarea), textarea);
  if (next !== textarea.scrollTop) textarea.scrollTop = next;
};
