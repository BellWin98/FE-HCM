# 메모 코드 작성 개선 (FE) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메모 내용 칸에서 코드를 쉽게 적을 수 있게 한다(자동 들여쓰기, 들여쓰기 도구줄, Tab). 읽을 때는 ` ``` ` 코드블록에 색 강조와 복사 버튼을 붙여 깔끔하게 보이게 한다.

**Architecture:**
- 텍스트 편집 규칙은 순수 함수(`src/lib/codeEditing.ts`)로 둔다. 이 함수들은 `TextEdit`(어느 범위를 무엇으로 바꾸고 커서를 어디 둘지)을 돌려준다.
- 훅 `useCodeTextarea`가 이 편집을 Textarea에 적용하고, `beforeinput`·키 이벤트를 연결한다.
- 보기 쪽은 순수 파서(`src/lib/noteContent.ts`)가 내용을 글/코드 조각으로 나눈다. `NoteContent` 컴포넌트가 조각을 그리고, 코드 조각만 highlight.js로 색을 입힌다.
- 저장 형식은 그대로 평문이다.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind, shadcn/ui, Vitest + RTL(jsdom), highlight.js 11 (core + 언어 6종).

**Spec:** `docs/superpowers/specs/2026-11-20-note-code-editing-design.md`
**짝 계획:** `../BE-HCM/docs/superpowers/plans/2026-11-20-note-content-limit-be.md`. 그 BE가 먼저 배포돼야 2000자를 넘는 메모가 저장된다.

## Global Constraints

