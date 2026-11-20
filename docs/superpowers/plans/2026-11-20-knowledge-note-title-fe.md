# 지식 메모 제목 + 접힌 목록 (FE) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메모 작성 폼에 선택 입력 제목을 추가하고, 지식 메모 목록 카드를 기본 접힘(2줄)으로 바꿔 한 화면에 많은 메모가 보이게 한다.

**Architecture:** 타입·폼·공유 prefill 에 `title` 추가. 접힌 줄에 보일 문구는 순수 함수 `noteHeadline` 로 분리하고, `KnowledgeNoteCard` 는 카드별 `expanded` state 로 접힌 줄/전체 본문을 전환한다. `StockNotesPanel` 은 제목 한 줄만 추가.

**Tech Stack:** React + TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query, Vitest + Testing Library.

**Spec:** `../BE-HCM/docs/superpowers/specs/2026-11-20-knowledge-note-title-design.md`
**짝 계획:** `../BE-HCM/docs/superpowers/plans/2026-11-20-knowledge-note-title-be.md` — 응답에 `title` 이 생기는 BE 가 먼저 배포돼야 한다(구 BE 는 `title` 을 무시하므로 FE 먼저 배포돼도 깨지지는 않지만 제목이 저장되지 않는다).

## Global Constraints

- 제목은 선택, 최대 100자(`MAX_NOTE_TITLE_LENGTH = 100`). 라벨 `제목 (선택)`, 입력 칸 접근 이름 `제목`.
- 빠른 메모 열릴 때 포커스는 지금처럼 **내용** 칸(제목 칸 아님) — 빠른 입력 속도 유지.
- 접힌 줄 문구 우선순위: 제목 → 내용의 첫 번째 비어 있지 않은 줄 → `이미지 메모`.
- 펼침 상태는 카드별 로컬 state, 저장하지 않음. 검색 중에도 기본 접힘.
- 펼친 본문에서는 내용을 4줄로 자르지 않는다(`내용 더보기`/`내용 접기` 제거).
- 시작 전 FE 저장소에 GitHub 이슈를 만들고, 브랜치 `feature/issue-195`, 커밋 메시지는 한국어 + 끝에 `(#195)`. PR base 는 `main`.
- 작업 트리의 기존 `package-lock.json` 변경은 건드리지도 커밋하지도 않는다.
- 검증은 `npx tsc -b && npm run lint && npm test` (`tsc --noEmit` 금지 — CLAUDE.md). 테스트 fixture 에 `title` 이 빠지면 `tsc -b` 가 잡는다.

## Review Focus

1. 띄어쓰기 없는 아주 긴 제목·첫 줄 → 한 줄로 잘리고 가로 스크롤이 생기지 않는다(`min-w-0` + `truncate`). → Task 2 테스트(클래스 확인)
2. 내용이 빈 줄로 시작하는 메모 → 첫 번째 비어 있지 않은 줄을 보여준다. → Task 2 `noteHeadline` 테스트
3. 접힌 상태에서 종목 배지를 눌러도 펼쳐지지 않고 종목 필터만 동작한다. → Task 2 테스트
4. 접힘 토글이 키보드로 동작하고 `aria-expanded` 가 바뀐다(버튼 요소 사용). → Task 2 테스트
5. 수정 폼에서 제목을 지우고 저장하면 `title` 을 보내지 않아 서버에서 지워진다. → Task 1 테스트

---

### Task 1: 타입·작성 폼·공유 prefill 에 제목 추가

**Files:**
- Modify: `src/types/knowledgeNote.ts`
- Modify: `src/components/knowledge/KnowledgeNoteFormDialog.tsx` (initial state, 입력 칸, `handleSubmit`)
- Modify: `src/lib/parseSharedContent.ts`
- Test: `src/test/quickNoteDialog.test.tsx`, `src/test/parseSharedContent.test.ts`, `src/test/knowledgeShareTarget.test.tsx`
- Modify(fixture 만): `src/test/knowledgeNoteCard.test.tsx`, `src/test/knowledgeNotesPage.test.tsx`, `src/test/stockNotesPanel.test.tsx` — `KnowledgeNote` 객체에 `title: null` 추가

**Interfaces:**
- Produces: `KnowledgeNote.title: string | null`, `KnowledgeNoteInput.title?: string`, `export const MAX_NOTE_TITLE_LENGTH = 100` (types/knowledgeNote.ts). `parseSharedContent` 반환 타입에 `title?: string`.

- [ ] **Step 1: 이슈·브랜치 생성** — 이슈 번호 N 확인 후 `git checkout -b feature/issue-195`

