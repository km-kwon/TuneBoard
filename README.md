# TuneBoard

> YouTube와 YouTube Music을 하나의 대시보드로 — 검색, 재생, 큐, 테마, 그리고 내 청취 통계까지.

TuneBoard는 "음악이 듣고 싶을 땐 YouTube Music, MV가 보고 싶을 땐 YouTube"를 오가며 생기는 컨텍스트 전환 피로를 해결하기 위해 만든 개인 포트폴리오 프로젝트입니다. 두 앱을 번갈아 띄우지 않고, 한 화면에서 모드만 바꾸면 같은 큐가 그대로 이어서 재생됩니다.

![TuneBoard screenshot placeholder](./docs/screenshot.png)

## Highlights

- **Unified Music ↔ Video mode** — 같은 큐를 음원/뮤직비디오 어느 쪽이든 재생.
- **YouTube IFrame Player API** 기반 커스텀 트랜스포트 — 자체 플레이어 바, Now Playing, Queue, 진도 조절.
- **My Stats 대시보드** — 하루/7일/30일 기준 총 청취, 상위 아티스트 도넛, Top 트랙, 장르 레이더, 시간대 히트맵. 전부 SVG로 직접 렌더.
- **8개 테마 프리셋 + 커스텀 픽커** — 색상 3축 + 밝기 슬라이더를 실시간 CSS 변수로 반영, localStorage에 영속화.
- **인터랙티브 디테일** — 오디오 비주얼라이저 4종, 좋아요 파티클 버스트, 앨범 3D 플립, 셔플 카드 애니, 셔플/큐 추가 토스트, 사이드바 스태거드 패럴럭스.
- **반응형** — 데스크톱(사이드바 + 3-column 플레이어) → 태블릿(사이드바 접힘) → 모바일(하단 탭 바 + 컴팩트 플레이어 + 스와이프 업 Now Playing).
- **PWA** — manifest + service worker(쉘 캐시, API network-first), 설치 프롬프트.
- **Media Session API** — 잠금 화면/헤드셋 버튼/미디어 키에서 재생·일시정지·이전·다음·10초 탐색.
- **접근성** — Skip link, aria-live 트랙 변경 안내, 키보드 네비게이션, 일관된 focus ring, prefers-reduced-motion 대응.

## Why I built this

YouTube Music의 플레이리스트 UX는 좋지만 뮤비는 못 보고, YouTube는 뮤비는 되지만 재생 관리가 약합니다. 실제로 제가 느낀 컨텍스트 전환 비용을 줄이기 위해, 두 서비스의 장점을 한 화면에서 통합하고 **재생 상태(큐/재생 시간/진도)가 모드 전환에도 유지되도록** 상태 계층을 직접 설계했습니다.

## Tech stack & 선택 이유

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 번들러 | Vite 5 | 빠른 HMR, Vite 표준 프록시로 backend 붙이기 간단 |
| UI | React 18 + TypeScript | 팀 협업·유지보수의 기본값, strict 타입 이득 |
| 스타일 | Tailwind CSS 3 + CSS 변수 | 테마 전환을 CSS 변수로 처리하면 런타임 비용 0 |
| 상태 | Zustand + persist 미들웨어 | Redux보다 보일러플레이트 적음, localStorage 영속화 내장 |
| 데이터 | @tanstack/react-query | stale/cache 정책 일관 관리, 재시도/포커스 리페치 제어 |
| 애니메이션 | framer-motion | 레이아웃 애니·드래그·useReducedMotion 한 번에 |
| 가상 스크롤 | react-virtuoso | 대용량 리스트(검색/플레이리스트) 60fps 유지 |
| 미디어 | YouTube IFrame Player API | 공식 라이선스 트랙을 직접 포스트프로세싱 없이 재생 |
| Backend | FastAPI + ytmusicapi | 비공식 API 응답을 Pydantic으로 정규화해 안전하게 프록시 |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│                                                             │
│  React + Zustand (playerStore, uiStore, statsStore)         │
│       │                                                     │
│       ├── useYouTubePlayer ──► YouTube IFrame API           │
│       │                                                     │
│       ├── useMediaSession  ──► navigator.mediaSession       │
│       │                        (OS 잠금화면/미디어 키)       │
│       │                                                     │
│       └── /api/*  ──► Vite dev proxy ──► FastAPI backend    │
│                                                   │         │
│                                                   ▼         │
│                                            ytmusicapi       │
└─────────────────────────────────────────────────────────────┘
```

- **Zustand stores**는 각자 persist 파티션을 가져 volume·theme·likedIds·통계 이벤트만 골라서 localStorage에 저장합니다. 재생 진도 같은 휘발 데이터는 저장하지 않습니다.
- **Stats 이벤트 기록**은 200ms 진도 루프가 아니라 5초 스로틀을 걸어 persist 쓰기를 빈도 1/25로 줄였습니다.
- **Route code-splitting** — 각 페이지는 `React.lazy`로 분할되고 Suspense 폴백은 실제 레이아웃을 닮은 스켈레톤을 렌더합니다.

## 성능 메모

- YouTube iframe은 PCM을 노출하지 않으므로 비주얼라이저는 트랙별 결정론적 RNG로 CSS keyframe 계수를 고정 — GPU transform만 돌리면 60fps 유지.
- Zustand selector는 모든 컴포넌트에서 원시값 단위로 subscribe하여 불필요한 리렌더를 차단.
- `prefers-reduced-motion` 미디어 쿼리 한 곳에서 모든 애니를 무력화, 드래그 제스처도 동일 hook으로 우회.
- 진행바 tooltip/hover 상태는 로컬 state로 격리해 상위 re-render 파급 차단.

## 로컬 실행

필요: Node 20+, Python 3.11+, uv/pip.

```bash
# 1) Frontend
npm install
npm run dev          # http://localhost:5173

# 2) Backend (별도 터미널)
cd backend
pip install -r requirements.txt
# (선택) YouTube Music 로그인 headers: backend/README.md 참고
uvicorn app.main:app --reload --port 8000
```

Vite가 `/api/*`를 `localhost:8000`으로 프록시합니다. 프런트만 띄워도 더미 데이터로 대부분의 UX를 확인할 수 있습니다.

## 배포

- **Frontend**: Vercel — `vercel.json`에 SPA 폴백 규칙이 들어가 있습니다. 환경변수 `VITE_API_BASE`(선택)를 설정하면 동일 오리진 대신 외부 API를 호출합니다.
- **Backend**: Railway/Render — `backend/` 디렉터리를 별도 서비스로 배포하고 `TUNEBOARD_CORS_ORIGINS`에 프런트 도메인을 콤마로 나열합니다.

자세한 단계는 [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## 스크립트

```bash
npm run dev         # 개발 서버
npm run typecheck   # TS 타입 검사
npm run build       # 프로덕션 빌드 (tsc + vite)
npm run preview     # 빌드 결과 로컬 프리뷰
```

## 라이선스

개인 포트폴리오 목적의 프로젝트입니다. YouTube 및 YouTube Music의 이용 약관을 준수하여 데모 용도로만 사용하세요.
