from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .. import lrclib_client
from ..normalize import _best_thumb, _parse_duration, normalize_lyrics, normalize_track, normalize_tracks
from ..ytmusic_client import YTMusicCallError, get_client, get_public_client, safe_call

router = APIRouter()
log = logging.getLogger(__name__)


class QueueAddPayload(BaseModel):
    videoId: str
    source: str | None = None


@router.get("/track/{video_id}/info")
def track_info(video_id: str) -> dict:
    yt = get_client()
    try:
        raw = safe_call(yt.get_song, video_id)
    except YTMusicCallError as exc:
        if exc.status_code == 401:
            try:
                raw = safe_call(get_public_client().get_song, video_id)
            except YTMusicCallError as public_exc:
                raise HTTPException(status_code=public_exc.status_code, detail=public_exc.detail) from public_exc
        else:
            log.exception("get_song failed")
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except Exception as exc:  # noqa: BLE001
        log.exception("get_song failed")
        raise HTTPException(status_code=502, detail=str(exc)) from exc

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
        "isVideo": vd.get("musicVideoType") in {"MUSIC_VIDEO_TYPE_OMV", "MUSIC_VIDEO_TYPE_UGC"},
    }
    normalized = normalize_track(shaped) or shaped
    normalized["viewCount"] = vd.get("viewCount")
    normalized["shortDescription"] = vd.get("shortDescription")
    return normalized


@router.get("/lyrics/{video_id}")
def lyrics(video_id: str) -> dict:
    yt = get_client()
    watch: dict | None = None
    try:
        watch = safe_call(yt.get_watch_playlist, videoId=video_id)
    except YTMusicCallError as exc:
        if exc.status_code != 401:
            log.warning("lyrics watch fetch failed for %s: %s", video_id, exc)
        else:
            try:
                watch = safe_call(get_public_client().get_watch_playlist, videoId=video_id)
            except Exception as public_exc:  # noqa: BLE001
                log.warning("lyrics public watch fetch failed for %s: %s", video_id, public_exc)
    except Exception as exc:  # noqa: BLE001
        log.warning("lyrics watch fetch failed for %s: %s", video_id, exc)

    metadata = _lyrics_metadata(watch, yt, video_id)
    ytmusic_lyrics = normalize_lyrics(None)
    try:
        lyrics_id = (watch or {}).get("lyrics")
        if lyrics_id:
            raw = safe_call(_get_lyrics, yt, lyrics_id, retries=0)
            ytmusic_lyrics = normalize_lyrics(raw)
            if ytmusic_lyrics["hasTimestamps"] and ytmusic_lyrics["lines"]:
                ytmusic_lyrics["source"] = ytmusic_lyrics["source"] or "YouTube Music"
                return ytmusic_lyrics
    except YTMusicCallError as exc:
        if exc.status_code == 401:
            try:
                raw = safe_call(_get_lyrics, get_public_client(), lyrics_id, retries=0)
                ytmusic_lyrics = normalize_lyrics(raw)
                if ytmusic_lyrics["hasTimestamps"] and ytmusic_lyrics["lines"]:
                    ytmusic_lyrics["source"] = ytmusic_lyrics["source"] or "YouTube Music"
                    return ytmusic_lyrics
            except Exception as public_exc:  # noqa: BLE001
                log.warning("lyrics public fetch failed for %s: %s", video_id, public_exc)
        else:
            log.warning("lyrics fetch failed for %s: %s", video_id, exc)
    except Exception as exc:  # noqa: BLE001
        log.warning("lyrics fetch failed for %s: %s", video_id, exc)

    lrclib_lyrics = lrclib_client.fetch_lyrics(metadata)
    if lrclib_lyrics and lrclib_lyrics["hasTimestamps"] and lrclib_lyrics["lines"]:
        return lrclib_lyrics
    if ytmusic_lyrics["lyrics"]:
        ytmusic_lyrics["source"] = ytmusic_lyrics["source"] or "YouTube Music"
        return ytmusic_lyrics
    if lrclib_lyrics and lrclib_lyrics["lyrics"]:
        return lrclib_lyrics
    return normalize_lyrics(None)


@router.post("/queue/add")
def queue_add(payload: QueueAddPayload) -> dict:
    # Logging-only hook for now. Actual queue lives in the frontend store.
    log.info("[queue/add] videoId=%s source=%s", payload.videoId, payload.source)
    return {"ok": True, "videoId": payload.videoId}


@router.get("/related/{video_id}")
def related(video_id: str, limit: int = 20) -> list[dict]:
    """Up-next queue from get_watch_playlist — used as the 'related videos' rail."""
    yt = get_client()
    limit = max(5, min(limit, 50))
    try:
        watch = safe_call(yt.get_watch_playlist, videoId=video_id, limit=limit)
    except YTMusicCallError as exc:
        if exc.status_code != 401:
            log.warning("related fetch failed for %s: %s", video_id, exc)
            return []
        try:
            watch = safe_call(get_public_client().get_watch_playlist, videoId=video_id, limit=limit)
        except Exception as public_exc:  # noqa: BLE001
            log.warning("related public fetch failed for %s: %s", video_id, public_exc)
            return []
    except Exception as exc:  # noqa: BLE001
        log.warning("related fetch failed for %s: %s", video_id, exc)
        return []
    tracks = watch.get("tracks") or []
    # Drop the head — that's the currently-playing video itself.
    return normalize_tracks(tracks[1:])


def _get_lyrics(yt, lyrics_id: str) -> dict | None:
    # Pass timestamps=True so we get timed lines when available (newer ytmusicapi).
    try:
        return yt.get_lyrics(lyrics_id, timestamps=True)
    except Exception as exc:  # noqa: BLE001
        log.debug("timed lyrics unavailable for %s, falling back: %s", lyrics_id, exc)
        return yt.get_lyrics(lyrics_id)


def _lyrics_metadata(watch: dict | None, yt, video_id: str) -> dict:
    track = ((watch or {}).get("tracks") or [{}])[0] or {}
    album = track.get("album") if isinstance(track.get("album"), dict) else {}
    artists = track.get("artists") if isinstance(track.get("artists"), list) else []
    metadata = {
        "title": track.get("title") or "",
        "artist": ", ".join(a.get("name") for a in artists if isinstance(a, dict) and a.get("name")),
        "album": album.get("name") or "",
        "durationSec": _parse_duration(track.get("duration") or track.get("duration_seconds")),
    }
    if metadata["title"] and metadata["artist"] and metadata["durationSec"]:
        return metadata

    try:
        raw = safe_call(yt.get_song, video_id, retries=0)
    except Exception as exc:  # noqa: BLE001
        log.debug("lyrics metadata song fetch failed for %s: %s", video_id, exc)
        return metadata

    details = raw.get("videoDetails") or {}
    metadata["title"] = metadata["title"] or details.get("title") or ""
    metadata["artist"] = metadata["artist"] or details.get("author") or ""
    metadata["durationSec"] = metadata["durationSec"] or _parse_duration(details.get("lengthSeconds"))
    return metadata
