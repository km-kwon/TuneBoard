from __future__ import annotations

import json
import logging
import re
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .settings import settings

log = logging.getLogger(__name__)

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
API_BASE = "https://www.googleapis.com/youtube/v3"
SCOPES = (
    "https://www.googleapis.com/auth/youtube.readonly",
)


class YouTubeDataError(RuntimeError):
    pass


def is_configured() -> bool:
    return bool(settings.google_client_id and settings.google_client_secret)


def is_connected() -> bool:
    return _token_path().exists()


def status() -> dict[str, Any]:
    token = _load_token() if is_connected() else {}
    return {
        "configured": is_configured(),
        "connected": bool(token.get("refresh_token") or token.get("access_token")),
        "channelTitle": token.get("channel_title") or "",
        "channelId": token.get("channel_id") or "",
        "scopes": token.get("scope", ""),
        "tokenFile": str(_token_path()) if is_connected() else "",
    }


def build_auth_url(state: str) -> str:
    if not is_configured():
        raise YouTubeDataError("Google OAuth client ID/secret are not configured")
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": state,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


def exchange_code(code: str) -> dict[str, Any]:
    if not is_configured():
        raise YouTubeDataError("Google OAuth client ID/secret are not configured")
    payload = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": settings.google_redirect_uri,
        "grant_type": "authorization_code",
    }
    token = _post_form(TOKEN_URL, payload)
    _save_token(_prepare_token(token))

    # Cache the visible profile in the same token file so /auth/status is cheap.
    try:
        profile = get_channel_profile()
        merged = _load_token()
        merged.update(profile)
        _save_token(merged)
    except Exception:
        log.exception("failed to fetch YouTube channel profile after OAuth")

    return status()


def disconnect() -> None:
    path = _token_path()
    if path.exists():
        path.unlink()


def get_channel_profile() -> dict[str, str]:
    raw = _api_get(
        "/channels",
        {
            "part": "snippet",
            "mine": "true",
            "maxResults": "1",
        },
    )
    items = raw.get("items") or []
    if not items:
        return {"channel_id": "", "channel_title": ""}
    item = items[0]
    snippet = item.get("snippet") or {}
    return {
        "channel_id": item.get("id") or "",
        "channel_title": snippet.get("title") or "",
    }


def list_playlist_summaries(limit: int = 200) -> list[dict[str, Any]]:
    playlists: list[dict[str, Any]] = []
    page_token = ""
    while len(playlists) < limit:
        params = {
            "part": "snippet,contentDetails",
            "mine": "true",
            "maxResults": "50",
        }
        if page_token:
            params["pageToken"] = page_token
        raw = _api_get("/playlists", params)
        for item in raw.get("items") or []:
            playlists.append(_normalize_playlist_summary(item))
            if len(playlists) >= limit:
                break
        page_token = raw.get("nextPageToken") or ""
        if not page_token:
            break
    return playlists


def get_playlist_detail(playlist_id: str, limit: int = 500) -> dict[str, Any]:
    playlist_raw = _api_get(
        "/playlists",
        {
            "part": "snippet,contentDetails",
            "id": playlist_id,
            "maxResults": "1",
        },
    )
    playlists = playlist_raw.get("items") or []
    if not playlists:
        raise YouTubeDataError("playlist not found or not accessible with Google OAuth")

    playlist = playlists[0]
    summary = _normalize_playlist_summary(playlist)
    items = _list_playlist_items(playlist_id, limit)
    video_ids = [
        item.get("contentDetails", {}).get("videoId")
        or item.get("snippet", {}).get("resourceId", {}).get("videoId")
        for item in items
    ]
    video_ids = [video_id for video_id in video_ids if video_id]
    details = _video_detail_map(video_ids)
    tracks = [_normalize_playlist_track(item, details) for item in items]
    tracks = [track for track in tracks if track["videoId"]]

    return {
        "id": summary["id"],
        "title": summary["title"],
        "description": summary.get("description") or "",
        "thumbnailUrl": summary.get("thumbnailUrl") or "",
        "trackCount": summary.get("trackCount") or len(tracks),
        "durationSec": sum(track.get("durationSec") or 0 for track in tracks),
        "author": (playlist.get("snippet") or {}).get("channelTitle") or "YouTube",
        "year": ((playlist.get("snippet") or {}).get("publishedAt") or "")[:4],
        "tracks": tracks,
    }


def _list_playlist_items(playlist_id: str, limit: int) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    page_token = ""
    while len(items) < limit:
        params = {
            "part": "snippet,contentDetails",
            "playlistId": playlist_id,
            "maxResults": "50",
        }
        if page_token:
            params["pageToken"] = page_token
        raw = _api_get("/playlistItems", params)
        for item in raw.get("items") or []:
            items.append(item)
            if len(items) >= limit:
                break
        page_token = raw.get("nextPageToken") or ""
        if not page_token:
            break
    return items


