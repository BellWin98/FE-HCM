# 지식 메모 권한·공개 범위 (FE) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 백엔드의 조회/작성 권한과 공개 범위를 화면에 반영합니다. 작업 범위는 다음과 같습니다.
- 메뉴와 생성 진입점을 권한에 맞게 노출합니다.
- 카드에 작성자, 비공개 배지, 수정 가능 여부를 표시합니다.
- 공개/비공개 토글과 목록 필터를 추가합니다.
- 관리자 회원 관리 화면에서 권한을 바꿀 수 있게 합니다.

**Architecture:**
- 권한 상태는 `useKnowledgeAccess` 하나에서 내려옵니다. 서버의 `/knowledge-notes/access` 응답을 그대로 씁니다.
- 메모별 수정 가능 여부는 서버가 계산한 `editable`만 사용합니다.
- 화면에서는 판정 로직을 다시 짜지 않습니다.

**Tech Stack:** React 18, TypeScript, Vite, TanStack Query, shadcn/ui(Radix), Tailwind, Vitest + React Testing Library

**Spec:** `../BE-HCM/docs/superpowers/specs/2026-11-05-knowledge-note-permissions-design.md`

**선행 조건:** BE 계획(`BE-HCM/docs/superpowers/plans/2026-11-05-knowledge-note-permissions-be.md`)이 `main`에 머지되어 있어야 합니다. FE 테스트는 `@/lib/api`를 목으로 대체하므로 BE 없이도 진행할 수 있습니다. 다만 수동 확인은 BE가 있어야 합니다.

## Global Constraints

**검증 명령**
- 타입 검사는 `npx tsc -b`로 합니다. `tsc --noEmit`은 아무것도 검사하지 않으므로 쓰지 않습니다.
- `npm run lint`, `npx vitest run`도 함께 돌립니다.

**테스트 작성**
- 테스트 파일은 `src/test/*.test.tsx`에 둡니다.
- `@/lib/api`는 `vi.mock`으로 대체합니다.
- 요소는 `getByRole`과 접근성 이름으로 찾습니다.

**코딩 규칙**
- 조기 반환을 씁니다.
- 스타일은 Tailwind 클래스만 씁니다.
- 핸들러 이름에는 `handle` 접두사를 붙입니다.
- `const` 화살표 함수를 씁니다.
- 타입만 가져올 때는 `import type`을 씁니다.
- `?.`와 `??`를 씁니다.
- 접근성 속성을 붙입니다(`aria-pressed`, `aria-label` 등).

**API**
- 새 API 메서드는 `ApiClient`의 Knowledge Note 섹션과 Admin 섹션에 추가합니다.
- 공유 타입은 `src/types/knowledgeNote.ts`와 `src/types/index.ts`에 둡니다.

**Git**
- 브랜치는 `feature/issue-{N}`이고, base는 `main`입니다.
- 커밋 메시지는 한국어로 쓰고 `(#N)`으로 끝냅니다.

**BE 계약 (BE 계획 Task 6, 7)**
- 접근 상태: `GET /knowledge-notes/access` → `{ hasAccess, canRead, canWrite, isAdmin }`
- 메모 응답에 필드가 추가됩니다: `visibility: 'PUBLIC' | 'PRIVATE'`, `author: { id, nickname, profileUrl }`, `editable: boolean`
- 메모 생성·수정 요청에 `visibility`가 추가됩니다(선택).
- 목록 조회는 `scopes`를 여러 번 넣어 보냅니다: `GET /knowledge-notes?scopes=MINE&scopes=PUBLIC`
- 관리자 조회: `GET /admin/knowledge-access`
- 관리자 변경: `PUT /admin/knowledge-access/{memberId}`, 요청 본문은 `{ canRead, canWrite }`입니다.
- 관리자 회원 목록의 각 항목에 `knowledgeAccess: { canRead, canWrite }`가 추가됩니다.

## Review Focus

