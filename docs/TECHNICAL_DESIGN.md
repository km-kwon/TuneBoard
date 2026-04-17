# TuneBoard — Technical Design Document

> YouTube Music + YouTube Video 통합 웹 대시보드
> v0.1 / 2026-04-17

---

## 0. 설계 원칙 (Guiding Principles)

1. **재생 컨텍스트는 절대 끊기지 않는다.** 라우팅, 모달, 탭 전환, 비디오 모드 진입 어떤 경우에도 재생 상태는 유지된다. → 플레이어 인스턴스는 App 루트에 단 하나, 상태는 Zustand.
2. **낙관적 UI + 서버 동기화.** 큐 재정렬, 좋아요, 플레이리스트 편집은 즉시 반영. 서버 실패 시 롤백.
3. **백엔드는 얇게.** FastAPI는 ytmusicapi 래핑 + 인증 + 캐시 레이어. 비즈니스 로직은 프론트에 둔다.
4. **키보드 우선.** 모든 재생 제어에 단축키 매핑. 마우스는 보조 수단.

---

## 1. 시스템 아키텍처

### 1.1 통신 흐름 개요

```
 ┌─────────────────────────────────────────────────────────┐
 │                     Browser (Client)                     │
 │                                                          │
 │  ┌─────────────┐      ┌──────────────────────────────┐  │
 │  │  React App  │──┬──▶│  YouTube IFrame Player API   │  │
 │  │  (Vite SPA) │  │   │  (hidden iframe, audio only) │  │
 │  │             │  │   └──────────────────────────────┘  │
 │  │  Zustand    │  │   ┌──────────────────────────────┐  │
 │  │  Stores     │  └──▶│  Visible Video Iframe (Mode) │  │
 │  │             │      └──────────────────────────────┘  │
 │  │  React      │                                        │
 │  │  Query      │◀───HTTPS/JSON──┐                       │
 │  └─────────────┘                │                       │
 └─────────────────────────────────┼───────────────────────┘
                                   │
                                   ▼
 ┌─────────────────────────────────────────────────────────┐
 │            FastAPI Backend (Railway/Render)              │
 │                                                          │
 │  Routers ─▶ Services ─▶ ytmusicapi  ─▶ YouTube Music    │
 │                      ─▶ yt-dlp/oEmbed ─▶ YouTube         │
 │                      ─▶ Redis Cache (optional)           │
 │                      ─▶ Lyrics Provider (optional)       │
 └─────────────────────────────────────────────────────────┘
```

### 1.2 YouTube IFrame API 연동 구조

- **인스턴스 1개 원칙.** `PlayerBar` 하단에 숨겨진 `<div id="yt-audio-root">`에 단일 플레이어를 mount. 비디오 모드 진입 시 동일 인스턴스를 DOM에서 재배치하는 것이 아니라, **별도의 비디오용 인스턴스를 두 번째 iframe에 띄우고 현재 재생 위치(currentTime)를 넘겨 심리스 전환**한다.
- 플레이어 상태 이벤트(`onStateChange`, `onError`)는 `useYouTubePlayer` 훅에서 수신 → `playerStore.setPlaybackState(state)` 디스패치.
- `requestAnimationFrame` 기반 progress tick (250ms 스로틀)으로 `playerStore.currentTime` 갱신. 드래그 탐색 중에는 tick 일시 정지.

```
useYouTubePlayer (hook)
   │
   ├─ load()        → playerRef.loadVideoById(videoId, startSec)
   ├─ play/pause()  → playerRef.playVideo()/pauseVideo()
   ├─ seek(sec)     → playerRef.seekTo(sec, true)
   ├─ volume(n)     → playerRef.setVolume(n)
   │
   └─ subscribe onStateChange ─▶ playerStore actions
```

### 1.3 ytmusicapi 데이터 흐름

```
Client                    FastAPI                  ytmusicapi         YT Music
  │     GET /playlists      │                           │                │
  │────────────────────────▶│  get_library_playlists()  │                │
  │                         │──────────────────────────▶│                │
  │                         │                           │───────────────▶│
  │                         │                           │◀───────────────│
  │                         │◀──────────────────────────│                │
  │                         │  [Normalize → DTO]        │                │
  │◀────────────────────────│                           │                │
```

