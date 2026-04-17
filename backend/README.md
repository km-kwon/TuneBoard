# TuneBoard Backend

FastAPI wrapper over [ytmusicapi](https://github.com/sigma67/ytmusicapi).

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate           # Windows
# source .venv/bin/activate      # macOS/Linux
pip install -r requirements.txt
```

## Authentication

Playlists and liked songs require authentication. Search, home feed, track
info, and lyrics work without auth.

### Option A — Browser headers (recommended, fastest)

```bash
ytmusicapi browser
```

Follow the prompt: open music.youtube.com in a browser, open DevTools →
Network, right-click any `/youtubei/v1/...` request → Copy as cURL, paste
into the prompt. This writes `browser.json` next to your shell cwd — move
it into `backend/browser.json`.

### Option B — OAuth

```bash
ytmusicapi oauth
```

Writes `oauth.json`. Move into `backend/oauth.json`.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

The Vite dev server proxies `/api/*` to `http://localhost:8000` (see
`vite.config.ts`).

## Endpoints

```
GET  /api/playlists
GET  /api/playlists/{id}
GET  /api/search?q=&filter=
GET  /api/search/suggestions?q=
GET  /api/home
GET  /api/liked
GET  /api/track/{videoId}/info
GET  /api/lyrics/{videoId}
POST /api/queue/add
```