- 들여쓰기 단위는 공백 2칸이다(`INDENT_UNIT = '  '`).
- 한 단계 더 들여쓰는 경우: 커서 앞 줄 내용이 `{` `(` `[`, 또는 단어 `BEGIN`·`THEN`(대소문자 무시)으로 끝날 때(뒤 공백은 무시).
- Enter 처리는 `beforeinput`의 `inputType`이 `insertLineBreak` 또는 `insertParagraph`일 때만 한다. `isComposing`이면 손대지 않는다. Ctrl/⌘+Enter는 지금처럼 폼 저장이다.
- **미리보기 토글은 만들지 않는다.** 일반 글 서식(굵게·목록 등)도 없다. 펜스(` ``` `)만 해석한다.
- 색 강조 언어는 sql, java, javascript, typescript, json, bash(highlight.js 기본 별칭 포함: js, ts, sh 등)다. 그 밖의 언어나 언어 미지정은 색 없이 고정폭으로 보인다.
- `dangerouslySetInnerHTML`은 highlight.js 출력에만 쓴다.
- 내용 최대 길이는 `MAX_NOTE_CONTENT_LENGTH = 10000`이다. 초과 시 오류 문구는 `내용은 10000자 이하로 입력해주세요`다.
- 도구줄 버튼의 접근 이름은 `코드블록 넣기`, `들여쓰기`, `내어쓰기`다. 아이콘은 lucide `Code`, `IndentIncrease`, `IndentDecrease`를 쓴다.
- 코드 복사 버튼의 접근 이름은 `코드 복사`다. 성공하면 2초간 `복사됨`, 실패하면 `복사 실패`를 보여 준다.
- 작업 순서: 시작 전에 FE 저장소에 GitHub 이슈를 만든다. 브랜치는 `feature/issue-{n}`이다. 커밋은 한국어로 쓰고 끝에 `(#{n})`을 붙인다. PR base는 `main`이다. 스펙 문서(`docs/superpowers/specs/…`)와 이 계획도 첫 커밋에 넣는다.
- 검증 명령은 `npx tsc -b && npm run lint && npm test`다(`tsc --noEmit` 금지).
- Tailwind 유틸리티만 쓴다. highlight.js 토큰 색만 `src/index.css`의 `@layer base`에 `@apply`로 정의한다(전역 기본 스타일 예외).

## Review Focus

1. **닫히지 않은 펜스**(` ```sql`만 있고 닫는 줄이 없음): 나머지 전부를 코드로 보여 줘야 하고, 화면이 깨지거나 펜스 줄이 글로 남으면 안 된다. → Task 3 테스트
2. **아주 긴 코드 한 줄**(공백 없는 300자): 카드나 시트 폭을 넓히지 않고 코드블록 안에서만 가로 스크롤돼야 한다. → Task 4 테스트(`pre`에 `overflow-x-auto`, 래퍼에 `min-w-0`)
3. **HTML이 섞인 코드**(`<script>alert(1)</script>`를 ` ```js ` 안이나 언어 없이 적음): 실행되지 않고 글자로 보여야 한다. → Task 4 테스트
4. **선택 영역이 여러 줄이고 일부 줄은 들여쓰기가 1칸뿐일 때 내어쓰기**: 있는 만큼만(최대 2칸) 지우고, 공백이 없는 줄은 그대로 두며, 선택 범위가 옮겨진 줄 전체를 계속 덮어야 한다. → Task 1 테스트
5. **Esc로 다이얼로그가 닫혀 쓰던 메모가 날아가는 것**: 내용 칸에 포커스가 있을 때 Esc는 다이얼로그를 닫지 않고, "다음 Tab은 칸 이동" 모드만 켠다. *(설계 보완 — 내 판단: 스펙의 Esc 탈출과 지금의 Esc 닫기가 충돌한다)* → Task 2 테스트

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/lib/codeEditing.ts` (신규) | 순수 편집 규칙: 줄바꿈 들여쓰기, 줄 단위 들여쓰기·내어쓰기, 펜스 삽입 |
| `src/hooks/useCodeTextarea.ts` (신규) | `TextEdit`을 textarea에 적용(undo 보존), `beforeinput`·Tab·Esc 연결 |
| `src/components/knowledge/CodeEditToolbar.tsx` (신규) | 도구줄 버튼 3개(포커스 유지) |
| `src/lib/noteContent.ts` (신규) | 펜스 파싱(`parseNoteContent`), 펜스 줄 제거(`stripFenceLines`) |
| `src/lib/highlight.ts` (신규) | highlight.js core 등록 + `highlightCode` |
| `src/components/knowledge/NoteContent.tsx` (신규) | 글/코드 조각 렌더, 코드 복사 |
| `src/components/knowledge/KnowledgeNoteFormDialog.tsx` | 훅·도구줄 연결, Esc 처리, 글자 수 제한 |
| `src/components/knowledge/KnowledgeNoteCard.tsx`, `StockNotesPanel.tsx`, `noteHeadline.ts` | 본문을 `NoteContent`로 그리고, 미리보기에서 펜스 줄 제거 |
| `src/types/knowledgeNote.ts` | `MAX_NOTE_CONTENT_LENGTH` |
| `src/index.css` | hljs 토큰 색(라이트/다크) |

---

### Task 1: 편집 규칙 순수 함수

**Files:**
- Create: `src/lib/codeEditing.ts`
- Test: `src/test/codeEditing.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const INDENT_UNIT = '  ';
  /** value[start, end) 를 text 로 바꾸고, 바꾼 뒤 선택을 [selectionStart, selectionEnd] 로 둔다(바뀐 뒤 문자열 기준). */
  export interface TextEdit { start: number; end: number; text: string; selectionStart: number; selectionEnd: number }
  export const newlineEdit: (value: string, selStart: number, selEnd: number) => TextEdit;
  export const indentEdit: (value: string, selStart: number, selEnd: number, direction: 'in' | 'out') => TextEdit | null;
  export const fenceEdit: (value: string, selStart: number, selEnd: number) => TextEdit;
  ```

- [ ] **Step 1: 실패하는 테스트 작성.** 아래 표는 `|`가 커서, `[ ]`가 선택 범위다. 기대값은 편집을 적용한 결과 문자열과 커서 위치다(테스트 안에서 `apply(value, edit)` 헬퍼로 계산).
  - `newlineEdit` — 일반 줄바꿈은 윗줄 들여쓰기를 유지:
    - `"  SELECT *|"` → `"  SELECT *\n  |"`
    - `"if (a) {|"` → `"if (a) {\n  |"`
    - `"    foo(|"` → `"    foo(\n      |"`
    - `"BEGIN|"`, `"case when x then|"`(소문자 then) → 각각 다음 줄이 INDENT_UNIT 한 단계 더 들여써짐
    - `"{  |"`(여는 괄호 뒤 공백) → 한 단계 더
    - `"THENCE|"` → 추가 들여쓰기 **없음**(단어 경계)
    - `"plain|"` → `"plain\n|"`
    - 선택 영역이 있을 때 `"ab[cd]ef"` → 선택이 지워지고 줄바꿈이 들어간다: `"ab\n|ef"`
    - 커서가 줄 중간에 있을 때는 들여쓰기만 커서 앞 기준으로 이어진다: `"  ab|cd"` → `"  ab\n  |cd"`
  - `indentEdit` — 줄 단위:
    - `'in'`, 커서만: `"a\nb|c"` → `"a\n  bc"`, 커서는 `b` 뒤 그대로(+2)
    - `'in'`, 두 줄 선택 `"[a\nb]"` → `"  a\n  b"`, 선택이 두 줄 전체(0..7)를 덮음
    - `'out'`: `"    a|"` → `"  a"`. `" a"`(1칸) → `"a"`. `"a"`(공백 없음) → `null`
    - Review Focus 4: `'out'`, 선택 `"[  a\n b\nc]"` → `"a\nb\nc"`, 선택은 0..5
  - `fenceEdit`:
    - 빈 칸 `"|"` → `` "```\n|\n```" ``
    - 줄 중간 `"abc|"` → `` "abc\n```\n|\n```" ``(앞에 줄바꿈 추가)
    - 선택 `` "[SELECT 1]" `` → `` "```\nSELECT 1\n```" ``. 커서는 첫 `` ``` `` 바로 뒤(위치 3, 언어를 바로 적을 수 있게)
- [ ] **Step 2: 실패 확인.** `npx vitest run src/test/codeEditing.test.ts` → FAIL(모듈 없음)
- [ ] **Step 3: 구현.**
  - 추가 들여쓰기 판정은 커서 앞 줄 텍스트에 `/(?:[{(\[]|\b(?:BEGIN|THEN))\s*$/i`를 적용한다.
  - 줄 단위 편집은 선택 범위를 줄 시작~줄 끝으로 넓혀서 한 개의 `TextEdit`으로 만든다. 그래야 undo 한 번으로 되돌아간다.
- [ ] **Step 4: 통과 확인.** 같은 명령 → PASS
- [ ] **Step 5: Commit** — `feat: 메모 코드 편집 규칙(자동 들여쓰기·펜스) 추가 (#{n})`

### Task 2: 내용 칸에 편집 기능 연결 (훅 + 도구줄 + Esc)

**Files:**
- Create: `src/hooks/useCodeTextarea.ts`, `src/components/knowledge/CodeEditToolbar.tsx`
- Modify: `src/components/knowledge/KnowledgeNoteFormDialog.tsx`
  - 내용 `Textarea` 주변(~384행)에 도구줄을 둔다.
  - `DialogContent`·`SheetContent`에 `onEscapeKeyDown`을 단다.
- Test: `src/test/codeTextarea.test.tsx`

**Interfaces:**
- Consumes: Task 1의 `TextEdit`, `newlineEdit`, `indentEdit`, `fenceEdit`
- Produces:
  ```ts
  export const applyTextEdit: (textarea: HTMLTextAreaElement, edit: TextEdit) => void;
  export const useCodeTextarea: (ref: RefObject<HTMLTextAreaElement>) => {
    handleKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
    insertFence: () => void;
    indent: () => void;
    outdent: () => void;
  };
  // CodeEditToolbar props
  interface CodeEditToolbarProps { onInsertFence: () => void; onIndent: () => void; onOutdent: () => void; disabled?: boolean }
  ```

- [ ] **Step 1: 실패하는 테스트 작성.** 파일 상단에서 `@/lib/api`를 `vi.mock`한다(기존 `quickNoteDialog.test.tsx` 패턴). 폼을 열고 `getByRole('textbox', { name: '내용' })`로 내용 칸을 잡는다.
  - `enter_keeps_indent`: 값 `"  a"`, 커서는 끝이다. `fireEvent(textarea, new InputEvent('beforeinput', { inputType: 'insertLineBreak', bubbles: true, cancelable: true }))`를 보낸다. 값이 `"  a\n  "`이고 이벤트가 `defaultPrevented`인지 확인한다.
  - `enter_while_composing_is_untouched`: 같은 이벤트에 `isComposing: true`를 준다. 값이 그대로이고 `defaultPrevented === false`인지 확인한다.
  - `tab_indents_and_shift_tab_outdents`: `keyDown Tab` → 줄 앞에 2칸이 생긴다. `keyDown Tab shiftKey` → 2칸이 지워진다. 두 경우 모두 포커스는 내용 칸에 남는다.
  - `escape_then_tab_moves_focus`: `keyDown Escape` 다음 `keyDown Tab` → 값이 그대로이고 기본 동작이 막히지 않는다(`fireEvent.keyDown`의 반환값이 `true`).
  - `escape_in_content_does_not_close_dialog`: 내용 칸에서 Escape를 눌러도 다이얼로그(`getByRole('dialog')`)가 남아 있는지 확인한다(Review Focus 5).
  - `toolbar_inserts_fence_and_keeps_focus`: `코드블록 넣기` 버튼을 누르면 값이 `` "```\n\n```" ``가 되고 `document.activeElement`가 내용 칸인지 확인한다. 같은 방식으로 `들여쓰기`·`내어쓰기` 버튼도 하나씩 확인한다.
  - `onChange_reflects_edit`: 위 편집 뒤 저장 버튼을 누르면 `api.createKnowledgeNote`가 편집된 `content`(trim 적용)로 호출되는지 확인한다. 이 테스트로 React 상태까지 갱신됐는지 검증한다.
- [ ] **Step 2: 실패 확인.** `npx vitest run src/test/codeTextarea.test.tsx` → FAIL
- [ ] **Step 3: 구현.**
  - `applyTextEdit`
    - 먼저 `setSelectionRange(start, end)`를 하고, `document.execCommand?.('insertText', false, text)`를 시도한다. undo 기록을 살리기 위해서다.
    - false이거나 함수가 없으면(jsdom 포함) `textarea.setRangeText(text, start, end)` 뒤에 `textarea.dispatchEvent(new Event('input', { bubbles: true }))`를 보내 React `onChange`가 불리게 한다.
    - 마지막에 `setSelectionRange(selectionStart, selectionEnd)`를 한다.
    - 주의: `text`가 빈 문자열이면 execCommand insertText가 실패할 수 있다. 이때는 `'delete'`로 처리하거나 폴백한다.
  - `beforeinput`: React `onBeforeInput`은 `inputType`을 주지 않는다. 그래서 `useEffect`에서 `ref.current.addEventListener('beforeinput', …)`로 네이티브 리스너를 단다.
  - Esc 처리
    - `handleKeyDown`에서 Escape는 `escapeArmedRef = true`로 만들고, 다른 키는 그 플래그를 끈다. Tab은 플래그가 켜져 있으면 끄고 기본 동작에 맡긴다.
    - 다이얼로그 쪽 `onEscapeKeyDown`은 `event.target === contentRef.current`일 때 `preventDefault()`를 한다(Dialog·Sheet 둘 다).
  - 도구줄
    - 내용 라벨 줄 오른쪽에 `size="icon"` ghost 버튼 3개를 둔다.
    - 각 버튼은 `onMouseDown={(e) => e.preventDefault()}`로 포커스와 모바일 키보드를 유지한다.
    - `mutation.isPending` 동안은 `disabled`다.
- [ ] **Step 4: 통과 확인.** 해당 테스트 + 기존 `quickNoteDialog.test.tsx` → PASS
- [ ] **Step 5: Commit** — `feat: 메모 내용 칸에 자동 들여쓰기·코드 도구줄 추가 (#{n})`

### Task 3: 펜스 파서와 미리보기 문구

**Files:**
- Create: `src/lib/noteContent.ts`
- Modify: `src/components/knowledge/noteHeadline.ts`
- Test: `src/test/noteContent.test.ts`, `src/test/noteHeadline.test.ts`(케이스 추가)

**Interfaces:**
- Produces:
  ```ts
  export type NoteSegment = { kind: 'text'; text: string } | { kind: 'code'; lang: string | null; code: string };
  export const parseNoteContent: (content: string) => NoteSegment[];
  export const stripFenceLines: (content: string) => string;
  ```

- [ ] **Step 1: 실패하는 테스트 작성.**
  - `parseNoteContent("메모\n```sql\nSELECT 1\n```\n끝")`의 결과는 `[{text:'메모'}, {code:'SELECT 1', lang:'sql'}, {text:'끝'}]`이다. 펜스와 붙은 줄바꿈 하나씩은 글 조각에서 빠진다.
  - 언어 없는 펜스는 `lang: null`이다. 언어 이름은 소문자로 바꾼다(` ```SQL ` → `'sql'`).
  - 코드 안의 앞 공백과 빈 줄은 그대로 보존된다(`"```\n  a\n\n  b\n```"` → code `"  a\n\n  b"`).
  - Review Focus 1: `"앞\n```js\nconst a = 1;"`(닫는 줄 없음) → `[{text:'앞'}, {code:'const a = 1;', lang:'js'}]`
  - 줄 중간의 ` ``` `는 펜스가 아니다(`"a ``` b"` → 글 하나).
  - 펜스가 없으면 글 하나를 그대로 돌려준다. 빈 글 조각은 만들지 않는다.
  - `stripFenceLines("```sql\nSELECT 1\n```")`의 결과는 `"SELECT 1"`이다.
  - `noteHeadline({ title: null, content: "```sql\nSELECT 1\n```" })`의 결과는 `{ text: 'SELECT 1', kind: 'content' }`이다.
- [ ] **Step 2: 실패 확인.** `npx vitest run src/test/noteContent.test.ts src/test/noteHeadline.test.ts` → FAIL
- [ ] **Step 3: 구현.**
  - 줄 단위로 훑는다. 여는 줄 패턴은 `/^\s*```\s*([\w+#.-]*)\s*$/`, 닫는 줄 패턴은 `/^\s*```\s*$/`다.
  - `noteHeadline`은 `stripFenceLines` 결과에서 첫 비어 있지 않은 줄을 고른다.
- [ ] **Step 4: 통과 확인.** 같은 명령 → PASS
- [ ] **Step 5: Commit** — `feat: 메모 내용 코드블록 파서 추가 (#{n})`

### Task 4: 코드블록 렌더링(색 강조 + 복사)

**Files:**
- Install: `npm install highlight.js@11.11.1`
  - 설치 전에 `git status`로 `package-lock.json`에 다른 변경이 없는지 확인한다. 있으면 멈추고 사용자에게 묻는다.
- Create: `src/lib/highlight.ts`, `src/components/knowledge/NoteContent.tsx`
- Modify:
  - `src/index.css`: `@layer base`에 `.hljs-keyword` `.hljs-string` `.hljs-number` `.hljs-comment` `.hljs-title` `.hljs-built_in`/`.hljs-literal` `.hljs-type`의 라이트/다크(`.dark`) 색을 `@apply`로 정의한다.
  - `KnowledgeNoteCard.tsx:161`: `<p className="whitespace-pre-wrap…">`를 `<NoteContent content={note.content} />`로 바꾼다.
  - `StockNotesPanel.tsx:79-82`: 펼쳤을 때는 `NoteContent`로 그린다. 접혔을 때는 지금 `<p … line-clamp-2>`에 `stripFenceLines(note.content)`를 넣는다.
- Test: `src/test/noteContent.render.test.tsx`

**Interfaces:**
- Consumes: Task 3의 `parseNoteContent`, `stripFenceLines`
- Produces:
  ```ts
  /** 등록된 언어면 이스케이프된 HTML, 아니면 null. */
  export const highlightCode: (code: string, lang: string | null) => string | null;
  export const NoteContent: (props: { content: string; className?: string }) => JSX.Element;
  ```

- [ ] **Step 1: 실패하는 테스트 작성.**
  - `renders_code_block`: 펜스가 있는 내용이면 `container.querySelector('pre code')`의 textContent가 코드와 같다. 글 조각은 `whitespace-pre-wrap` 요소로 그려진다.
  - `highlights_known_language`: ` ```sql\nSELECT 1\n``` `이면 `.hljs-keyword` 요소가 있다. ` ```kotlin `처럼 등록되지 않은 언어는 `.hljs-keyword`가 없고 코드는 그대로 보인다.
  - Review Focus 3, `escapes_html`: ` ```js\n<script>alert(1)</script>\n``` `과 언어 없는 경우 둘 다 확인한다. `container.querySelector('script')`가 null이고 textContent에 `<script>`가 글자로 들어 있어야 한다.
  - Review Focus 2, `long_line_scrolls`: `pre`에 `overflow-x-auto` 클래스가 있고, `NoteContent` 루트에 `min-w-0` 클래스가 있다.
  - `copy_button`
    - `navigator.clipboard.writeText`를 `vi.fn().mockResolvedValue(undefined)`로 대체한다.
    - `코드 복사` 버튼을 누르면 코드 문자열로 호출되고 `복사됨`이 보인다.
    - reject로 바꾸면 `복사 실패`가 보인다.
  - `KnowledgeNoteCard`의 기존 테스트가 계속 통과해야 한다(펼친 본문의 텍스트).
- [ ] **Step 2: 실패 확인.** `npx vitest run src/test/noteContent.render.test.tsx` → FAIL
- [ ] **Step 3: 구현.**
  - `highlight.ts`는 `highlight.js/lib/core`에 `languages/{sql,java,javascript,typescript,json,bash}`를 등록한다.
  - 하이라이트는 `hljs.getLanguage(lang)`이 있을 때만 `hljs.highlight(code, { language, ignoreIllegals: true }).value`로 한다.
  - 코드 블록 마크업: `<div className="relative min-w-0"><pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs"><code className="font-mono">…</code></pre>`에 복사 버튼을 우상단에 둔다.
- [ ] **Step 4: 통과 확인.** `npx tsc -b && npm run lint && npm test` → 전부 PASS
- [ ] **Step 5: Commit** — `feat: 메모 코드블록 색 강조·복사 버튼 추가 (#{n})`

### Task 5: 내용 글자 수 제한(10000자)

**Files:**
- Modify:
  - `src/types/knowledgeNote.ts`(~35행 근처): `MAX_NOTE_CONTENT_LENGTH`를 추가한다.
  - `KnowledgeNoteFormDialog.tsx`: `handleSubmit`과 내용 칸 아래 영역을 고친다.
- Test: `src/test/quickNoteDialog.test.tsx`(케이스 추가)

**Interfaces:**
- Produces: `export const MAX_NOTE_CONTENT_LENGTH = 10000;`

- [ ] **Step 1: 실패하는 테스트 작성.**
  - `shows_counter_near_limit`
    - 내용이 9000자 이하면 카운터가 보이지 않는다.
    - 9001자면 `9001 / 10000`이 보인다.
  - `blocks_save_over_limit`
    - 10001자 상태에서 저장을 누르면 `role="alert"`에 `내용은 10000자 이하로 입력해주세요 (1자 초과)`가 뜨고 `api.createKnowledgeNote`가 호출되지 않는다.
    - 정확히 10000자는 저장된다.
  - 긴 입력은 `fireEvent.change`로 넣는다(`userEvent.type`은 느리다).
- [ ] **Step 2: 실패 확인.** `npx vitest run src/test/quickNoteDialog.test.tsx` → FAIL
- [ ] **Step 3: 구현.**
  - 판정은 `content.trim().length`로 한다. 서버로 보내는 값과 같은 기준이다.
  - 카운터는 원문 길이로, 9000자 초과일 때만 보인다. 클래스는 `text-xs text-muted-foreground`이고, 초과하면 `text-destructive`다.
  - 오류는 기존 `contentError`를 재사용한다.
- [ ] **Step 4: 통과 확인.** `npx tsc -b && npm run lint && npm test` → 전부 PASS
- [ ] **Step 5: Commit** — `feat: 메모 내용 10000자 제한과 글자 수 표시 추가 (#{n})`

### Task 6: 실기기 확인 (수동)

자동 테스트로는 IME와 모바일 키보드 동작을 확인할 수 없다.

- [ ] **Step 1:** `npm run dev`로 띄우고 폰(같은 네트워크)으로 접속한다. 안드로이드 Chrome(삼성 키보드, Gboard)과 iOS Safari에서 확인한다.
  - 한글을 쓰다가 Enter를 치면 줄이 한 번만 바뀌고 들여쓰기가 이어진다.
  - 도구줄 버튼을 눌러도 키보드가 내려가지 않는다.
  - 코드블록이 가로로 스크롤된다.
- [ ] **Step 2:** PC Chrome에서 Tab/Shift+Tab, Esc→Tab, Ctrl+Z 한 번으로 자동 들여쓰기가 되돌아가는지 확인한다.
- [ ] **Step 3:** 문제가 있으면 기록하고 사용자에게 알린다. 키보드별 차이는 스펙 범위를 넘는 수정일 수 있으니 임의로 고치지 않는다.