- 인증: 초기 MVP는 `headers_auth.json`을 서버 env로 주입 (싱글 유저 / 본인용). v2에서 OAuth flow.
- 정규화: ytmusicapi의 응답 shape이 엔드포인트마다 상이 → 서버에서 공통 DTO(`Track`, `Playlist`, `Artist`, `Album`)로 평탄화한 뒤 반환.
- 캐시: Redis가 있으면 `playlists`는 5분 TTL, `search`는 30초, `lyrics`는 영구. 없으면 in-memory LRU (maxSize=256).

### 1.4 상태 관리 구조 (개요)

```
┌─────────────────────────── Client State (Zustand) ──────────────────────────┐
│                                                                             │
│   playerStore     playlistStore    searchStore    uiStore     historyStore  │
│   (재생/큐)        (내 리스트)      (검색 입력)     (테마/모드)  (최근 이력)    │
│                                                                             │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ subscribe / actions
                                   ▼
┌─────────────────────── Server State (React Query) ────────────────────────┐
│                                                                           │
│   useMyPlaylists()   usePlaylist(id)   useSearch(q,type)   useLyrics(id)  │
│   useRecommendations()   useHistory()                                     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

- **원칙:** 서버에서 받은 "진실"은 React Query 캐시에만 존재. Zustand는 UI 상호작용 상태와 파생 상태(현재 재생 곡, 큐 순서)만 보관.
- 큐는 예외: `playlistStore`에서 곡 목록을 받아 `playerStore.queue`로 복사(=snapshot). 이후 큐 편집은 서버 상태와 분리된다.

---

## 2. 컴포넌트 트리

```
<App>                                      전역 레이아웃, 단축키 리스너, ThemeProvider
├─ <Sidebar />                             네비게이션 (홈/검색/라이브러리), 플레이리스트 리스트
├─ <MainContent>                           라우팅된 본문 영역
│  ├─ <TopBar>                             뒤로가기, 사용자 메뉴
│  ├─ <SearchBar />                        통합 검색 입력, 자동완성
│  └─ <ContentArea>                        아래 중 하나가 활성
│     ├─ <HomeView />                      추천, 최근 재생
│     ├─ <PlaylistView />                  플레이리스트 상세, 트랙 리스트 + DnD
│     ├─ <SearchResultsView />             섹션별 검색 결과 (songs/videos/artists)
│     └─ <VideoView />                     풀스크린 영상 시청 모드
├─ <PlayerBar />                           하단 고정, 재생 컨트롤, 프로그레스, 볼륨
│  ├─ <NowPlaying />                       커버 + 제목 + 아티스트 + 좋아요
│  ├─ <PlaybackControls />                 이전/재생/다음/셔플/반복
│  ├─ <ProgressSlider />                   탐색 가능한 프로그레스 바
│  ├─ <VolumeControl />                    볼륨 슬라이더 + 뮤트
│  └─ <ExtraControls />                    큐 열기, 가사 열기, 비디오 모드 토글
├─ <QueuePanel />                          우측 슬라이드인 큐 패널
├─ <LyricsPanel />                         우측 또는 중앙 가사 패널
├─ <MiniPlayer />                          PiP 모드 시 render
├─ <CoverVisualizer />                     오디오 비트 시각화 (풀스크린/확장 시)
└─ <ShortcutsOverlay />                    '?' 눌렀을 때 단축키 안내
```

### 2.1 주요 컴포넌트 책임 & 인터페이스

#### `<App />`
- **책임:** 라우팅, 테마 주입, 전역 키보드 이벤트 바인딩, YouTube IFrame API 스크립트 로드 감지.
- **state:** 없음 (스토어 구독만).

#### `<Sidebar />`
- **책임:** 라우트 이동, 내 플레이리스트 목록 렌더.
- **data:** `useMyPlaylists()`.
- **props:** 없음 (자체적으로 store/query 사용).

#### `<SearchBar />`
```ts
interface SearchBarProps {
  autoFocus?: boolean;
}
```
- **책임:** 입력 → `searchStore.setQuery` → debounced query trigger. 자동완성은 `useSearchSuggestions(q)`.
- **state:** 입력값 (controlled via store), 포커스 상태 (local).

#### `<ContentArea />`
- **책임:** `uiStore.mode`와 라우트에 따라 하위 View를 스위칭. 단순 라우팅 셀.

#### `<PlaylistView />`
```ts
interface PlaylistViewProps {
  playlistId: string;
}
```
- **책임:** 플레이리스트 상세, DnD 재정렬 (`@dnd-kit`), 곡 클릭 → `playerStore.playTrack(track, { source: playlistId })`.
- **data:** `usePlaylist(playlistId)`.

#### `<PlayerBar />`
- **책임:** `playerStore` 구독하여 현재 곡/재생상태 렌더. 비즈니스 로직 없음, 하위 컨트롤에 위임.
- **state:** 없음.

#### `<PlaybackControls />`
- **책임:** play/pause/next/prev/shuffle/repeat 버튼 → `playerStore` actions 호출.
- **props:** `compact?: boolean` (MiniPlayer 재사용).

#### `<ProgressSlider />`
```ts
interface ProgressSliderProps {
  variant?: 'default' | 'compact';
}
```
- **책임:** `playerStore.currentTime/duration` 렌더. 드래그 시작 → `setScrubbing(true)` (tick 정지), 드래그 종료 → `seek()`.
- **local state:** `dragValue`, `isDragging`.

#### `<QueuePanel />`
- **책임:** `playerStore.queue` 렌더, DnD 재정렬, 항목 제거, "다음에 재생" 토글.

#### `<VideoView />`
```ts
interface VideoViewProps {
  videoId: string;
}
```
- **책임:** 비디오 전용 iframe 마운트. 진입 시 `uiStore.setMode('video')`, 퇴장 시 `'music'`. 오디오 플레이어와의 동시/배타 재생은 `playerStore.videoSyncMode`에 따라 결정.

#### `<MiniPlayer />`
- **책임:** 브라우저 Document PiP API 사용 (지원 시). 미지원 시 floating window 대체. 내부에 `<PlaybackControls compact />` + 커버 썸네일.

#### `<CoverVisualizer />`
- **책임:** WebAudio API로 iframe 오디오를 직접 분석할 수 없으므로, **비트 데이터는 pseudo-reactive**: 재생 시작 시점 + BPM 추정(선택) 기반으로 CSS 변수 애니메이션 구동. 확장 모드에서는 Canvas 2D 셰이더 스타일 링/파티클.

---

## 3. Zustand Store 설계

```ts
// src/stores/types.ts
export type RepeatMode = 'off' | 'all' | 'one';
export type AppMode = 'music' | 'video';
export type VideoSyncMode = 'pause-music' | 'play-both';