1. **권한이 바뀐 뒤 화면이 그대로인 경우**: 관리자가 자기 권한 화면을 바꾼 뒤에도 메뉴와 FAB가 옛 상태로 남으면 안 됩니다. → Task 5 테스트 `handleToggle_invalidatesKnowledgeAccess`
2. **관리자 필터의 마지막 체크를 해제하려는 경우**: 해제되지 않아야 합니다. 빈 목록이나 `scopes=` 빈 요청이 나가면 안 됩니다. → Task 4 테스트 `adminFilter_lastChipCannotBeUnchecked`
3. **필터를 바꿨을 때 이전 필터 결과가 섞여 보이는 경우**: 쿼리 키에 scopes가 포함되어야 합니다. → Task 4 테스트 `filterChange_requestsWithNewScopes`
4. **작성 권한 없이 공유 대상 페이지로 들어온 경우**: 폼이 열리지 않아야 하고, 공유 데이터는 정리되어야 합니다. → Task 3 테스트 `shareTarget_readOnly_redirectsAndClears`
5. **수정 권한만 있는데 남의 메모 수정 다이얼로그가 열리는 경우**: `editable=false`인 메모로 `openQuickNote({ note })`를 호출해도 열리지 않아야 합니다. → Task 3 테스트 `openQuickNote_uneditableNote_ignored`

---

### Task 1: 타입, API 클라이언트, `useKnowledgeAccess` 확장

**Files:**
- Modify: `src/types/knowledgeNote.ts`
- Modify: `src/types/index.ts`(`AdminMember`)
- Modify: `src/lib/api.ts`
- Modify: `src/hooks/useKnowledgeAccess.ts`
- Test: `src/test/knowledgeApi.test.ts`(신규), `src/test/requireKnowledgeAccess.test.tsx`

**Interfaces:**
- Produces:
  - `src/types/knowledgeNote.ts`
    - `export type KnowledgeVisibility = 'PUBLIC' | 'PRIVATE'`
    - `export type KnowledgeNoteScope = 'MINE' | 'PUBLIC' | 'PRIVATE'`
    - `export interface KnowledgeNoteAuthor { id: number; nickname: string; profileUrl: string | null }`
    - `KnowledgeNote`에 추가: `visibility: KnowledgeVisibility; author: KnowledgeNoteAuthor; editable: boolean`
    - `KnowledgeNoteInput`에 추가: `visibility?: KnowledgeVisibility`
    - `KnowledgeNoteSearchParams`에 추가: `scopes?: KnowledgeNoteScope[]`
    - `KnowledgeAccessStatus`: `{ hasAccess: boolean; canRead: boolean; canWrite: boolean; isAdmin: boolean }`
    - `export interface KnowledgeAccessFlags { canRead: boolean; canWrite: boolean }`
    - `export interface KnowledgeAccessGrant extends KnowledgeAccessFlags { memberId: number; email: string; nickname: string; profileUrl: string | null; grantedBy: number | null; updatedAt: string | null }`
  - `src/types/index.ts`: `AdminMember`에 `knowledgeAccess: KnowledgeAccessFlags` 추가
  - `api.searchKnowledgeNotes`: `scopes`의 값마다 `searchParams.append('scopes', s)`를 호출합니다. 빈 배열이면 붙이지 않습니다.
  - `api.updateAdminKnowledgeAccess(memberId: number, flags: KnowledgeAccessFlags): Promise<KnowledgeAccessGrant>`: `PUT /admin/knowledge-access/{memberId}`
  - `api.getAdminKnowledgeAccess(): Promise<KnowledgeAccessGrant[]>`
  - `useKnowledgeAccess()`의 반환값: `{ hasAccess, canRead, canWrite, isAdmin, isPending }`
    - 조회에 실패하면 모든 값을 false로 둡니다(기존 규칙 유지).

- [ ] **Step 1: Write the failing tests**
  - `knowledgeApi.test.ts`
    - axios 인스턴스의 `request`를 spy로 감쌉니다.
    - `searchKnowledgeNotes_appendsEachScope`: `{ scopes: ['MINE', 'PRIVATE'] }`로 호출하면 URL에 `scopes=MINE&scopes=PRIVATE`가 들어가야 합니다.
    - `searchKnowledgeNotes_emptyScopes_omitsParam`: `{ scopes: [] }`면 URL에 `scopes`가 없어야 합니다.
  - `requireKnowledgeAccess.test.tsx`
    - 기존 목 응답을 새 형태로 맞춥니다.
    - `writeOnly_hasAccess_rendersChildren`: `{ hasAccess: true, canRead: false, canWrite: true, isAdmin: false }`면 자식이 렌더링돼야 합니다.

