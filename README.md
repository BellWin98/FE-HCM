# FE-HCM

> "헬창마을" — 벌금 기반 운동 인증 서비스의 **React 18 / TypeScript / Vite 프론트엔드(PWA)**입니다.
> <br>shadcn/ui(Radix 기반)와 TailwindCSS로 구성되어 있으며,
> <br>운동방에서의 운동 인증, 실시간 채팅, 벌금 관리, 주식 시세 조회, 푸시 알림 등의 화면을 제공합니다.

백엔드 저장소는 [`BE-HCM`](../BE-HCM)이며, REST(`{ success, message, data }` 응답 포맷) + WebSocket(STOMP)으로
연동됩니다.

## 목차

- [기술 스택](#기술-스택)
- [핵심 기능](#핵심-기능)
- [프로젝트 구조](#프로젝트-구조)
- [사전 요구 사항](#사전-요구-사항)
- [환경 설정](#환경-설정)
- [실행 방법](#실행-방법)
- [배포 및 파이프라인 (CI/CD)](#배포-및-파이프라인-cicd)

---

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| 언어 | ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white) |
| 프레임워크 / 빌드 | ![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black) + ![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white) (`@vitejs/plugin-react-swc`) |
| UI | shadcn/ui(Radix UI 프리미티브) + ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white) (`tailwind-merge`, `tailwindcss-animate`) |
| 상태/데이터 패칭 | `@tanstack/react-query` 5.56, `axios` 1.10 |
| 라우팅 | `react-router-dom` 6.26 |
| 폼/검증 | `react-hook-form` 7.53 + `zod` 3.23 (`@hookform/resolvers`) |
| 실시간 통신 | `@stomp/stompjs` 7.1 + `sockjs-client` 1.6 (STOMP over SockJS) |
| PWA | `vite-plugin-pwa` 1.1 (`registerType: autoUpdate`) |
| 푸시 알림 | `firebase` 12.6 (FCM) |
| 차트 | `recharts` 2.12 (주식 시세 등) |
| 날짜 | `date-fns` 3.6 |
| 테스트 | `vitest` 4.1 + `@testing-library/react` 16.3 (구성은 되어 있으나 실제 테스트 스위트는 아직 미비) |
| 린트 | ESLint 9(flat config, `eslint.config.js`) + `typescript-eslint` 8.0 |
| 배포 | Vercel (`vercel.json` SPA rewrite 설정) |

## 핵심 기능

- **인증**: `AuthProvider`(`src/contexts/AuthContext.tsx`)가 `member`/`accessToken`/`refreshToken`을
  `localStorage`에 저장하고 전역 인증 상태를 제공합니다(`useAuth()`). 일반 라우트는 `ProtectedRoute`, 관리자
  라우트(`/admin/**`)는 `RequireRole`(`allowedRoles={['ADMIN']}`)로 가드됩니다.
- **API 연동**: 싱글턴 `ApiClient`(`src/lib/api.ts`, `export const api`)가 모든 백엔드 호출의 단일 진입점입니다.
  axios 인터셉터가 요청마다 `Authorization: Bearer` 헤더를 자동 주입하고, 401 응답 시 `/auth/refresh`로 토큰을
  재발급받아 원 요청을 1회 재시도합니다(재발급 실패 시 로컬 스토리지를 비우고 페이지를 새로고침).
- **운동방/운동 인증**: 운동방 생성/참여, 일일 운동 인증(이미지 업로드 포함), 방 멤버 현황을 보여주는 화면
  (`MyWorkoutRoom.tsx`, `AvailableWorkoutRooms.tsx`, `WorkoutFeedSection.tsx`, `WorkoutSuccessDialog.tsx` 등)을
  제공합니다. 정원·주간 목표 등 규칙은 `src/lib/workoutRoomRules.ts`에 정의되어 있습니다.
- **실시간 채팅**: `src/components/ChatRoom.tsx`에서 `${VITE_WS_URL}/wss`로 STOMP/SockJS 연결. 이미지 업로드
  크기 제한(10MB) 및 허용 타입(jpeg/png/webp), 커서 기반 페이지네이션(`cursorId`, `size=20`) 메시지 히스토리를
  지원합니다.
- **벌금 관리**: `PenaltyOverview.tsx`, `PenaltyAccountManager.tsx`, `PenaltySettingsSection.tsx`로 벌금 계좌
  및 납부 현황을 관리합니다. 다만 `api.getPenaltyPayments`는 현재 실제 API 대신 목(mock) 데이터를 반환하도록
  임시 구현되어 있습니다(`TEMP: Mock data` 주석 표시).
- **주식 시세**: `StockChart.tsx` + `recharts`로 한국투자증권 연동 시세 데이터를 시각화합니다.
- **푸시 알림(FCM)**: `src/lib/firebase.ts`의 `ensureFcmToken()`이 브라우저 알림 권한 요청 → FCM 토큰 발급 →
  백엔드 등록(`api.registerFcmToken`)까지 처리하며, 중복 초기화를 방지합니다.
- **PWA**: `vite-plugin-pwa`로 서비스 워커 자동 업데이트, 오프라인 캐싱, 홈 화면 설치를 지원하며
  (`usePwaUpdater.tsx`, `PwaUpdateBanner.tsx`), 매니페스트 이름은 "HCM"입니다.
- **관리자 화면**: `/admin/**` 라우트(`pages/admin/`, `components/admin/`)에서 회원/운동방 등을 관리합니다.
  단, 일부 Admin API(`getAdminMembers`, `getAdminWorkoutRooms` 등)는 백엔드 계약을 앞서 정의해 둔 것으로,
  실제 엔드포인트 존재 여부는 백엔드 진행 상황에 따라 달라질 수 있습니다.

## 프로젝트 구조

```
FE-HCM/
├── src/
│   ├── App.tsx                  # BrowserRouter + QueryClientProvider, ProtectedRoute/RequireRole 라우팅
│   ├── main.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx      # 인증 상태(member/accessToken/refreshToken) 전역 관리, useAuth()
│   ├── lib/
│   │   ├── api.ts                 # ApiClient 싱글턴 (Auth/Room/Workout/Chat/Stock/Notification/Penalty/Admin)
│   │   ├── firebase.ts            # FCM 토큰 발급/등록 (ensureFcmToken)
│   │   └── workoutRoomRules.ts    # 운동방 정원/주간 목표 등 도메인 규칙
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 프리미티브 (components.json 기준 shadcn CLI로 관리)
│   │   ├── admin/                 # 관리자 전용 컴포넌트
│   │   ├── dashboard/ dialogs/ landing/ layout/ stock/ common/
│   │   ├── ChatRoom.tsx, MyWorkoutRoom.tsx, AvailableWorkoutRooms.tsx
│   │   ├── PenaltyOverview.tsx, PenaltyAccountManager.tsx, PenaltySettingsSection.tsx
│   │   ├── WorkoutFeedSection.tsx, WorkoutSuccessDialog.tsx, MemberStatus.tsx
│   │   ├── StockChart.tsx, UserProfileSection.tsx, RoomCodeSection.tsx
│   │   └── RequireRole.tsx        # /admin/** 라우트 가드
│   ├── pages/                   # 라우트 단위 페이지 (pages/admin 포함)
│   ├── hooks/                   # 커스텀 훅 (usePwaUpdater 등)
│   ├── types/index.ts           # 백엔드 응답과 매핑되는 공유 타입 (Member, WorkoutRoom, PenaltyRecord, ChatMessage, PageResponse 등)
│   ├── api/                     # (도메인별 API 헬퍼/타입 보조)
│   ├── utils/
│   └── test/                    # 테스트 셋업 (vitest)
├── public/                      # 정적 자산 (PWA 아이콘, firebase-messaging-sw.js 등)
├── docs/
├── vite.config.ts               # alias(@ → src), vite-plugin-pwa(manifest, autoUpdate) 설정
├── vitest.config.ts
├── tailwind.config.ts / postcss.config.js
├── eslint.config.js             # ESLint 9 flat config
├── components.json              # shadcn/ui CLI 설정
├── vercel.json                  # SPA rewrite ("/(.*)" → "/index.html")
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── package.json
```

## 사전 요구 사항

| 도구 | 버전 | 비고 |
| --- | --- | --- |
| Node.js | 18 이상 권장 (LTS) | `package.json`에 engines 명시는 없음, Vite 5 / TS 5.5 호환 버전 사용 |
| npm | Node.js와 함께 설치되는 버전 | 저장소에 `package-lock.json` 포함 |
| BE-HCM 서버 | — | REST/WebSocket 연동을 위해 함께 구동 필요 (기본 `http://localhost:8080`), 자세한 내용은 [`../BE-HCM/README.md`](../BE-HCM/README.md) 참고 |

## 환경 설정

`.env` 파일에 Vite 환경 변수(`VITE_` 접두사)로 설정합니다.

```bash
# FE-HCM/.env 예시
VITE_API_BASE_URL=http://localhost:8080/api     # REST API 베이스 URL (기본값, src/lib/api.ts)
VITE_WS_URL=http://localhost:8080                # STOMP/WebSocket 베이스 URL (기본값, src/components/ChatRoom.tsx, 내부적으로 /wss 접속)

# Firebase(FCM) 설정 - Firebase 콘솔 > 프로젝트 설정에서 발급 (src/lib/firebase.ts)
VITE_FIREBASE_API_KEY=[이곳에 정보 입력]
VITE_FIREBASE_AUTH_DOMAIN=[이곳에 정보 입력]
VITE_FIREBASE_PROJECT_ID=[이곳에 정보 입력]
VITE_FIREBASE_STORAGE_BUCKET=[이곳에 정보 입력]
VITE_FIREBASE_SENDER_ID=[이곳에 정보 입력]
VITE_FIREBASE_APP_ID=[이곳에 정보 입력]
VITE_FIREBASE_MEASUREMENT_ID=[이곳에 정보 입력]
VITE_FIREBASE_VAPID_KEY=[이곳에 정보 입력]
```

| 변수 | 설명 |
| --- | --- |
| `VITE_API_BASE_URL` | 백엔드 REST API 베이스 URL. 기본값 `http://localhost:8080/api` |
| `VITE_WS_URL` | 백엔드 STOMP/WebSocket 베이스 URL. 기본값 `http://localhost:8080` (`/wss` 경로로 접속) |
| `VITE_FIREBASE_*` | FCM 푸시 알림용 Firebase 클라이언트 설정값 |

> Firebase 클라이언트 설정값은 브라우저 번들에 그대로 노출되는 공개 식별자이지만, 프로젝트별 값이므로 실제
> 서비스 계정 값은 Firebase 콘솔에서 직접 발급받아 채워야 합니다.

## 실행 방법

```bash
npm install

npm run dev       # 개발 서버 (http://localhost:3000)
npm run build     # 프로덕션 빌드 (vite build → dist/)
npm run preview   # 빌드 결과 미리보기
npm run lint      # ESLint 검사 (./src, --quiet)
npm run test      # vitest run (1회 실행)
npm run test:watch  # vitest 워치 모드
```

개발 서버 실행 전 [`BE-HCM`](../BE-HCM)이 `http://localhost:8080`에서 함께 구동 중이어야 API/WebSocket 연동이
정상 동작합니다(`.env`의 `VITE_API_BASE_URL` / `VITE_WS_URL` 참고).

> 별도의 Docker / Dockerfile은 이 저장소에 구성되어 있지 않습니다. 컨테이너 배포가 필요하다면 `npm run build`
> 산출물(`dist/`)을 Nginx 등 정적 파일 서버 이미지로 감싸는 방식을 검토하세요.

## 배포 및 파이프라인 (CI/CD)

저장소 내에 별도의 GitHub Actions 워크플로우는 구성되어 있지 않습니다. `vercel.json`(SPA rewrite: 모든 경로를
`/index.html`로 라우팅)으로 미루어 볼 때 **Vercel**의 Git 연동 배포(브랜치 push 시 자동 빌드/배포)를 사용하는
것으로 보입니다.

- Vercel 프로젝트 설정(Environment Variables)에 위의 `VITE_API_BASE_URL`, `VITE_WS_URL`, `VITE_FIREBASE_*`
  값을 등록해야 합니다.
- 프로덕션 API 서버 주소(`VITE_API_BASE_URL`)는 `BE-HCM`의 배포 환경(`app.frontend-url: https://www.bellwin.co.kr`,
  CORS 허용 도메인 `https://www.bellwin.co.kr` / `https://dev.bellwin.co.kr`)과 짝을 맞춰 설정해야 합니다.

## GitHub 워크플로우 관례

- 브랜치명: `feature/issue-{issue_number}` 또는 `fix/issue-{issue_number}`
- 커밋 메시지: 한국어로 작성하고 `(#{issue_number})`로 끝맺음 (예: `feat: 채팅 이미지 업로드 기능 추가 (#42)`)
- PR base 브랜치: `dev`를 거치지 않고 항상 `main`으로 바로 병합
- 자세한 자동화 절차는 `.cursor/commands/github-issue-pr-command.md` 참고

## 코드 컨벤션

`.cursor/rules/front-end.mdc`에 명시된 규칙:

- 가능하면 조기 반환(early return) 사용
- 스타일링은 Tailwind 유틸리티 클래스만 사용(인라인 스타일/별도 CSS 지양), 조건부 클래스는 `tailwind-merge` 활용
- 이벤트 핸들러는 `handle` 접두사(`handleClick`, `handleKeyDown` 등)
- 함수보다 `const` 화살표 함수 선호, 가능하면 타입을 명시
- 타입 전용 임포트는 `import type` 사용
- `null`/`undefined`는 옵셔널 체이닝(`?.`)과 널 병합(`??`)으로 명시적으로 처리
- 재사용 가능한 로직은 커스텀 훅으로 분리(`src/hooks/`)
- 컴포넌트는 기본적으로 접근성(a11y)을 고려(`aria-*`, 키보드 핸들러 등)
