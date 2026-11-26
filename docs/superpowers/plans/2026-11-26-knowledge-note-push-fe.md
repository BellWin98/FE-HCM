# 새 지식 메모 푸시 알림 (FE) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 푸시 알림을 누르면 서버가 보낸 `path`(새 메모는 `/notes`)로 이동하고, 운동방에 참여하지 않은 지식 메모 조회 권한자도 푸시를 받을 수 있게 한다.

**Architecture:** 서비스워커는 알림의 `data.url` 에 `path` 를 담는다. 알림을 누르면 열린 앱 창이 있으면 포커스하고 `postMessage` 로 이동을 요청하고, 없으면 새 창을 연다. 앱은 `useServiceWorkerNavigation` 훅으로 그 메시지를 받아 라우터로 이동한다. 포그라운드 토스트에는 "보기" 버튼을 붙이고, `/notes` 화면에 들어오면 FCM 토큰을 등록한다.

**Tech Stack:** React + TypeScript, react-router-dom, Firebase JS SDK(compat in SW), sonner, Vitest + Testing Library

**Spec:** `BE-HCM/docs/superpowers/specs/2026-11-26-knowledge-note-push-design.md` (BE 계획: `BE-HCM/docs/superpowers/plans/2026-11-26-knowledge-note-push-be.md`)

## Global Constraints

- FCM data 필드: `title`, `body`, `senderId`, `tag`, `path`(빈 문자열일 수 있음). 빈 `path` 는 `/` 로 취급한다(기존 알림 동작 유지).
- 같은 출처의 경로만 이동한다. `path` 가 `/` 로 시작하지 않거나 `//` 로 시작하면 `/` 로 바꾼다.
- 서비스워커→앱 메시지 형식: `{ type: 'PUSH_NAVIGATE', url: string }`.
- 토스트 "보기" 버튼 라벨: `보기`.
- 명령은 `FE-HCM` 디렉터리에서 실행한다.

## Review Focus

- 기존 알림(`path` = `""`)을 누르면 지금처럼 `/` 로 가야 한다 → Task 1 테스트 `toPushUrl_empty_returnsRoot`.
- 외부 URL(`https://evil.com`, `//evil.com`)이 `path` 로 와도 앱 밖으로 나가면 안 된다 → Task 1 테스트 `toPushUrl_rejectsExternal`.
- 서비스워커가 보낸 메시지 중 형식이 다른 것(Workbox 업데이트 메시지 등)은 무시해야 한다 → Task 2 테스트 `ignoresOtherMessages`.
- 알림 권한을 거부한 사용자가 `/notes` 에 들어와도 화면이 정상 동작해야 한다 → Task 3 테스트 `notesPage_tokenRegistrationFails_stillRenders`.
- 토스트의 `path` 가 비어 있으면 "보기" 버튼이 없어야 한다 → Task 1 테스트 `pushToastOptions_noPath_noAction`.

---

### Task 0: 브랜치

- [ ] **Step 1:** 이슈를 만든 뒤 `git -C FE-HCM switch -c feature/issue-209` (N = 이슈 번호). 모든 커밋 메시지는 `(#209)` 로 끝맺는다.

### Task 1: 경로 정규화 + 토스트 옵션 + 대시보드 토스트

**Files:**
- Create: `src/lib/pushNavigation.ts`
- Modify: `src/pages/DashboardPage.tsx` (`onMessage` 토스트)
- Test: `src/test/pushNavigation.test.ts`

**Interfaces:**
- Produces:
  - `toPushUrl(path: string | undefined | null): string` — Global Constraints 규칙대로 정규화
  - `pushToastOptions(data: Record<string, string> | undefined, navigate: (url: string) => void): { description?: string; duration: number; action?: { label: string; onClick: () => void } }` — `duration` 2000(현행), `path` 가 비어 있지 않을 때만 `action`
  - `PUSH_NAVIGATE = 'PUSH_NAVIGATE'`

- [ ] **Step 1: 실패 테스트**
  - `toPushUrl_empty_returnsRoot`: `""`, `undefined`, `null` → `"/"`
  - `toPushUrl_keepsAppPath`: `"/notes"` → `"/notes"`
  - `toPushUrl_rejectsExternal`: `"https://evil.com"`, `"//evil.com"`, `"notes"` → `"/"`
  - `pushToastOptions_withPath_actionNavigates`: `{ body: "b", path: "/notes" }` → `action.label === "보기"`, `onClick()` 하면 `navigate("/notes")`
  - `pushToastOptions_noPath_noAction`: `{ body: "b", path: "" }` → `action` 없음
- [ ] **Step 2:** `npx vitest run src/test/pushNavigation.test.ts` → FAIL
- [ ] **Step 3: 구현** — `pushNavigation.ts` 작성. `DashboardPage` 의 `toast(title, {...})` 를 `toast(title, pushToastOptions(data, navigate))` 로 바꾼다(`navigate` 는 이미 있는 `useNavigate`).
- [ ] **Step 4:** 같은 명령 → PASS, `npx tsc -b`, `npm run lint` 통과
- [ ] **Step 5: 커밋** `feat: 푸시 경로 정규화와 토스트 보기 버튼 (#209)`

