from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from ..normalize import normalize_search_results
from ..ytmusic_client import YTMusicCallError, get_client, get_public_client, safe_call

router = APIRouter()
log = logging.getLogger(__name__)

# ytmusicapi accepts: songs, videos, albums, artists, playlists, community_playlists, featured_playlists, uploads
_FILTER_MAP = {
    "all": None,
    "songs": "songs",
    "videos": "videos",
    "albums": "albums",
    "artists": "artists",
    "playlists": "playlists",
}


@router.get("/search")
def search(q: str = Query(..., min_length=1), filter: str = "all", limit: int = 30) -> dict:
    if filter not in _FILTER_MAP:
        raise HTTPException(status_code=400, detail="invalid search filter")
    yt = get_client()
    yt_filter = _FILTER_MAP.get(filter)
    limit = max(1, min(limit, 50))
    try:
        raw = safe_call(yt.search, q, filter=yt_filter, limit=limit)
    except YTMusicCallError as exc:
        if exc.status_code == 401:
            try:
                raw = safe_call(get_public_client().search, q, filter=yt_filter, limit=limit)
            except YTMusicCallError as public_exc:
                raise HTTPException(status_code=public_exc.status_code, detail=public_exc.detail) from public_exc
        else:
            log.exception("search failed")
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except Exception as exc:  # noqa: BLE001 - defensive fallback for upstream changes
        log.exception("search failed")
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return normalize_search_results(raw)


@router.get("/search/suggestions")
def suggestions(q: str = Query(..., min_length=1)) -> list[str]:
    yt = get_client()
    try:
        raw = safe_call(yt.get_search_suggestions, q, retries=0)
    except YTMusicCallError as exc:
        if exc.status_code == 401:
            try:
                raw = safe_call(get_public_client().get_search_suggestions, q, retries=0)
            except YTMusicCallError:
                return []
        else:
            log.exception("get_search_suggestions failed")
            return []
    except Exception as exc:  # noqa: BLE001
        log.exception("get_search_suggestions failed")
        return []
    # The API returns a list of strings, or dicts when detailed_runs=True.
    if not raw:
        return []
    if isinstance(raw[0], str):
        return raw
    return [item.get("text", "") for item in raw if item.get("text")]
