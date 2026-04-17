from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from ..normalize import normalize_search_results
from ..ytmusic_client import get_client

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
    yt = get_client()
    yt_filter = _FILTER_MAP.get(filter)
    try:
        raw = yt.search(q, filter=yt_filter, limit=limit)
    except Exception as exc:
        log.exception("search failed")
        raise HTTPException(status_code=502, detail=str(exc))
    return normalize_search_results(raw)


@router.get("/search/suggestions")
def suggestions(q: str = Query(..., min_length=1)) -> list[str]:
    yt = get_client()
    try:
        raw = yt.get_search_suggestions(q)
    except Exception as exc:
        log.exception("get_search_suggestions failed")
        return []
    # The API returns a list of strings, or dicts when detailed_runs=True.
    if not raw:
        return []
    if isinstance(raw[0], str):
        return raw
    return [item.get("text", "") for item in raw if item.get("text")]