### Task 2: 알림 클릭 → 앱 이동 (서비스워커 + 앱 훅)

**Files:**
- Modify: `public/firebase-messaging-sw.js`
- Create: `src/hooks/useServiceWorkerNavigation.ts`
- Modify: `src/App.tsx` (`BrowserRouter` 안쪽에서 훅을 쓰는 컴포넌트를 `AppRoutes` 옆에 마운트)
- Test: `src/test/useServiceWorkerNavigation.test.tsx`

**Interfaces:**
- Consumes: Task 1 `toPushUrl`, `PUSH_NAVIGATE`
- Produces: `useServiceWorkerNavigation(): void` — `navigator.serviceWorker` 의 `message` 이벤트에서 `{type: PUSH_NAVIGATE, url}` 이면 `navigate(toPushUrl(url))`. `navigator.serviceWorker` 가 없으면 아무것도 하지 않는다. 언마운트 시 리스너 제거.

- [ ] **Step 1: 실패 테스트**(`MemoryRouter` + 현재 경로를 보여 주는 라우트, `navigator.serviceWorker` 는 `EventTarget` 으로 스텁)
  - `navigatesOnPushMessage`: `MessageEvent('message', { data: { type: 'PUSH_NAVIGATE', url: '/notes' } })` 디스패치 → 경로 `/notes`
  - `ignoresOtherMessages`: `{ type: 'SKIP_WAITING' }` → 경로 그대로
  - `noServiceWorker_noop`: `navigator.serviceWorker` 가 `undefined` 여도 렌더 시 예외 없음
- [ ] **Step 2:** `npx vitest run src/test/useServiceWorkerNavigation.test.tsx` → FAIL
- [ ] **Step 3: 구현**
  - 훅과 `App.tsx` 마운트.
  - `firebase-messaging-sw.js`(ES 모듈이 아니므로 `toPushUrl` 과 같은 규칙을 파일 안에 짧게 다시 쓴다. 주석에 `src/lib/pushNavigation.ts` 와 맞춰야 한다고 남긴다):
    - `onBackgroundMessage`: `notificationOptions.data = { url: toPushUrl(path) }`
    - `notificationclick`: `clients.matchAll({ type: 'window', includeUncontrolled: true })` 에서 같은 출처 창이 있으면 `focus()` 후 `postMessage({ type: 'PUSH_NAVIGATE', url })`, 없으면 `clients.openWindow(url)`
- [ ] **Step 4:** 같은 명령 → PASS, `npx tsc -b`, `npm run lint`, `npm run build` 통과
- [ ] **Step 5: 수동 확인**(서비스워커는 단위 테스트 밖) — dev 서버에서 앱 탭을 백그라운드로 두고 Firebase 콘솔 또는 BE 로 `path=/notes` 알림을 보낸다. (a) 탭이 열려 있을 때 클릭 → 그 탭이 앞으로 오고 `/notes` 로 이동, (b) 탭을 닫았을 때 클릭 → 새 창이 `/notes` 로 열림, (c) `path=""` → `/`.
- [ ] **Step 6: 커밋** `feat: 푸시 알림 클릭 시 해당 화면으로 이동 (#209)`

### Task 3: `/notes` 진입 시 FCM 토큰 등록

**Files:**
- Modify: `src/pages/KnowledgeNotesPage.tsx`
- Test: `src/test/knowledgeNotesPage.test.tsx`

**Interfaces:**
- Consumes: 기존 `ensureFcmToken(onForegroundMessage?)` (`src/lib/firebase.ts`) — 한 번만 등록되도록 이미 내부에서 막는다.

- [ ] **Step 1: 실패 테스트** — 테스트 파일에 `vi.mock('@/lib/firebase', () => ({ ensureFcmToken: vi.fn() }))` 추가
  - `notesPage_registersFcmToken`: 렌더 후 `ensureFcmToken` 1회 호출
  - `notesPage_tokenRegistrationFails_stillRenders`: `ensureFcmToken` 이 reject → 메모 목록이 그대로 보임
- [ ] **Step 2:** `npx vitest run src/test/knowledgeNotesPage.test.tsx` → FAIL
- [ ] **Step 3: 구현** — 마운트 `useEffect` 에서 `ensureFcmToken().catch(() => {})` (포그라운드 콜백은 넘기지 않는다 — 이 화면에서는 목록을 보고 있으므로 토스트가 필요 없다).
- [ ] **Step 4:** `npm test` 전체 → PASS, `npx tsc -b`, `npm run lint` 통과
- [ ] **Step 5: 커밋** `feat: 지식 메모 화면 진입 시 푸시 토큰 등록 (#209)`