export interface Track {
  videoId: string;
  title: string;
  artists: { id: string; name: string }[];
  album?: { id: string; name: string };
  durationSec: number;
  thumbnailUrl: string;
  isVideo?: boolean; // ytm 뮤직 비디오 구분
}
```

### 3.1 `playerStore`

```ts
interface PlayerState {
  // 재생 상태
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
  currentTrack: Track | null;
  currentTime: number;           // sec, tick으로 갱신
  duration: number;
  isScrubbing: boolean;

  // 볼륨
  volume: number;                // 0~100, localStorage 영속화
  isMuted: boolean;

  // 큐
  queue: Track[];                // 현재 재생 큐 (스냅샷)
  queueIndex: number;            // 현재 재생 인덱스
  queueSource?: { type: 'playlist' | 'search' | 'manual'; id?: string };

  // 옵션
  shuffle: boolean;
  repeat: RepeatMode;
  videoSyncMode: VideoSyncMode;

  // actions
  playTrack: (track: Track, opts?: { queue?: Track[]; index?: number }) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;              // 3초 이내면 이전곡, 이후면 처음으로
  seek: (sec: number) => void;
  setScrubbing: (v: boolean) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;       // off → all → one → off

  // 큐 편집
  addToQueue: (track: Track, position?: 'next' | 'end') => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;

