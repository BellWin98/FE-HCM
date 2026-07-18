# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

FE-HCM은 "헬창모임"(그룹 운동 습관 관리 앱)의 React 18 / TypeScript / Vite 프론트엔드입니다. shadcn/ui(Radix
기반)와 TailwindCSS로 구성된 PWA이며, [BE-HCM](../BE-HCM) Spring Boot API와 REST + WebSocket(STOMP)으로
통신합니다.

## 명령어

```bash
npm run dev       # 개발 서버 (포트 3000)
npm run build     # 프로덕션 빌드 (vite build)
npm run lint      # ESLint 검사 (./src, --quiet)
npm run preview   # 빌드 결과 미리보기
```

별도의 테스트 러너/테스트 스위트는 구성되어 있지 않습니다. 타입 검사는 빌드(`tsc` 없이 Vite/esbuild가 트랜스파일)
와 `npm run lint`로 갈음합니다.

## 환경 변수

`.env`에 Vite 환경 변수(`VITE_` 접두사)로 설정합니다:

- `VITE_API_BASE_URL` — REST API 베이스 URL (기본값 `http://localhost:8080/api`, `src/lib/api.ts`)
- `VITE_WS_URL` — STOMP/WebSocket 베이스 URL (기본값 `http://localhost:8080`, `src/components/ChatRoom.tsx`)
- `VITE_FIREBASE_*` (API_KEY, AUTH_DOMAIN, PROJECT_ID, SENDER_ID, APP_ID, VAPID_KEY) — FCM 푸시 알림용
  Firebase 설정 (`src/lib/firebase.ts`)

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
