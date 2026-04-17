"""ytmusicapi → frontend shape normalizers.

ytmusicapi returns several subtly-different structures depending on the
endpoint; we normalize them here so the frontend Track/Playlist/etc. types
have one canonical shape regardless of origin.
"""
from __future__ import annotations

from typing import Any, Iterable


def _best_thumb(thumbs: Iterable[dict] | None) -> str:
    if not thumbs:
        return ""
    best = max(thumbs, key=lambda t: (t.get("width") or 0) * (t.get("height") or 0))
    url = best.get("url", "")
    # ytmusic thumbnails come back as `...=w120-h120-l90-rj`; requesting a larger
    # size just requires swapping the suffix.
    if "=w" in url:
        base = url.split("=w")[0]
        return f"{base}=w544-h544-l90-rj"
    return url


def _parse_duration(s: str | int | None) -> int:
    if s is None:
        return 0
    if isinstance(s, int):
        return s
    if isinstance(s, str) and ":" in s:
        parts = s.split(":")
        try:
            nums = [int(p) for p in parts]
        except ValueError:
            return 0
        total = 0
        for n in nums:
            total = total * 60 + n
        return total
    try:
        return int(s)
    except (TypeError, ValueError):
        return 0


def _artists(raw: Any) -> list[dict]:
    if not raw:
        return [{"id": "", "name": "Unknown"}]
    out = []
    for a in raw:
        if isinstance(a, dict):
            out.append({"id": a.get("id") or "", "name": a.get("name") or "Unknown"})
        elif isinstance(a, str):
            out.append({"id": "", "name": a})
    return out or [{"id": "", "name": "Unknown"}]


def _album(raw: Any) -> dict | None:
    if not raw:
        return None
    if isinstance(raw, dict):
        name = raw.get("name")
        if not name:
            return None
        return {"id": raw.get("id") or "", "name": name}
    if isinstance(raw, str):
        return {"id": "", "name": raw}
    return None


def normalize_track(raw: dict) -> dict | None:
    """Normalize a song/video entry. Returns None if it's missing a videoId."""
    vid = raw.get("videoId")
    if not vid:
        return None
    duration = raw.get("duration_seconds")
    if duration is None:
        duration = _parse_duration(raw.get("duration"))
    is_video = (raw.get("resultType") == "video") or (raw.get("videoType") == "MUSIC_VIDEO_TYPE_UGC")
    return {
        "videoId": vid,
        "title": raw.get("title") or "Untitled",
        "artists": _artists(raw.get("artists")),
        "album": _album(raw.get("album")),
        "durationSec": int(duration or 0),
        "thumbnailUrl": _best_thumb(raw.get("thumbnails")),
        "isVideo": is_video,
    }


def normalize_tracks(raws: Iterable[dict]) -> list[dict]:
    out = []
    for r in raws or []:
        n = normalize_track(r)
        if n:
            out.append(n)
    return out


def normalize_playlist_summary(raw: dict) -> dict:
    """For sidebar / library listing."""
    return {
        "id": raw.get("playlistId") or raw.get("id") or "",
        "title": raw.get("title") or "Untitled",
        "thumbnailUrl": _best_thumb(raw.get("thumbnails")),
        "trackCount": int(raw.get("count") or raw.get("trackCount") or 0),
        "description": raw.get("description") or "",
    }


def normalize_playlist_detail(raw: dict) -> dict:
    return {
        "id": raw.get("id") or "",
        "title": raw.get("title") or "Untitled",
        "description": raw.get("description") or "",
        "thumbnailUrl": _best_thumb(raw.get("thumbnails")),
        "trackCount": int(raw.get("trackCount") or len(raw.get("tracks") or [])),
        "durationSec": _parse_duration(raw.get("duration")),
        "author": (raw.get("author") or {}).get("name") if isinstance(raw.get("author"), dict) else raw.get("author") or "",
        "year": raw.get("year") or "",
        "tracks": normalize_tracks(raw.get("tracks") or []),
    }


def normalize_album(raw: dict) -> dict:
    return {
        "browseId": raw.get("browseId") or raw.get("audioPlaylistId") or "",
        "title": raw.get("title") or "Untitled",
        "artists": _artists(raw.get("artists")),
        "year": raw.get("year") or "",
        "thumbnailUrl": _best_thumb(raw.get("thumbnails")),
        "type": raw.get("type") or "Album",
    }


def normalize_artist(raw: dict) -> dict:
    return {
        "browseId": raw.get("browseId") or "",
        "name": raw.get("artist") or raw.get("title") or raw.get("name") or "Unknown",
        "thumbnailUrl": _best_thumb(raw.get("thumbnails")),
        "subscribers": raw.get("subscribers") or "",
    }


def normalize_home_item(raw: dict) -> dict:
    """Home feed carousels mix tracks, playlists, albums, artists."""
    result_type = raw.get("resultType") or ""
    if raw.get("videoId"):
        t = normalize_track(raw)
        return {"kind": "track", "data": t} if t else {"kind": "unknown", "data": {}}
    if raw.get("playlistId"):
        return {"kind": "playlist", "data": normalize_playlist_summary(raw)}
    if raw.get("browseId", "").startswith("MPRE") or result_type == "album":
        return {"kind": "album", "data": normalize_album(raw)}
    if raw.get("browseId", "").startswith("UC") or result_type == "artist":
        return {"kind": "artist", "data": normalize_artist(raw)}
    return {"kind": "unknown", "data": raw}


def normalize_home(raw: list[dict]) -> list[dict]:
    sections = []
    for section in raw or []:
        items = []
        for c in section.get("contents") or []:
            n = normalize_home_item(c)
            if n["kind"] != "unknown":
                items.append(n)
        if items:
            sections.append({"title": section.get("title") or "", "items": items})
    return sections


def normalize_search_results(raw: list[dict]) -> dict:
    """Group search results by their native resultType."""
    buckets: dict[str, list[dict]] = {
        "songs": [],
        "videos": [],
        "albums": [],
        "artists": [],
        "playlists": [],
    }
    for item in raw or []:
        rtype = item.get("resultType")
        if rtype == "song":
            t = normalize_track(item)
            if t:
                buckets["songs"].append(t)
        elif rtype == "video":
            t = normalize_track(item)
            if t:
                t["isVideo"] = True
                buckets["videos"].append(t)
        elif rtype == "album":
            buckets["albums"].append(normalize_album(item))
        elif rtype == "artist":
            buckets["artists"].append(normalize_artist(item))
        elif rtype == "playlist":
            buckets["playlists"].append(normalize_playlist_summary(item))
    return buckets


def normalize_lyrics(raw: dict | None) -> dict:
    if not raw:
        return {"lyrics": "", "source": "", "hasTimestamps": False, "lines": []}
    lines = raw.get("lyrics") if isinstance(raw.get("lyrics"), list) else None
    if lines:
        # Timed lyrics: list of dicts with start_time_ms, text
        return {
            "lyrics": "\n".join(ln.get("text", "") for ln in lines),
            "source": raw.get("source") or "",
            "hasTimestamps": True,
            "lines": [
                {"startMs": int(ln.get("start_time_ms") or 0), "text": ln.get("text") or ""}
                for ln in lines
            ],
        }
    return {
        "lyrics": raw.get("lyrics") or "",
        "source": raw.get("source") or "",
        "hasTimestamps": False,
        "lines": [],
    }