  // 내부
  _onEnded: () => void;          // IFrame ended 이벤트 핸들러
  _tick: (time: number) => void;
}
```

**영속화 (persist middleware):** `volume`, `isMuted`, `shuffle`, `repeat`, `videoSyncMode`만 localStorage. `queue`는 세션 단위 (sessionStorage).

### 3.2 `playlistStore`

```ts
interface PlaylistState {
  selectedPlaylistId: string | null;
  // DnD 편집 중인 로컬 순서 (서버 commit 전)
  draftOrder: Record<string, string[]>; // playlistId → videoId[]

  setSelected: (id: string | null) => void;
  startDraft: (id: string, initial: string[]) => void;
  updateDraft: (id: string, order: string[]) => void;
  commitDraft: (id: string) => Promise<void>; // API 호출 + 성공 시 draft 삭제
  discardDraft: (id: string) => void;
}
```

> 플레이리스트 **목록/상세 데이터 자체는 React Query**가 소유. 이 스토어는 "지금 사용자가 어떤 걸 보고 있고, 편집 중인 변경사항이 무엇인가"만 책임진다.

### 3.3 `searchStore`

```ts
interface SearchState {
  query: string;
  debouncedQuery: string;                // 300ms
  filter: 'all' | 'songs' | 'videos' | 'artists' | 'albums';
  recentQueries: string[];               // 최근 10개, localStorage 영속화

  setQuery: (q: string) => void;
  setFilter: (f: SearchState['filter']) => void;
  commitRecent: (q: string) => void;     // 실제 검색 실행 시 호출
  clearRecents: () => void;
}
```

### 3.4 `uiStore`

```ts
interface UIState {
  theme: 'spotify-green' | 'retro' | 'monochrome' | 'custom';
  accentColor: string;                   // custom 테마용
  sidebarCollapsed: boolean;
  mode: AppMode;                         // music | video
  panels: {
    queue: boolean;
    lyrics: boolean;
    visualizer: 'compact' | 'expanded' | 'off';
  };
  shortcutsOverlayOpen: boolean;

  setTheme: (t: UIState['theme']) => void;
  setAccentColor: (hex: string) => void;
  toggleSidebar: () => void;
  setMode: (m: AppMode) => void;
  togglePanel: (key: keyof UIState['panels']) => void;
  setVisualizer: (v: UIState['panels']['visualizer']) => void;
}
```

**영속화:** 전체 (localStorage, key: `tuneboard.ui`).

### 3.5 `historyStore`

```ts
interface HistoryEntry {
  track: Track;
  playedAt: number;      // epoch ms
  source?: string;       // playlistId | 'search' | 'recommendation'
  listenedSec: number;   // 실제 들은 시간 (50% 이상만 "완청"으로 집계)
}

interface HistoryState {
  entries: HistoryEntry[];               // 최대 500개, 초과 시 FIFO
  push: (entry: HistoryEntry) => void;
  clear: () => void;

  // 파생 셀렉터 (useShallow 권장)
  getTodayCount: () => number;
  getByHour: () => Record<number, number>;  // 시각화용
  getTopArtists: (limit?: number) => { name: string; count: number }[];
}
```

**영속화:** localStorage. 서버 `/api/history`는 백엔드 기록과 병합 (v2).

### 3.6 Store 간 상호작용 규칙

- `playerStore.playTrack` 호출 시 → 내부에서 `historyStore.push` 예약 (재생 시작 후 10초 시점에 기록).
- `uiStore.mode === 'video'`일 때 `playerStore.togglePlay`는 `videoSyncMode`에 따라 오디오/비디오 중 대상이 달라진다.
- 스토어 간 직접 참조 대신 **얇은 코디네이터 훅** (`usePlaybackCoordinator`)에서 조합. 순환 의존 방지.

---

## 4. API 엔드포인트 설계 (FastAPI)

### 4.1 공통 사양

- **Base URL:** `https://api.tuneboard.app`
- **Content-Type:** `application/json; charset=utf-8`
- **인증 (MVP):** 서버 env에 사용자의 ytmusic `headers_auth.json` 주입. 클라이언트는 토큰 불필요.
- **인증 (v2):** `Authorization: Bearer <JWT>` + 유저별 ytmusic credentials 저장.
- **공통 에러 shape:**