def _video_detail_map(video_ids: list[str]) -> dict[str, dict[str, Any]]:
    details: dict[str, dict[str, Any]] = {}
    for start in range(0, len(video_ids), 50):
        batch = video_ids[start : start + 50]
        if not batch:
            continue
        raw = _api_get(
            "/videos",
            {
                "part": "snippet,contentDetails",
                "id": ",".join(batch),
                "maxResults": "50",
            },
        )
        for item in raw.get("items") or []:
            if item.get("id"):
                details[item["id"]] = item
    return details


def _normalize_playlist_summary(item: dict[str, Any]) -> dict[str, Any]:
    snippet = item.get("snippet") or {}
    content = item.get("contentDetails") or {}
    return {
        "id": item.get("id") or "",
        "title": snippet.get("title") or "Untitled playlist",
        "thumbnailUrl": _best_thumbnail(snippet.get("thumbnails") or {}),
        "trackCount": int(content.get("itemCount") or 0),
        "description": snippet.get("description") or "",
    }


def _normalize_playlist_track(
    item: dict[str, Any],
    details: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    snippet = item.get("snippet") or {}
    content = item.get("contentDetails") or {}
    video_id = content.get("videoId") or (snippet.get("resourceId") or {}).get("videoId") or ""
    video = details.get(video_id) or {}
    video_snippet = video.get("snippet") or snippet
    return {
        "videoId": video_id,
        "title": video_snippet.get("title") or snippet.get("title") or "Unavailable video",
        "artists": [
            {
                "id": video_snippet.get("channelId") or snippet.get("channelId") or "",
                "name": video_snippet.get("channelTitle") or snippet.get("channelTitle") or "YouTube",
            }
        ],
        "album": None,
        "durationSec": _parse_iso_duration((video.get("contentDetails") or {}).get("duration")),
        "thumbnailUrl": _best_thumbnail(video_snippet.get("thumbnails") or snippet.get("thumbnails") or {}),
        "isVideo": True,
    }


def _best_thumbnail(thumbnails: dict[str, Any]) -> str:
    for key in ("maxres", "standard", "high", "medium", "default"):
        thumb = thumbnails.get(key)
        if isinstance(thumb, dict) and thumb.get("url"):
            return thumb["url"]
    return ""


_DURATION_RE = re.compile(
    r"^P(?:(?P<days>\d+)D)?(?:T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?)?$"
)


def _parse_iso_duration(value: str | None) -> int:
    if not value:
        return 0
    match = _DURATION_RE.match(value)
    if not match:
        return 0
    parts = {key: int(val or 0) for key, val in match.groupdict().items()}
    return (
        parts["days"] * 86400
        + parts["hours"] * 3600
        + parts["minutes"] * 60
        + parts["seconds"]
    )


def _api_get(path: str, params: dict[str, str]) -> dict[str, Any]:
    token = _valid_access_token()
    url = f"{API_BASE}{path}?{urlencode(params)}"
    req = Request(url, headers={"Authorization": f"Bearer {token}"})
    return _request_json(req)


def _valid_access_token() -> str:
    token = _load_token()
    if not token:
        raise YouTubeDataError("Google OAuth token is missing")
    if token.get("access_token") and float(token.get("expires_at") or 0) > time.time() + 60:
        return token["access_token"]
    if not token.get("refresh_token"):
        raise YouTubeDataError("Google OAuth refresh token is missing; reconnect Google")
    refreshed = _post_form(
        TOKEN_URL,
        {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "refresh_token": token["refresh_token"],
            "grant_type": "refresh_token",
        },
    )
    token.update(_prepare_token(refreshed, previous=token))
    _save_token(token)
    return token["access_token"]


def _prepare_token(token: dict[str, Any], previous: dict[str, Any] | None = None) -> dict[str, Any]:
    merged = dict(previous or {})
    merged.update(token)
    expires_in = int(token.get("expires_in") or 3600)
    merged["expires_at"] = time.time() + expires_in
    return merged


def _post_form(url: str, payload: dict[str, str]) -> dict[str, Any]:
    data = urlencode(payload).encode("utf-8")
    req = Request(
        url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    return _request_json(req)


def _request_json(req: Request) -> dict[str, Any]:
    try:
        with urlopen(req, timeout=20) as res:
            return json.loads(res.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise YouTubeDataError(detail or exc.reason) from exc
    except Exception as exc:
        raise YouTubeDataError(str(exc)) from exc


def _load_token() -> dict[str, Any]:
    path = _token_path()
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise YouTubeDataError(f"could not read Google OAuth token: {exc}") from exc


def _save_token(token: dict[str, Any]) -> None:
    path = _token_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(token, indent=2, ensure_ascii=False), encoding="utf-8")


def _token_path() -> Path:
    return settings.google_token_path
