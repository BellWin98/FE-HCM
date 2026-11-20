import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';

// 번들 크기를 줄이려고 메모에 자주 쓰는 언어만 등록한다. 별칭(js, ts, sh 등)은 각 언어 정의가 함께 등록한다.
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);

/** 등록된 언어면 색을 입힌 HTML(코드는 이스케이프됨), 아니면 null. */
export const highlightCode = (code: string, lang: string | null): string | null => {
  if (!lang || !hljs.getLanguage(lang)) return null;
  return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
};