```json
{ "error": { "code": "UPSTREAM_ERROR", "message": "...", "detail": {} } }
```

- **공통 DTO:** [Track](#3-zustand-store-설계), `Playlist`, `Artist`, `Album` (정규화된 shape).

### 4.2 엔드포인트

#### `GET /api/playlists`
내 라이브러리 플레이리스트 목록.

- **Query:** `limit?: number=50`
- **Response:**
```json
{
  "items": [
    { "id": "PL...", "title": "...", "thumbnailUrl": "...", "trackCount": 42, "updatedAt": "..." }
  ]
}
```
- **캐시:** 5분.

#### `GET /api/playlist/{id}`
플레이리스트 상세 + 트랙.

- **Path:** `id: string`
- **Query:** `limit?: number=500`
- **Response:** `{ playlist: Playlist, tracks: Track[] }`
- **Errors:** `404 PLAYLIST_NOT_FOUND`.

#### `PATCH /api/playlist/{id}/reorder`
트랙 순서 변경 (낙관적 UI commit).

- **Body:** `{ "order": ["videoId1", "videoId2", ...] }`
- **Response:** `{ ok: true }`

#### `GET /api/search`
통합 검색.

- **Query:**
  - `q: string` (필수)
  - `type: 'song' | 'video' | 'album' | 'artist' | 'all'='all'`
  - `limit?: number=20`
- **Response:**
```json
{
  "songs":   [Track, ...],
  "videos":  [Track, ...],
  "albums":  [Album, ...],
  "artists": [Artist, ...]
}
```
- **캐시:** 30초.

#### `GET /api/search/suggest`
자동완성.

- **Query:** `q: string`
- **Response:** `{ "suggestions": ["..."] }`

#### `GET /api/recommendations`
홈 추천 곡.

- **Query:** `seed?: videoId` (있으면 해당 곡 기반 radio, 없으면 사용자 홈 피드)
- **Response:** `{ items: Track[] }`

#### `GET /api/lyrics/{videoId}`
가사.

- **Response:**
```json
{
  "source": "ytmusic | fallback",
  "synced": true,
  "lines": [{ "timeMs": 12500, "text": "..." }]
}
```
- `synced=false`면 `lines`는 `timeMs` 없이 텍스트만.
- **Errors:** `404 LYRICS_NOT_FOUND`.

#### `GET /api/history`
서버측 재생 히스토리 (v2).

- **Query:** `limit?: number=100`
- **Response:** `{ items: HistoryEntry[] }`

#### `POST /api/history`
클라이언트 재생 이벤트 동기화.

- **Body:** `{ videoId, playedAt, listenedSec, source? }`
- **Response:** `{ ok: true }`

### 4.3 속도 제한 & 재시도

- 서버 → ytmusicapi: 초당 5req 토큰 버킷. 초과 시 429 대신 서버 내 큐잉 (max wait 2s, 이후 503).
- 클라이언트: React Query `retry: 2`, exponential backoff. 429/503은 재시도, 404는 재시도 안 함.

---

## 5. 디자인 토큰

### 5.1 철학

Spotify의 **"다크 + 형광 악센트 + 대담한 타이포"** 공식은 취하되, 3가지로 차별화한다. (섹션 5.7 참조)

### 5.2 컬러 팔레트 (다크 기본)

CSS Variables로 정의하고 Tailwind `theme.extend.colors`에서 `rgb(var(--...) / <alpha-value>)`로 참조한다.

```css
:root[data-theme='spotify-green'] {
  /* Surface — 의도적으로 5단 */
  --surface-0:  10  10  12;    /* 최하단 배경 (거의 검정) */
  --surface-1:  18  18  22;    /* 기본 앱 배경 */
  --surface-2:  26  26  32;    /* 카드/패널 */
  --surface-3:  38  38  46;    /* 엘리베이션 있는 요소 */
  --surface-4:  54  54  64;    /* 호버/활성 */

  /* Text */
  --text-primary:    245 245 247;
  --text-secondary:  170 170 180;
  --text-tertiary:   110 110 120;
  --text-on-accent:  10  10  12;

  /* Accent (Theme별로 달라지는 유일한 축) */
  --accent-500: 30  215 96;     /* Spotify green-ish but shifted */
  --accent-400: 70  230 130;
  --accent-600: 20  180 80;
  --accent-glow: 30  215 96;

  /* Semantic */
  --danger:  235 80  80;
  --warning: 240 180 60;
  --info:    80  170 240;

  /* Overlays */
  --scrim:   0 0 0 / 0.6;
  --border:  255 255 255 / 0.06;
}

:root[data-theme='retro'] {
  --surface-0: 28 20 36;
  --surface-1: 40 28 52;
  --surface-2: 56 38 72;
  --surface-3: 72 50 92;
  --surface-4: 92 64 118;
  --accent-500: 255 110 180;    /* 핫 핑크 */
  --accent-glow: 255 110 180;
  /* ... */
}

:root[data-theme='monochrome'] {
  --surface-0: 8 8 8;
  --surface-1: 16 16 16;
  --surface-2: 24 24 24;
  --surface-3: 36 36 36;
  --surface-4: 52 52 52;
  --accent-500: 245 245 247;
  --accent-glow: 245 245 247;
  /* ... */
}
```

라이트 테마는 v2로 연기 (음악 앱 특성상 다크가 압도적).

### 5.3 타이포그래피

**폰트:**
- UI/Body: `Inter Variable` (latin) + `Pretendard Variable` (한글).
- 디스플레이/아티스트명: `Space Grotesk Variable` (약간의 개성).
- 시간/숫자 표시: `JetBrains Mono Variable` (tabular-nums 강제).

**스케일 (1rem = 16px 기준):**

| 토큰 | size / line-height | 용도 |
|---|---|---|
| `display-xl` | 3.5rem / 1.1, weight 700, tracking -0.02em | 히어로 (플레이리스트 타이틀) |
| `display-lg` | 2.5rem / 1.15, 700 | 섹션 타이틀 |
| `title-lg`   | 1.5rem / 1.25, 600 | 카드 타이틀 |
| `title-md`   | 1.125rem / 1.3, 600 | 트랙 제목 |
| `body-md`    | 0.9375rem / 1.5, 400 | 기본 본문 |
| `body-sm`    | 0.8125rem / 1.5, 400 | 아티스트명, 메타 |
| `caption`    | 0.75rem / 1.4, 500, uppercase, tracking 0.06em | 섹션 라벨, 뱃지 |
| `time`       | 0.8125rem / 1, 500, tabular-nums | 재생 시간 |

### 5.4 간격 (Spacing)

Tailwind 기본 4px 스케일 유지 + 음악 플레이어 특화 의미 토큰:

```ts
// tailwind.config — theme.extend.spacing
'player-bar-h': '5.5rem',        // 88px 하단 플레이어
'sidebar-w':    '15rem',         // 240px
'sidebar-w-collapsed': '4.5rem',
'panel-w':      '22rem',         // 352px 큐/가사 패널
'cover-sm':     '2.5rem',
'cover-md':     '3.5rem',
'cover-lg':     '14rem',
'cover-hero':   '16rem',
```

### 5.5 Radius & 그림자

**Radius:**
```
--radius-xs: 4px;    /* 칩, 작은 배지 */
--radius-sm: 8px;    /* 버튼, 입력 */
--radius-md: 12px;   /* 카드 */
--radius-lg: 16px;   /* 패널 */
--radius-xl: 24px;   /* 히어로 커버 */
--radius-pill: 999px;
```

> **규칙:** 앨범 커버는 `radius-md` 또는 `radius-xl`만 사용한다 (중간값 금지). 대신 커버를 *둥근 원*으로 만드는 건 현재 재생 중인 곡(회전 애니메이션)에 한정.

**Shadow/Glow:**
```
--shadow-1: 0 2px 8px rgb(0 0 0 / 0.3);
--shadow-2: 0 8px 24px rgb(0 0 0 / 0.4);
--shadow-3: 0 16px 48px rgb(0 0 0 / 0.5);

/* 악센트 글로우 — 재생 중 커버, 포커스 링 */
--glow-accent-sm: 0 0 12px rgb(var(--accent-glow) / 0.35);
--glow-accent-md: 0 0 24px rgb(var(--accent-glow) / 0.5);
--glow-accent-lg: 0 0 48px rgb(var(--accent-glow) / 0.6);
```

### 5.6 트랜지션

```
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-out-expo:  cubic-bezier(0.19, 1, 0.22, 1);
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);

--dur-instant: 80ms;     /* 버튼 눌림 */
--dur-fast:    160ms;    /* 호버, 포커스 */
--dur-base:    240ms;    /* 패널 열기 */
--dur-slow:    400ms;    /* 뷰 전환 */
--dur-epic:    800ms;    /* 히어로 등장 */
```

**기본값 규칙:** 모든 interactive 요소는 `transition: colors, transform, opacity var(--dur-fast) var(--ease-out-quart)`. 크기 애니메이션은 Framer Motion에 위임.

### 5.7 Spotify 대비 차별화 포인트 3가지

#### ① **Accent-Reactive Ambient (배경이 곡의 커버 컬러로 숨쉰다)**
현재 재생 중인 곡의 앨범 커버에서 dominant color를 추출 (Client-side `Vibrant.js`) → `--accent-500`, `--accent-glow`를 런타임에 **부드럽게 보간 (900ms ease-out-expo)**. Spotify도 유사하게 하지만 카드 상단 그라디언트에 국한. TuneBoard는 플레이어 바의 글로우, 프로그레스 바, 큐 패널의 하이라이트, 커버 뒤의 ambient blur까지 전체를 "지금 듣는 곡의 색"으로 물들인다.

#### ② **Dual-Mode Player (뮤직 ↔ 비디오 전환이 1급 시민)**
Spotify는 비디오/영상이 보조. TuneBoard는 플레이어 바 우측에 **Mode Toggle**을 상시 노출, 전환 시 현재 재생 위치를 유지한 채 심리스하게 바뀐다. 전환 애니메이션은 Framer Motion `layoutId`로 앨범 커버가 **영상 프레임으로 확대**되는 모션. 게다가 `videoSyncMode` (음악 일시정지 vs 동시 재생)을 UI 토글로 제공 — 경쟁 제품에 없다.

#### ③ **Timeline-first Listening History (오늘 뭘 들었지를 한 눈에)**
Spotify Wrapped는 연 1회 이벤트. TuneBoard는 홈 화면 상단에 **"Today" 타임라인 위젯** — 24시간 가로축, 재생한 곡을 시각의 막대로 쌓고, hover하면 그 시각에 들은 곡 앨범 커버가 떠오른다. D3 scaleTime + 간단한 Canvas heatmap. 사이드 효과로 "오전엔 주로 이 장르를 듣네" 같은 인사이트가 즉시 보인다. *보는 재미*가 있는 dashboard라는 프로젝트 정체성과 직결.

---

## 6. 부록: 주요 리스크와 완화

| 리스크 | 영향 | 완화 |
|---|---|---|
| YouTube IFrame이 모바일 브라우저에서 자동재생 불가 | 첫 진입 시 재생 실패 | 첫 사용자 제스처에 "Play" 모달, 이후 세션은 OK |
| ytmusicapi는 비공식 — API 변경 위험 | 백엔드 장애 | DTO 레이어로 흡수, 깨질 경우 graceful degrade |
| 가사 라이선스 | 법적 | ytmusic에서 얻는 가사만 사용, 외부 크롤링 금지 |
| 동시 오디오+비디오 재생 시 음량 충돌 | UX 악화 | `videoSyncMode='play-both'` 기본값 off, 사용자 opt-in |
| IFrame 오디오 비트 분석 불가 | 시각화 품질 | BPM 메타데이터 기반 pseudo-reactive, 확장 모드에서만 고급 비주얼 |

---

*끝.*
