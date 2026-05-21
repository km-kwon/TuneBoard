from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from ..normalize import normalize_home, normalize_search_results
from ..ytmusic_client import YTMusicCallError, get_client, get_public_client, safe_call

router = APIRouter()
log = logging.getLogger(__name__)

_FALLBACK_QUERIES = (
    ("Quick picks", "k-pop"),
    ("Fresh finds", "new music"),
    ("Focus flow", "lofi hip hop"),
)


@router.get("/home")
def home(limit: int = 6) -> list[dict]:
    yt = get_client()
    limit = max(1, min(limit, 10))
    try:
        raw = safe_call(yt.get_home, limit=limit)
    except YTMusicCallError as exc:
        if exc.status_code == 401:
            try:
                raw = safe_call(get_public_client().get_home, limit=limit)
            except YTMusicCallError as public_exc:
                log.warning("public get_home failed; using search fallback: %s", public_exc)
                return _fallback_home(get_public_client())
        else:
            log.warning("get_home failed; using search fallback: %s", exc)
            return _fallback_home(get_public_client())
    except Exception as exc:  # noqa: BLE001
        log.warning("get_home failed; using search fallback: %s", exc)
        return _fallback_home(get_public_client())
    return normalize_home(raw)


def _fallback_home(yt) -> list[dict]:
    sections: list[dict] = []
    for title, query in _FALLBACK_QUERIES:
        try:
            raw = safe_call(yt.search, query, limit=20)
        except YTMusicCallError as exc:
            log.warning("fallback search failed for %s: %s", query, exc)
            continue
        results = normalize_search_results(raw)
        items = [
            *({"kind": "track", "data": track} for track in results["songs"][:4]),
            *({"kind": "track", "data": track} for track in results["videos"][:2]),
            *({"kind": "playlist", "data": playlist} for playlist in results["playlists"][:3]),
            *({"kind": "album", "data": album} for album in results["albums"][:3]),
            *({"kind": "artist", "data": artist} for artist in results["artists"][:3]),
        ]
        if items:
            sections.append({"title": title, "items": items})

    if not sections:
        raise HTTPException(
            status_code=502,
            detail="YouTube Music home and fallback search both failed.",
        )
    return sections
