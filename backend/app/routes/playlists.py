from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from ..normalize import normalize_playlist_detail, normalize_playlist_summary, normalize_tracks
from ..ytmusic_client import get_client, has_auth

router = APIRouter()
log = logging.getLogger(__name__)


@router.get("/playlists")
def list_playlists() -> list[dict]:
    if not has_auth():
        raise HTTPException(status_code=401, detail="ytmusic auth required for playlists")
    yt = get_client()
    try:
        raw = yt.get_library_playlists(limit=200)
    except Exception as exc:
        log.exception("get_library_playlists failed")
        raise HTTPException(status_code=502, detail=str(exc))
    return [normalize_playlist_summary(p) for p in (raw or [])]


@router.get("/playlists/{playlist_id}")
def playlist_detail(playlist_id: str, limit: int = 500) -> dict:
    yt = get_client()
    try:
        if playlist_id == "LM" or playlist_id == "liked":
            # Liked songs: library-level endpoint, not a standard playlist id.
            if not has_auth():
                raise HTTPException(status_code=401, detail="auth required for liked songs")
            raw = yt.get_liked_songs(limit=limit)
            raw["id"] = "liked"
            raw.setdefault("title", "Liked Songs")
        else:
            raw = yt.get_playlist(playlist_id, limit=limit)
            raw["id"] = playlist_id
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("get_playlist failed: %s", playlist_id)
        raise HTTPException(status_code=502, detail=str(exc))
    return normalize_playlist_detail(raw)


@router.get("/liked")
def liked_songs(limit: int = 500) -> dict:
    if not has_auth():
        raise HTTPException(status_code=401, detail="auth required for liked songs")
    yt = get_client()
    try:
        raw = yt.get_liked_songs(limit=limit)
    except Exception as exc:
        log.exception("get_liked_songs failed")
        raise HTTPException(status_code=502, detail=str(exc))
    return {
        "id": "liked",
        "title": "Liked Songs",
        "description": "",
        "thumbnailUrl": "",
        "trackCount": int(raw.get("trackCount") or len(raw.get("tracks") or [])),
        "durationSec": 0,
        "author": "",
        "year": "",
        "tracks": normalize_tracks(raw.get("tracks") or []),
    }
