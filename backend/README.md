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

If an old local venv was created before the Python install moved, recreate it.
A broken venv often shows `No Python at ...` when running `backend\.venv\Scripts\python.exe`.

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
http://localhost:8002/api/auth/google/callback
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
Network, filter for `/browse`, open a successful POST request, and copy the
request headers. Paste them into the prompt. This writes `browser.json` next to
your shell cwd — move it into `backend/browser.json`.

If Chrome/Edge only shows **Copy as cURL**, paste that cURL command into a local
`backend/ytmusic_curl.txt` file, then run:

```bash
python import_ytmusic_curl.py ytmusic_curl.txt
```

This extracts the auth headers and writes `backend/browser.json`. Keep
`ytmusic_curl.txt` private because it contains live Google session cookies.

The backend watches the auth file's mtime/size, so you can refresh
`browser.json` without restarting the FastAPI process.

### Option C — ytmusicapi OAuth

```bash
ytmusicapi oauth
```

Writes `oauth.json`. Move into `backend/oauth.json`. Current ytmusicapi OAuth
requires a Google OAuth client ID/secret for **TVs and Limited Input devices**:

```bash
TUNEBOARD_YTMUSIC_OAUTH_CLIENT_ID=...
TUNEBOARD_YTMUSIC_OAUTH_CLIENT_SECRET=...
```

## Run

```bash
uvicorn app.main:app --reload --port 8002
```

The Vite dev server proxies `/api/*` to `http://localhost:8002` (see
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