- [ ] **Step 2: 실패 테스트 작성**
  - `quickNoteDialog.test.tsx`
    - `'제목을 입력하면 다듬어 보내고, 비우면 title 을 보내지 않는다'` — `textbox { name: '제목' }` 에 `'  HBM 메모 '` 입력 후 저장 → 생성 API 인자 `title: 'HBM 메모'`; 다른 케이스로 제목 비우고 저장 → 인자에 `title` 키 없음(`not.toHaveProperty('title')`).
    - `'제목 칸은 100자 제한이고 자동완성을 끈다'` — `maxLength` 100, 기존 `'입력 칸은 자동완성·자동 고침을 끈다'` 의 이름 목록에 `'제목'` 추가.
    - `'수정 폼은 기존 제목을 채운다'` — `note: { ...editable, title: '옛 제목' }` 로 열면 제목 칸 값 `'옛 제목'`.
    - 기존 `'열리면 내용 칸에 포커스가 간다'` 는 그대로 통과해야 한다.
  - `parseSharedContent.test.ts`: `'title 이 있으면 제목으로도 쓰고 100자로 자른다'` — `{ title: '제목', url }` → `title: '제목'`; `'가'.repeat(150)` → 길이 100. `'text 만 있으면 제목은 비운다'` — `{ text: '본문 https://a.com' }` → `title` 없음.
  - `knowledgeShareTarget.test.tsx`: 기존 두 `toEqual` 기대값에 `title: '제목'` 추가.

- [ ] **Step 3: 실패 확인** — `npx vitest run src/test/quickNoteDialog.test.tsx src/test/parseSharedContent.test.ts src/test/knowledgeShareTarget.test.tsx` → FAIL

- [ ] **Step 4: 구현**
  - 타입: Interfaces 대로. `KnowledgeNote.title` 은 `category` 다음.
  - 폼: `initial.title = note?.title ?? prefill?.title ?? ''`, `const [title, setTitle] = useState(initial.title)`. 내용 칸 위에 `<Label htmlFor="knowledge-note-title">제목 (선택)</Label>` + `<Input id="knowledge-note-title" maxLength={MAX_NOTE_TITLE_LENGTH} {...NO_SUGGESTION_PROPS} />`. `handleSubmit` 의 `base` 에 `...(title.trim() ? { title: title.trim() } : {})`. `saveLastContext` 에는 넣지 않는다(제목은 메모마다 다름).
  - `parseSharedContent`: 공유된 `title` 을 trim 해 비어 있지 않으면 `result.title = trimmedTitle.slice(0, 100)`. `sourceText` 로직은 그대로. 파일 상단 주석에 "title 은 제목 칸에도 채운다" 한 줄 추가.

- [ ] **Step 5: 통과 확인** — Step 3 명령 → PASS, 이어서 `npx tsc -b && npm test` 전체 PASS(fixture `title: null` 추가 포함)

- [ ] **Step 6: 커밋**

```bash
git add src/types/knowledgeNote.ts src/components/knowledge/KnowledgeNoteFormDialog.tsx src/lib/parseSharedContent.ts src/test docs/superpowers/plans/2026-11-20-knowledge-note-title-fe.md
git commit -m "feat: 지식 메모 작성 폼에 제목 입력 추가 (#195)"
```

---

### Task 2: 메모 카드 접힌 목록

**Files:**
- Create: `src/components/knowledge/noteHeadline.ts`
- Modify: `src/components/knowledge/KnowledgeNoteCard.tsx`
- Test: `src/test/noteHeadline.test.ts` (신규), `src/test/knowledgeNoteCard.test.tsx`, `src/test/knowledgeNotesPage.test.tsx`

**Interfaces:**
- Consumes: Task 1 의 `KnowledgeNote.title`.
- Produces: `noteHeadline(note: Pick<KnowledgeNote, 'title' | 'content'>): { text: string; kind: 'title' | 'content' | 'image' }`

카드 구조(결정 사항):

```
<Card>
  1줄: 분류·비공개·종목 배지(종목은 지금처럼 버튼) ··· 작성자 · 날짜      ← 토글 아님
  2줄: <button type="button" aria-expanded aria-controls={bodyId} class="flex w-full min-w-0 text-left">
         <span class="truncate {kind==='title' ? 'font-semibold' : ''}">{headline}</span>
         <span class="shrink-0 text-xs text-muted-foreground">🖼{images.length}(0이면 생략)  #태그…(텍스트, 버튼 아님)</span>
       </button>
  펼침: <div id={bodyId}> 내용 전문(line-clamp 없음) · 이미지 · 출처 · 태그 버튼 · 수정/삭제 </div>
```

태그를 2줄 버튼 안에 텍스트로만 두는 이유: 버튼 안에 버튼을 넣을 수 없다. 태그 검색은 펼친 본문의 태그 버튼으로 한다.
버튼 접근 이름이 headline 문구가 되도록 아이콘에는 `aria-hidden`, 이미지 개수는 `sr-only` 로 "이미지 N장".

- [ ] **Step 1: 실패 테스트 작성 — `noteHeadline.test.ts`**

