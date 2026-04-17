from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..normalize import _best_thumb, _parse_duration, normalize_lyrics, normalize_track
from ..ytmusic_client import get_client

router = APIRouter()
log = logging.getLogger(__name__)


class QueueAddPayload(BaseModel):
    videoId: str
    source: str | None = None


@router.get("/track/{video_id}/info")
def track_info(video_id: str) -> dict:
    yt = get_client()
    try:
        raw = yt.get_song(video_id)
    except Exception as exc:
        log.exception("get_song failed")
        raise HTTPException(status_code=502, detail=str(exc))

    vd = raw.get("videoDetails") or {}
    if not vd.get("videoId"):
        raise HTTPException(status_code=404, detail="track not found")

    shaped = {
        "videoId": vd.get("videoId"),
        "title": vd.get("title") or "Untitled",
        "artists": [{"id": vd.get("channelId") or "", "name": vd.get("author") or "Unknown"}],
        "album": None,
        "durationSec": _parse_duration(vd.get("lengthSeconds")),
        "thumbnailUrl": _best_thumb((vd.get("thumbnail") or {}).get("thumbnails")),
        "isVideo": (vd.get("musicVideoType") == "MUSIC_VIDEO_TYPE_UGC"),
    }
    normalized = normalize_track(shaped) or shaped
    normalized["viewCount"] = vd.get("viewCount")
    normalized["shortDescription"] = vd.get("shortDescription")
    return normalized


@router.get("/lyrics/{video_id}")
def lyrics(video_id: str) -> dict:
    yt = get_client()
    try:
        watch = yt.get_watch_playlist(videoId=video_id)
        lyrics_id = watch.get("lyrics")
        if not lyrics_id:
            return normalize_lyrics(None)
        # Pass timestamps=True so we get timed lines when available (newer ytmusicapi).
        try:
            raw = yt.get_lyrics(lyrics_id, timestamps=True)
        except TypeError:
            raw = yt.get_lyrics(lyrics_id)
    except Exception as exc:
        log.warning("lyrics fetch failed for %s: %s", video_id, exc)
        return normalize_lyrics(None)
    return normalize_lyrics(raw)


@router.post("/queue/add")
def queue_add(payload: QueueAddPayload) -> dict:
    # Logging-only hook for now. Actual queue lives in the frontend store.
    log.info("[queue/add] videoId=%s source=%s", payload.videoId, payload.source)
    return {"ok": True, "videoId": payload.videoId}
