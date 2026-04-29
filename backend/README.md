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

Personal playlists and liked songs require authentication. Search, home feed,
track info, and lyrics work without auth.

### Option A — Official YouTube Data API OAuth

This is the best path for a personal YouTube dashboard. It can read your
YouTube channel playlists through Google's official OAuth flow. It does not
replace YouTube Music library endpoints, so keep Option B/C below if you also
want YouTube Music liked songs and library data.

1. Create a Google Cloud project and enable **YouTube Data API v3**.
2. Create an OAuth Client ID for **Web application**.
3. Add this authorized redirect URI:

```text
http://localhost:8000/api/auth/google/callback
```

4. Copy `backend/.env.example` to `backend/.env` and set:

```bash
TUNEBOARD_GOOGLE_CLIENT_ID=...
TUNEBOARD_GOOGLE_CLIENT_SECRET=...
```

5. Run the backend and click the user profile button in the app sidebar.

The backend stores the OAuth token in `backend/google_oauth.json`. Do not commit
that file.

### Option B — Browser headers (recommended, fastest for YouTube Music)

```bash
ytmusicapi browser
```

Follow the prompt: open music.youtube.com in a browser, open DevTools →
Network, right-click any `/youtubei/v1/...` request → Copy as cURL, paste
into the prompt. This writes `browser.json` next to your shell cwd — move
it into `backend/browser.json`.

### Option C — ytmusicapi OAuth

```bash
ytmusicapi oauth
```

Writes `oauth.json`. Move into `backend/oauth.json`. Newer ytmusicapi versions
may require `TUNEBOARD_YTMUSIC_OAUTH_CLIENT_ID` and
`TUNEBOARD_YTMUSIC_OAUTH_CLIENT_SECRET`.

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