- [ ] **Step 2: Run tests to verify they fail**
  - Run: `npx vitest run src/test/knowledgeApi.test.ts src/test/requireKnowledgeAccess.test.tsx`
  - Expected: FAIL

- [ ] **Step 3: 위 Interfaces대로 구현합니다**
  - `KnowledgeNote` 필드가 늘어서 기존 테스트 픽스처의 타입이 깨질 수 있습니다. 이 태스크에서 함께 고칩니다. 픽스처 기본값은 `visibility: 'PUBLIC'`, `author: { id: 1, nickname: 'user', profileUrl: null }`, `editable: true`로 둡니다.

- [ ] **Step 4: Run tests and type check**
  - Run: `npx vitest run`, `npx tsc -b`
  - Expected: 모두 PASS, 타입 오류 0건

- [ ] **Step 5: Commit**
  - 메시지: `feat: 지식 메모 권한·공개 범위 타입과 API 확장 (#N)`

---

### Task 2: 메모 카드(작성자·비공개 배지·editable)와 폼의 공개 토글

**Files:**
- Modify: `src/components/knowledge/KnowledgeNoteCard.tsx`
- Modify: `src/components/knowledge/KnowledgeNoteFormDialog.tsx`
- Test: `src/test/knowledgeNoteCard.test.tsx`(신규), `src/test/quickNoteDialog.test.tsx`

**Interfaces:**
- Consumes: Task 1 `KnowledgeNote.visibility`, `author`, `editable`, `KnowledgeNoteInput.visibility`
- Produces:
  - `KnowledgeNoteCardProps`에 `currentMemberId?: number`를 추가합니다. "내 메모" 표시에 씁니다.
  - 폼 다이얼로그 저장 시 `visibility`를 보냅니다.

**동작**
- 카드 상단에 작성자 닉네임을 표시합니다. `author.id === currentMemberId`면 "나"를 표시합니다.
- `visibility === 'PRIVATE'`면 "비공개" 배지(`Badge`)를 붙입니다.
- `editable`이 false면 수정·삭제 버튼과 삭제 확인 다이얼로그를 렌더링하지 않습니다.
- 폼에 `Switch`를 추가합니다.
  - 접근성 이름은 `공개`입니다.
  - 새 메모는 켜진 상태(PUBLIC)로 시작합니다.
  - 수정할 때는 `note.visibility`를 초기값으로 씁니다.
  - 꺼져 있으면 `'PRIVATE'`을 보냅니다.

- [ ] **Step 1: Write the failing tests**
  - `knowledgeNoteCard.test.tsx`
    - `card_showsAuthorNickname`
    - `card_ownNote_showsMe`
    - `card_private_showsBadge`: `getByText('비공개')`
    - `card_notEditable_hidesEditAndDelete`: `queryByRole('button', { name: '수정' })`와 `queryByRole('button', { name: '삭제' })`가 null이어야 합니다.
  - `quickNoteDialog.test.tsx`
    - `newNote_defaultsPublic_sendsPublic`: 스위치가 체크된 상태여야 하고, 저장 시 `createKnowledgeNote`가 `visibility: 'PUBLIC'`을 포함해 호출돼야 합니다.
    - `toggleOff_sendsPrivate`
    - `editPrivateNote_startsUnchecked`

- [ ] **Step 2: Run tests to verify they fail**
  - Run: `npx vitest run src/test/knowledgeNoteCard.test.tsx src/test/quickNoteDialog.test.tsx`
  - Expected: FAIL

- [ ] **Step 3: 위 동작대로 구현합니다**
  - 작성자 표시 문구와 배지 위치는 기존 카드 헤더 스타일에 맞춥니다(스펙 7절, 구현자 판단).

- [ ] **Step 4: Run tests to verify they pass**
  - Run: Step 2와 같은 명령, 이어서 `npx tsc -b`
  - Expected: PASS

- [ ] **Step 5: Commit**
  - 메시지: `feat: 지식 메모 카드에 작성자·비공개 표시와 공개 설정 추가 (#N)`

