"""ytmusicapi → frontend shape normalizers.

ytmusicapi returns several subtly-different structures depending on the
endpoint; we normalize them here so the frontend Track/Playlist/etc. types
have one canonical shape regardless of origin.
"""
from __future__ import annotations

from typing import Any, Iterable


def _as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, tuple):
        return list(value)
    return [value]


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


def _thumbs(raw: dict) -> Iterable[dict] | None:
    value = raw.get("thumbnails") or raw.get("thumbnail")
    if isinstance(value, dict):
        nested = value.get("thumbnails")
        if isinstance(nested, list):
            return nested
    if isinstance(value, list):
        return value
    return None


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


def _parse_count(value: Any) -> int:
    if value is None:
        return 0
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        digits = "".join(ch for ch in value if ch.isdigit())
        if digits:
            try:
                return int(digits)
            except ValueError:
                return 0
    return 0


def _artists(raw: Any) -> list[dict]:
    if not raw:
        return [{"id": "", "name": "Unknown"}]
    out = []
    for a in _as_list(raw):
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


def _playlist_id(raw: dict) -> str:
    playlist_id = raw.get("playlistId") or raw.get("id") or ""
    if playlist_id:
        return playlist_id[2:] if playlist_id.startswith("VL") else playlist_id
    browse_id = raw.get("browseId") or ""
    if browse_id.startswith("VL"):
        return browse_id[2:]
    return ""


def normalize_track(raw: dict) -> dict | None:
    """Normalize a song/video entry. Returns None if it's missing a videoId."""
    vid = raw.get("videoId")
    if not vid:
        return None
    duration = (
        raw.get("duration_seconds")
        or raw.get("durationSec")
        or raw.get("length_seconds")
        or raw.get("lengthSeconds")
    )
    if duration is None:
        duration = _parse_duration(raw.get("duration") or raw.get("length"))
    duration_sec = _parse_duration(duration) if isinstance(duration, str) else int(duration or 0)
    video_type = raw.get("videoType") or raw.get("musicVideoType")
    is_video = (
        bool(raw.get("isVideo"))
        or raw.get("resultType") == "video"
        or video_type in {"MUSIC_VIDEO_TYPE_OMV", "MUSIC_VIDEO_TYPE_UGC"}
    )
    return {
        "videoId": vid,
        "title": raw.get("title") or "Untitled",
        "artists": _artists(raw.get("artists")),
        "album": _album(raw.get("album")),
        "durationSec": duration_sec,
        "thumbnailUrl": raw.get("thumbnailUrl") or _best_thumb(_thumbs(raw)),
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
        "id": _playlist_id(raw),
        "title": raw.get("title") or "Untitled",
        "thumbnailUrl": raw.get("thumbnailUrl") or _best_thumb(_thumbs(raw)),
        "trackCount": _parse_count(raw.get("count") or raw.get("trackCount") or raw.get("itemCount")),
        "description": raw.get("description") or "",
    }


def normalize_playlist_detail(raw: dict) -> dict:
    tracks = normalize_tracks(raw.get("tracks") or [])
    thumbnail_url = raw.get("thumbnailUrl") or _best_thumb(_thumbs(raw))
    if not thumbnail_url and tracks:
        thumbnail_url = tracks[0].get("thumbnailUrl") or ""
    return {
        "id": raw.get("id") or "",
        "title": raw.get("title") or "Untitled",
        "description": raw.get("description") or "",
        "thumbnailUrl": thumbnail_url,
        "trackCount": _parse_count(raw.get("trackCount")) or len(tracks),
        "durationSec": int(raw.get("duration_seconds") or 0) or _parse_duration(raw.get("duration")),
        "author": (raw.get("author") or {}).get("name") if isinstance(raw.get("author"), dict) else raw.get("author") or "",
        "year": raw.get("year") or "",
        "tracks": tracks,
    }


def normalize_album(raw: dict) -> dict:
    return {
        "browseId": raw.get("browseId") or raw.get("audioPlaylistId") or "",
        "title": raw.get("title") or "Untitled",
        "artists": _artists(raw.get("artists") or raw.get("artist")),
        "year": raw.get("year") or "",
        "thumbnailUrl": raw.get("thumbnailUrl") or _best_thumb(_thumbs(raw)),
        "type": raw.get("type") or "Album",
    }


def normalize_artist(raw: dict) -> dict:
    return {
        "browseId": raw.get("browseId") or "",
        "name": raw.get("artist") or raw.get("title") or raw.get("name") or "Unknown",
        "thumbnailUrl": raw.get("thumbnailUrl") or _best_thumb(_thumbs(raw)),
        "subscribers": raw.get("subscribers") or "",
    }


def normalize_home_item(raw: dict) -> dict:
    """Home feed carousels mix tracks, playlists, albums, artists."""
    result_type = raw.get("resultType") or ""
    if raw.get("videoId"):
        t = normalize_track(raw)
        return {"kind": "track", "data": t} if t else {"kind": "unknown", "data": {}}
    if raw.get("playlistId") or (raw.get("browseId") or "").startswith("VL"):
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
        normalized = [_normalize_lyric_line(line) for line in lines]
        return {
            "lyrics": "\n".join(line["text"] for line in normalized),
            "source": raw.get("source") or "",
            "hasTimestamps": True,
            "lines": normalized,
        }
    return {
        "lyrics": raw.get("lyrics") or "",
        "source": raw.get("source") or "",
        "hasTimestamps": False,
        "lines": [],
    }


def _normalize_lyric_line(line: Any) -> dict:
    if isinstance(line, dict):
        start = (
            line.get("start_time_ms")
            or line.get("startTimeMs")
            or line.get("start_time")
            or line.get("startTime")
            or 0
        )
        return {"startMs": int(start or 0), "text": line.get("text") or line.get("lyricLine") or ""}
    start = getattr(line, "start_time", 0)
    return {"startMs": int(start or 0), "text": getattr(line, "text", "") or ""}
