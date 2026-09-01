# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

FE-HCM은 "헬창모임"(그룹 운동 습관 관리 앱)의 React 18 / TypeScript / Vite 프론트엔드입니다. shadcn/ui(Radix
기반)와 TailwindCSS로 구성된 PWA이며, [BE-HCM](../BE-HCM) Spring Boot API와 REST + WebSocket(STOMP)으로
통신합니다.

## 명령어

```bash
npm run dev        # 개발 서버 (포트 3000)
npm run build      # 프로덕션 빌드 (vite build)
npm run lint       # ESLint 검사 (./src, --quiet)
npm run preview    # 빌드 결과 미리보기
npm test           # 전체 테스트 실행 (vitest run)
npm test -- --run <파일명 일부>   # 특정 테스트 파일만 실행
npm run test:watch # 테스트 watch 모드
```

테스트는 Vitest + React Testing Library(jsdom)로 실행합니다(`vitest.config.ts`, 셋업은
`src/test/setup.ts`). 타입 검사는 `npx tsc --noEmit`과 `npm run lint`로 합니다(Vite 빌드 자체는
esbuild 트랜스파일이라 타입 오류를 잡지 않습니다).

## 테스트 작성 원칙 (TDD)

신규 기능을 개발할 때는 RED-GREEN-REFACTOR 방식을 따릅니다:

1. **RED** — 구현에 앞서 실패하는 테스트를 먼저 작성합니다.
2. **GREEN** — 테스트를 통과시키는 최소한의 코드를 작성합니다.
3. **REFACTOR** — 테스트가 계속 통과하는 상태를 유지하면서 코드를 정리합니다.

테스트는 `src/test/*.test.tsx`에 둡니다. 컴포넌트 테스트에서는 `@/lib/api`를 `vi.mock`으로 대체하고,
사용자 관점의 쿼리(`getByRole`의 접근성 이름 등)로 검증하는 기존 패턴을 따르세요.

## 환경 변수

`.env`에 Vite 환경 변수(`VITE_` 접두사)로 설정합니다:

- `VITE_API_BASE_URL` — REST API 베이스 URL (기본값 `http://localhost:8080/api`, `src/lib/api.ts`)
- `VITE_WS_URL` — STOMP/WebSocket 베이스 URL (기본값 `http://localhost:8080`, `src/components/ChatRoom.tsx`)
- `VITE_FIREBASE_*` (API_KEY, AUTH_DOMAIN, PROJECT_ID, SENDER_ID, APP_ID, VAPID_KEY) — FCM 푸시 알림용
  Firebase 설정 (`src/lib/firebase.ts`)