---

### Task 3: 생성 진입점과 `openQuickNote` 가드

**Files:**
- Modify: `src/contexts/QuickNoteContext.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/knowledge/StockNotesPanel.tsx`
- Modify: `src/pages/KnowledgeShareTargetPage.tsx`
- Test: `src/test/quickNoteDialog.test.tsx`, `src/test/headerKnowledgeMenu.test.tsx`, `src/test/stockNotesPanel.test.tsx`, `src/test/knowledgeShareTarget.test.tsx`

**Interfaces:**
- Consumes: Task 1 `useKnowledgeAccess().canWrite`, Task 2 카드의 `currentMemberId`
- Produces:
  - `QuickNoteContextValue`에 `canCreate: boolean`을 추가합니다.
  - Header와 패널은 `useKnowledgeAccess`를 따로 부르지 않고, 이 값으로 버튼 노출을 정합니다.

**동작**
- `openQuickNote(next)`의 가드는 다음과 같습니다.
  - `next.note`가 없으면 `canWrite`가 필요합니다.
  - `next.note`가 있으면 `next.note.editable`이 필요합니다.
  - 조건을 만족하지 못하면 아무 일도 하지 않습니다.
- 다이얼로그 렌더 조건은 `hasAccess`로 유지합니다.
- `QuickNoteFab`은 `canWrite`일 때만 렌더링합니다.
- Header의 빠른 메모 버튼(데스크톱·모바일 모두)은 `canCreate`일 때만 보입니다. 메뉴 링크는 계속 `hasAccess` 기준입니다.
- `StockNotesPanel`
  - "메모 쓰기" 버튼은 `canCreate`일 때만 보입니다.
  - 카드에는 `currentMemberId`(AuthContext의 member id)를 넘깁니다.
- `KnowledgeShareTargetPage`의 판정을 `hasAccess`에서 `canWrite`로 바꿉니다. 실패했을 때의 처리(공유 데이터 정리, 토스트, `/dashboard` 이동)는 기존과 같습니다.

- [ ] **Step 1: Write the failing tests**
  - `quickNoteDialog.test.tsx`
    - `fab_readOnly_hidden`: 권한이 `{ hasAccess: true, canRead: true, canWrite: false }`면 FAB가 없어야 합니다.
    - `openQuickNote_uneditableNote_ignored`: `editable: false`인 메모로 열면 다이얼로그가 열리지 않아야 합니다.
    - `openQuickNote_editableNote_opensForReadOnlyAccess`: 조회 권한만 있어도 `editable: true`인 메모는 열려야 합니다. 이 테스트는 서버 판정을 따른다는 점을 고정합니다.
  - `headerKnowledgeMenu.test.tsx`: `readOnly_showsMenuButHidesQuickNote`
  - `stockNotesPanel.test.tsx`: `readOnly_hidesWriteButton`
  - `knowledgeShareTarget.test.tsx`: `shareTarget_readOnly_redirectsAndClears`
    - `canWrite: false`면 `/dashboard`로 이동해야 하고, 공유 데이터 정리 함수가 호출돼야 하며, 폼이 열리지 않아야 합니다.

- [ ] **Step 2: Run tests to verify they fail**
  - Run: `npx vitest run src/test/quickNoteDialog.test.tsx src/test/headerKnowledgeMenu.test.tsx src/test/stockNotesPanel.test.tsx src/test/knowledgeShareTarget.test.tsx`
  - Expected: FAIL

- [ ] **Step 3: 위 동작대로 구현합니다**

- [ ] **Step 4: Run tests to verify they pass**
  - Run: Step 2와 같은 명령, 이어서 `npx tsc -b`
  - Expected: PASS

- [ ] **Step 5: Commit**
  - 메시지: `feat: 지식 메모 작성 권한에 따라 생성 진입점 제한 (#N)`

---

### Task 4: 메모 목록 필터

**Files:**
- Create: `src/components/knowledge/KnowledgeScopeFilter.tsx`
- Modify: `src/pages/KnowledgeNotesPage.tsx`
- Test: `src/test/knowledgeNotesPage.test.tsx`