```ts
it('제목이 있으면 제목', () =>
  expect(noteHeadline({ title: 'HBM', content: '본문' })).toEqual({ text: 'HBM', kind: 'title' }));
it('제목이 없으면 첫 번째 비어 있지 않은 줄', () =>
  expect(noteHeadline({ title: null, content: '\n  \n둘째 줄\n셋째' })).toEqual({ text: '둘째 줄', kind: 'content' }));
it('제목·내용이 없으면 이미지 메모', () =>
  expect(noteHeadline({ title: null, content: null })).toEqual({ text: '이미지 메모', kind: 'image' }));
it('공백 제목은 없는 것으로 본다', () =>
  expect(noteHeadline({ title: '  ', content: '본문' }).kind).toBe('content'));
```

- [ ] **Step 2: 실패 테스트 작성 — `knowledgeNoteCard.test.tsx`**
  - `card_collapsed_showsHeadlineOnly` — `{ title: 'HBM 메모', content: '본문 전체', tags: ['반도체'] }` → `button { name: /HBM 메모/, expanded: false }` 존재, `'본문 전체'` 없음, `수정` 버튼 없음, 헤드라인 span 에 `truncate` 클래스.
  - `card_toggle_expandsAndCollapses` — 헤드라인 버튼 클릭 → `aria-expanded="true"`, `'본문 전체'`·`#반도체` 버튼 보임; 다시 클릭 → 숨김.
  - `card_toggle_keyboard` — 버튼 focus 후 `{Enter}` → 펼침.
  - `card_stockBadgeClick_doesNotExpand` — STOCK 메모에서 종목 배지 클릭 → `onStockClick` 호출, `aria-expanded` 는 `"false"` 유지.
  - `card_imageOnly_showsImageCount` — `{ content: null, images: ['a','b'] }` → 헤드라인 `'이미지 메모'`, `'이미지 2장'` 텍스트.
  - 기존 `card_notEditable_hidesEditAndDelete` / `card_editable_showsEditAndDelete` 는 헤드라인 버튼을 먼저 클릭하고 확인하도록 수정. 배지·작성자 관련 기존 테스트는 접힌 상태 그대로 통과해야 한다.

- [ ] **Step 3: 기존 페이지 테스트 갱신 — `knowledgeNotesPage.test.tsx`**
  - `'긴 내용은 줄여서 보이고 "내용 더보기"/"내용 접기"…'` 테스트를 `'메모는 접힌 채로 보이고 누르면 내용 전문이 보인다'` 로 교체: 긴 메모 헤드라인 버튼 클릭 → 마지막 줄 텍스트 보임, `line-clamp-4` 클래스 없음, `내용 더보기` 버튼 없음.
  - 출처 링크 테스트(177~205행 근처)는 각 카드 헤드라인 버튼을 펼친 뒤 확인하도록 수정.

- [ ] **Step 4: 실패 확인** — `npx vitest run src/test/noteHeadline.test.ts src/test/knowledgeNoteCard.test.tsx src/test/knowledgeNotesPage.test.tsx` → FAIL

- [ ] **Step 5: 구현** — `noteHeadline.ts` 는 시그니처대로, `KnowledgeNoteCard` 는 위 구조대로. `COLLAPSE_MAX_LINES`/`COLLAPSE_MAX_CHARS`/`isLongContent`/`contentExpanded` 는 삭제. `bodyId` 는 `useId()`. 펼친 본문 안의 기존 순서(내용 → 이미지 → 출처 → 태그 → 버튼)와 이미지 뷰어·삭제 확인 다이얼로그는 그대로.

- [ ] **Step 6: 통과 확인** — Step 4 명령 → PASS, `npx tsc -b && npm run lint && npm test` → PASS

- [ ] **Step 7: 커밋**

```bash
git add src/components/knowledge/noteHeadline.ts src/components/knowledge/KnowledgeNoteCard.tsx src/test/noteHeadline.test.ts src/test/knowledgeNoteCard.test.tsx src/test/knowledgeNotesPage.test.tsx
git commit -m "feat: 지식 메모 목록을 접힌 카드로 표시 (#195)"
```

---

### Task 3: 종목 메모 패널에 제목 표시

**Files:**
- Modify: `src/components/knowledge/StockNotesPanel.tsx` (목록 `li` 안, 내용 `<p>` 위)
- Test: `src/test/stockNotesPanel.test.tsx`

- [ ] **Step 1: 실패 테스트 작성** — `note(...)` 헬퍼에 `title` 인자(기본 `null`) 추가 후
  - `'제목이 있으면 내용 위에 굵게 보여준다'` — `title: 'HBM 메모'` → `getByText('HBM 메모')` 에 `font-semibold`.
  - `'제목이 없으면 제목 줄을 그리지 않는다'` — 기존 렌더 결과에 빈 제목 요소 없음(`li` 첫 자식이 내용 `<p>`).

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/stockNotesPanel.test.tsx` → FAIL

- [ ] **Step 3: 구현** — `note.title &&` 일 때 `<p className="truncate font-semibold">{note.title}</p>`.

- [ ] **Step 4: 통과 확인** — `npx tsc -b && npm run lint && npm test` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/knowledge/StockNotesPanel.tsx src/test/stockNotesPanel.test.tsx
git commit -m "feat: 종목 메모 패널에 메모 제목 표시 (#195)"
```
