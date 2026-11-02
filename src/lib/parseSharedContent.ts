const MAX_SOURCE_TEXT_LENGTH = 500;
const HTTP_URL = /^https?:\/\//i;
const HTTP_URL_IN_TEXT = /https?:\/\/\S+/i;

interface SharedContentInput {
  title?: string | null;
  text?: string | null;
  url?: string | null;
}

interface SharedContent {
  sourceUrl?: string;
  sourceText?: string;
}

/**
 * Web Share Target 으로 들어온 title/text/url 을 메모의 출처(sourceUrl/sourceText)로 변환한다.
 * Android 공유 시트는 URL 을 `url` 이 아니라 `text` 에 "제목 URL" 형태로 싣는 경우가 많다.
 */
export const parseSharedContent = ({ title, text, url }: SharedContentInput): SharedContent => {
  const trimmedTitle = title?.trim() ?? '';
  const trimmedUrl = url?.trim() ?? '';
  let remainingText = text?.trim() ?? '';

  let sourceUrl = HTTP_URL.test(trimmedUrl) ? trimmedUrl : undefined;
  if (!sourceUrl) {
    const match = remainingText.match(HTTP_URL_IN_TEXT);
    if (match) {
      sourceUrl = match[0];
      remainingText = remainingText.replace(match[0], '').trim();
    }
  }

  const sourceText = (trimmedTitle || remainingText).slice(0, MAX_SOURCE_TEXT_LENGTH);

  const result: SharedContent = {};
  if (sourceUrl) result.sourceUrl = sourceUrl;
  if (sourceText) result.sourceText = sourceText;
  return result;
};