**Interfaces:**
- Consumes: Task 1 `KnowledgeNoteScope`, `useKnowledgeAccess().{ canWrite, isAdmin }`, `searchKnowledgeNotes({ scopes })`
- Produces:
  - `KnowledgeScopeFilter`의 props: `{ isAdmin: boolean; canWrite: boolean; value: KnowledgeNoteScope[]; onChange: (next: KnowledgeNoteScope[]) => void }`
    - 두 조건이 모두 false면 `null`을 렌더링합니다.
  - `export const ADMIN_DEFAULT_SCOPES: KnowledgeNoteScope[] = ['MINE', 'PUBLIC']`

**동작 (스펙 5.3절)**
- **일반 유저(`canWrite && !isAdmin`)**
  - `aria-pressed` 토글 버튼 하나를 보여줍니다. 이름은 "내 메모만 보기"입니다.
  - 켜면 `['MINE']`, 끄면 `[]`입니다.
- **관리자**
  - `aria-pressed` 버튼 3개를 보여줍니다. 이름은 "내 메모", "공개 메모", "비공개 메모"입니다.
  - 여러 개를 함께 선택할 수 있습니다.
  - 선택된 것이 하나뿐이면 그 버튼을 눌러도 해제되지 않습니다.
  - "비공개 메모"가 선택돼 있으면 "다른 유저의 비공개 메모도 표시됩니다" 안내를 보여줍니다. 문구는 구현할 때 다듬어도 됩니다.
- **페이지**
  - 초기 상태는 관리자면 `ADMIN_DEFAULT_SCOPES`, 그 외에는 `[]`입니다.
  - 목록 쿼리 키를 `[...KNOWLEDGE_NOTES_QUERY_KEY, 'list', { keyword, category, stockSymbol, scopes }]`로 만들고, 요청에 `scopes`를 넘깁니다.
- **카드**: 목록의 `KnowledgeNoteCard`에 `currentMemberId`를 넘깁니다.

- [ ] **Step 1: Write the failing tests**
  - `readOnlyUser_noFilter`: 버튼 4종이 모두 없어야 합니다.
  - `writer_mineToggle_sendsMineScope`: "내 메모만 보기"를 누르면 `searchKnowledgeNotes`가 `scopes: ['MINE']`를 포함해 호출돼야 합니다.
  - `admin_defaultScopes_mineAndPublic`: 첫 요청이 `scopes: ['MINE', 'PUBLIC']`이고, 두 버튼이 `aria-pressed="true"`여야 합니다. "내 메모만 보기" 버튼은 없어야 합니다.
  - `filterChange_requestsWithNewScopes`: "비공개 메모"를 누르면 다음 요청의 scopes에 `PRIVATE`이 포함되고 안내 문구가 보여야 합니다.
  - `adminFilter_lastChipCannotBeUnchecked`: "공개 메모"를 해제한 뒤 "내 메모"를 누르면 여전히 `aria-pressed="true"`여야 하고, `scopes: []` 요청이 나가지 않아야 합니다.

- [ ] **Step 2: Run tests to verify they fail**
  - Run: `npx vitest run src/test/knowledgeNotesPage.test.tsx`
  - Expected: FAIL

- [ ] **Step 3: 위 동작대로 구현합니다**
  - 필터 칩 스타일은 기존 카테고리 버튼(`variant` 전환 + `aria-pressed`)과 같게 맞춥니다.

- [ ] **Step 4: Run tests to verify they pass**
  - Run: Step 2와 같은 명령, 이어서 `npx tsc -b`
  - Expected: PASS

- [ ] **Step 5: Commit**
  - 메시지: `feat: 지식 메모 목록에 내 메모·공개 범위 필터 추가 (#N)`

---

### Task 5: 관리자 회원 관리 화면의 지식 메모 권한

**Files:**
- Modify: `src/pages/admin/AdminMembersPage.tsx`
- Test: `src/test/adminMembersKnowledgeAccess.test.tsx`(신규)

**Interfaces:**
- Consumes: Task 1 `AdminMember.knowledgeAccess`, `api.updateAdminKnowledgeAccess`, `KNOWLEDGE_ACCESS_QUERY_KEY`