- `VITE_KAKAO_JS_KEY` — 카카오톡 초대 공유(`src/lib/kakao.ts`)에 사용하는 카카오 디벨로퍼스 앱의
  JavaScript 키. 미설정 시 초대 공유 버튼은 "초대 링크 복사" 버튼으로 자동 대체된다. 실제 발송을 테스트하려면
  [Kakao Developers](https://developers.kakao.com)에서 앱을 등록하고 사용 중인 도메인을 JavaScript SDK
  허용 도메인에 추가해야 한다.

## 아키텍처

### 라우팅 및 인증 (`src/App.tsx`)

- `react-router-dom`의 `BrowserRouter`로 라우팅하며, `@tanstack/react-query`의 `QueryClientProvider`가
  최상위를 감쌉니다.
- `AuthProvider`(`src/contexts/AuthContext.tsx`)가 `member`/`accessToken`/`refreshToken`을 `localStorage`에
  저장하고 전역 인증 상태를 제공합니다. `useAuth()` 훅으로 어디서나 접근합니다.
- 일반 인증 라우트는 `ProtectedRoute`(App.tsx 내부 컴포넌트)로, 관리자 라우트(`/admin/**`)는
  `RequireRole`(`src/components/RequireRole.tsx`, `allowedRoles={['ADMIN']}`)로 가드합니다. 두 컴포넌트
  모두 `loading` 상태를 먼저 처리한 뒤 리다이렉트 여부를 결정하는 패턴을 따릅니다.

### API 클라이언트 (`src/lib/api.ts`)

- 싱글턴 `ApiClient` 인스턴스(`export const api`)가 모든 백엔드 호출을 담당하는 단일 진입점입니다. 새 백엔드
  연동을 추가할 때는 이 클래스에 메서드를 추가하는 기존 패턴을 따르세요(도메인별로 주석 섹션 구분: Auth,
  Room, Workout, Rest, Chat, Stock, Notification, Penalty, 마이페이지, Admin).
- axios 인터셉터가 요청 시 `localStorage`의 `accessToken`을 `Authorization: Bearer` 헤더에 자동 주입하고,
  응답이 401이면 `/auth/refresh`로 토큰을 재발급받아 원 요청을 1회 재시도합니다(재발급 실패 시 로컬 스토리지를
  비우고 `window.location.reload()`). 로그인/회원가입/refresh 엔드포인트 자체는 재시도 대상에서 제외됩니다.
- `request<T>()`는 백엔드의 공통 응답 포맷(`{ success, message, data }`)에서 `data`를 벗겨 반환합니다
  (`response.data.data || response.data`). 새 API를 추가할 때 이 언랩 규칙에 맞춰 타입을 정의하세요.
- 파일 업로드는 `uploadFile<T>()`(multipart/form-data)를 사용합니다(운동 인증 이미지, 채팅 이미지, 프로필
  이미지 등).
- Admin API 섹션(`getAdminMembers`, `getAdminWorkoutRooms` 등)은 백엔드 계약을 앞서 정의해 둔 것으로, 실제
  엔드포인트 구현 여부가 백엔드 쪽 진행 상황에 따라 달라질 수 있습니다.
- `getPenaltyPayments`는 현재 실제 API 호출 대신 목(mock) 데이터를 반환하도록 임시 구현되어 있습니다
  (`TEMP: Mock data`로 주석 표시됨) — 백엔드 엔드포인트가 준비되면 교체가 필요합니다.

### 실시간 채팅 (WebSocket/STOMP)

- `src/components/ChatRoom.tsx`에서 `@stomp/stompjs`의 `Client`와 `sockjs-client`로 `${VITE_WS_URL}/wss`에
  연결합니다(백엔드의 STOMP 엔드포인트와 짝을 이룸).
- 채팅 이미지 업로드 크기 제한(`MAX_CHAT_IMAGE_SIZE_BYTES = 10MB`)과 허용 타입(`ALLOWED_IMAGE_TYPES`:
  jpeg/png/webp)이 컴포넌트 상단 상수로 정의되어 있습니다.
- 메시지 기록은 커서 기반 페이지네이션(`cursorId`, `size=20`)으로 `api.getChatHistory()`를 통해 불러옵니다.

### 푸시 알림 (Firebase Cloud Messaging)

- `src/lib/firebase.ts`의 `ensureFcmToken()`이 브라우저 알림 권한 요청 → FCM 토큰 발급 → 백엔드에
  토큰 등록(`api.registerFcmToken`)까지 처리합니다. 모듈 스코프의 `registrationPromise`로 중복 초기화를
  방지하므로, 여러 컴포넌트에서 호출해도 안전합니다.
- PWA 등록/업데이트는 `vite-plugin-pwa`(`vite.config.ts`)와 `src/hooks/usePwaUpdater.tsx` /
  `src/components/common/PwaUpdateBanner.tsx`가 담당합니다.

### UI 컴포넌트 구조

- `src/components/ui/` — shadcn/ui 프리미티브(직접 생성/수정하기보다 `components.json` 설정을 따라 shadcn
  CLI로 관리하는 것이 일반적인 패턴). alias는 `@/components`, `@/components/ui`, `@/lib`, `@/hooks`로
  `tsconfig`/`vite.config.ts`에 설정되어 있습니다.
- `src/components/` 최상위 — 도메인 컴포넌트(ChatRoom, MyWorkoutRoom, PenaltyOverview 등), 그리고
  `admin/`, `dashboard/`, `dialogs/`, `landing/`, `layout/`, `stock/`, `common/` 하위 폴더로 기능별 세분화.
- `src/pages/` — 라우트 단위 페이지(각 페이지가 여러 도메인 컴포넌트를 조합). `pages/admin/`은 관리자 전용
  페이지.

### 도메인 규칙

- `src/lib/workoutRoomRules.ts` — 운동방 관련 비즈니스 규칙(정원, 주간 목표 등) 상수/헬퍼. 운동방 생성/가입
  플로우를 수정할 때 참고하세요.
- `src/types/index.ts` — 백엔드 응답과 매핑되는 공유 타입 정의(Member, WorkoutRoom, PenaltyRecord,
  ChatMessage, PageResponse 등). 새 API 응답 타입을 추가할 때 이 파일에 정의합니다.
- `src/lib/workoutReactions.ts` — 운동 인증 리액션 이모지 카탈로그. 백엔드 `ReactionEmoji` enum과
  목록·순서를 맞춰야 합니다(서버는 리액션이 달린 이모지만 내려주므로, 피커는 이 목록으로 그립니다).
- `WorkoutSocialBar`(리액션 알약 + 이모지 피커 + 댓글 버튼)와 `WorkoutCommentDialog`가 운동 인증의
  리액션/댓글 UI입니다. **팝오버 안에서 이 바를 쓸 때는 `onOpenComments`로 댓글 다이얼로그를 팝오버
  바깥에서 열어야 합니다** — 팝오버 안에서 렌더하면 팝오버가 닫히는 순간 다이얼로그까지 언마운트됩니다.
  같은 이유로 이모지 피커는 Popover(포털)가 아니라 인라인으로 펼칩니다.
- **운동방 화면의 리액션/댓글 집계는 `WorkoutSocialProvider`(`src/contexts/WorkoutSocialContext.tsx`)가
  운동방 단위로 한 벌만 들고 있습니다.** 소셜 바는 팝오버가 닫힐 때 함께 언마운트되어 자기 상태를 잃고,
  같은 인증이 `MemberStatus`(이번주 현황)와 `MyWorkoutRoom`(월별 달력) 두 곳에 동시에 그려지기 때문입니다.
  프로바이더는 `DashboardPage`에서 `<Tabs>` **바깥**에 두어야 합니다 — 안에 두면 탭 전환 시
  `TabsContent`가 언마운트되면서 방금 남긴 리액션이 사라집니다.
- **달력(`Calendar`)의 `components.Day`는 렌더마다 새 함수로 넘기면 안 됩니다.** 컴포넌트 타입이 매번
  바뀌어 react-day-picker가 날짜 셀을 재마운트하고, 그 순간 열려 있던 팝오버가 닫힙니다. `MyWorkoutRoom`은
  타입을 `useMemo`로 고정하고 최신 렌더 함수만 ref로 갈아끼웁니다.
- **마이페이지 피드(`WorkoutFeedSection`)에서는 `WorkoutSocialBar` 대신 `WorkoutFeedSocial`을 씁니다.**
  운동 인증 한 번은 참여 중인 방 수만큼 별도 레코드로 저장되는데(백엔드 `WorkoutService.authenticateWorkout`),
  피드는 사진 중복을 피하려고 하루 한 장만 그립니다. 그래서 카드에 보이는 `reactions`/`commentCount`는
  방 전체 합계이고, 어느 방에 리액션을 남길지는 정할 수 없습니다 — 합계는 표시 전용이며 댓글을 열 때는
  `rooms[].recordId`로 방을 골라야 합니다.

## 따라야 할 컨벤션

`.cursor/rules/front-end.mdc`에 명시된 규칙(코드 작성 시 적용):

- 가능하면 조기 반환(early return) 사용.
- 스타일링은 Tailwind 유틸리티 클래스만 사용(인라인 스타일/별도 CSS 지양). 조건부 클래스는 `tailwind-merge`
  활용.
- 이벤트 핸들러는 `handle` 접두사(`handleClick`, `handleKeyDown` 등).
- 함수보다 `const` 화살표 함수 선호, 가능하면 타입을 명시.
- 복잡한 함수는 반환 타입을 명시적으로 작성.
- 타입 전용 임포트는 `import type` 사용.
- `null`/`undefined`는 옵셔널 체이닝(`?.`)과 널 병합(`??`)으로 명시적으로 처리.
- 재사용 가능한 로직은 커스텀 훅으로 분리(`src/hooks/`).
- 컴포넌트는 기본적으로 접근성(a11y)을 고려(적절한 `aria-*`, 키보드 핸들러 등) — 기존 컴포넌트들(예:
  `ChatRoom.tsx`의 이미지 버튼)의 패턴을 참고.

## GitHub 워크플로우 관례

- 브랜치명: `feature/issue-{issue_number}` 또는 `fix/issue-{issue_number}`.
- 커밋 메시지: 한국어로 작성하고 `(#{issue_number})`로 끝맺음 (예: `feat: 채팅 이미지 업로드 기능 추가 (#42)`).
- PR base 브랜치: `dev`를 거치지 않고 항상 `main`으로 바로 병합합니다.
- 자세한 자동화 절차는 `.cursor/commands/github-issue-pr-command.md` 참고.