**동작**
- 데스크톱 테이블의 "토스 접근" 열 뒤에 "지식 메모" 열을 추가합니다.
  - 열 안에는 `Checkbox` 2개를 둡니다. 접근성 이름은 `${nickname} 지식 메모 조회`, `${nickname} 지식 메모 작성`입니다.
- 모바일 카드에도 같은 체크박스 2개를 "토스 접근" 블록 아래에 둡니다.
- ADMIN 행은 두 체크박스를 모두 체크한 채 `disabled`로 둡니다.
- 체크박스를 바꾸면 확인 창 없이 바로 `updateAdminKnowledgeAccess(m.id, { canRead, canWrite })`를 호출합니다. 바뀐 쪽만 새 값이고, 다른 쪽은 현재 값을 그대로 보냅니다.
- 저장하는 동안 그 회원 행의 두 체크박스를 비활성화하고 "변경 중..."을 표시합니다. 다른 행은 영향을 받지 않습니다.
- 저장에 성공하면 `['adminMembers']`와 `KNOWLEDGE_ACCESS_QUERY_KEY`를 무효화합니다.
- 실패하면 기존 토스 토글과 같은 방식으로 오류를 표시합니다.

- [ ] **Step 1: Write the failing tests**
  - `getAdminMembers` 목 응답에는 USER(권한 없음)와 ADMIN을 넣습니다.
  - `checkRead_callsUpdateWithBothFlags`: USER의 조회 체크박스를 누르면 `updateAdminKnowledgeAccess(userId, { canRead: true, canWrite: false })`가 호출돼야 합니다.
  - `adminRow_checkedAndDisabled`
  - `whileSaving_rowCheckboxesDisabled`: 저장 promise가 끝나기 전에는 그 행의 체크박스 2개가 `disabled`여야 합니다.
  - `handleToggle_invalidatesKnowledgeAccess`: 성공 후 `queryClient.invalidateQueries`가 `{ queryKey: ['knowledgeAccess'] }`로 호출돼야 합니다. `QueryClient`를 직접 만들어 spy로 확인합니다.

- [ ] **Step 2: Run tests to verify they fail**
  - Run: `npx vitest run src/test/adminMembersKnowledgeAccess.test.tsx`
  - Expected: FAIL

- [ ] **Step 3: 위 동작대로 구현합니다**
  - 뮤테이션은 기존 `tossAccessMutation` 패턴을 따릅니다(`variables?.memberId`로 저장 중인 행을 판정).

- [ ] **Step 4: Run all checks**
  - Run: `npx vitest run`, `npx tsc -b`, `npm run lint`
  - Expected: 모두 PASS

- [ ] **Step 5: Commit**
  - 메시지: `feat: 관리자 회원 관리에 지식 메모 권한 설정 추가 (#N)`

---

### Task 6: 수동 확인과 문서

**Files:**
- Modify: `CLAUDE.md`(FE-HCM)

- [ ] **Step 1: `CLAUDE.md` 도메인 규칙 섹션에 지식 메모 항목을 추가합니다**
  - 권한은 `useKnowledgeAccess`의 `{ hasAccess, canRead, canWrite, isAdmin }` 하나로 판단합니다.
    - 메뉴와 라우트는 `hasAccess`를 봅니다.
    - 생성 진입점은 `canWrite`를 봅니다.
  - 메모별 수정·삭제 노출은 서버의 `editable`만 따릅니다. 화면에서 작성자를 비교해 판정하지 않습니다.

- [ ] **Step 2: 수동 확인**
  - BE 로컬 서버를 함께 띄우고 `/run` 스킬 또는 `npm run dev`로 실행합니다.
  - 일반 계정으로 아래 세 상태를 각각 확인합니다.
    - 권한 없음: 메뉴가 숨겨지는지
    - 조회만: 다른 유저의 공개 메모가 보이고 FAB가 없는지
    - 조회 + 작성: 내 메모를 생성·수정·삭제할 수 있고, "내 메모만 보기"가 동작하는지
  - 관리자 계정으로 3종 필터의 조합을 확인합니다.

- [ ] **Step 3: Commit**
  - 메시지: `docs: 지식 메모 권한 화면 규칙 문서화 (#N)`
