from __future__ import annotations

import logging
import re
from functools import lru_cache
from typing import Any

import requests

from .settings import settings

log = logging.getLogger(__name__)

_SESSION = requests.Session()
_TIME_RE = re.compile(r"\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]")
_BRACKETED_RE = re.compile(r"\s*[\[(][^\])]*(official|audio|video|lyrics?|mv|visualizer|remaster|live)[^\])]*[\])]\s*", re.I)
_FEAT_RE = re.compile(r"\s+(?:feat\.?|ft\.?|featuring)\s+.+$", re.I)


def fetch_lyrics(metadata: dict[str, Any]) -> dict | None:
    """Fetch normalized lyrics from LRCLIB using track metadata."""
    if not settings.lrclib_enabled:
        return None

    title = _clean_text(metadata.get("title"))
    artist = _clean_text(metadata.get("artist"))
    album = _clean_text(metadata.get("album"))
    duration = int(metadata.get("durationSec") or 0)
    if not title or not artist:
        return None

    try:
        raw = _fetch_cached(title, artist, album, duration)
    except requests.RequestException as exc:
        log.warning("lrclib request failed for %s - %s: %s", artist, title, exc)
        return None
    except Exception as exc:  # noqa: BLE001
        log.warning("lrclib lookup failed for %s - %s: %s", artist, title, exc)
        return None

    if not raw:
        return None
    return _normalize_lrclib(raw)


@lru_cache(maxsize=512)
def _fetch_cached(title: str, artist: str, album: str, duration: int) -> dict | None:
    _SESSION.headers.update({"User-Agent": settings.lrclib_user_agent})

    query_variants = _query_variants(title)
    artist_variants = _artist_variants(artist)
    for candidate_title in query_variants:
        for candidate_artist in artist_variants:
            exact = _get_exact(candidate_title, candidate_artist, album, duration)
            if exact:
                return exact

    results: list[dict] = []
    for candidate_title in query_variants:
        for candidate_artist in artist_variants:
            params = {
                "track_name": candidate_title,
                "artist_name": candidate_artist,
                "album_name": album or None,
            }
            response = _SESSION.get(
                f"{settings.lrclib_base_url.rstrip('/')}/search",
                params={k: v for k, v in params.items() if v},
                timeout=settings.lrclib_timeout,
            )
            if response.status_code == 404:
                continue
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, list):
                results.extend([item for item in payload if isinstance(item, dict)])
            if results:
                break
        if results:
            break

    return _best_result(results, title, artist, album, duration)


def _get_exact(title: str, artist: str, album: str, duration: int) -> dict | None:
    if not album or not duration:
        return None
    response = _SESSION.get(
        f"{settings.lrclib_base_url.rstrip('/')}/get",
        params={
            "track_name": title,
            "artist_name": artist,
            "album_name": album,
            "duration": duration,
        },
        timeout=settings.lrclib_timeout,
    )
    if response.status_code == 404:
        return None
    response.raise_for_status()
    payload = response.json()
    return payload if isinstance(payload, dict) else None


def _best_result(
    results: list[dict],
    title: str,
    artist: str,
    album: str,
    duration: int,
) -> dict | None:
    best: tuple[int, dict] | None = None
    needle_title = _key(title)
    needle_artist = _key(artist)
    needle_album = _key(album)

    for item in results:
        if not (item.get("syncedLyrics") or item.get("plainLyrics")):
            continue

        score = 0
        item_title = _key(item.get("trackName") or item.get("name"))
        item_artist = _key(item.get("artistName"))
        item_album = _key(item.get("albumName"))
        item_duration = int(item.get("duration") or 0)

        if item.get("syncedLyrics"):
            score += 100
        if item_title == needle_title:
            score += 60
        elif needle_title and (needle_title in item_title or item_title in needle_title):
            score += 35
        if item_artist == needle_artist:
            score += 45
        elif needle_artist and (needle_artist in item_artist or item_artist in needle_artist):
            score += 25
        if needle_album and item_album == needle_album:
            score += 15
        if duration and item_duration:
            score += max(0, 20 - abs(duration - item_duration))

        if best is None or score > best[0]:
            best = (score, item)

    return best[1] if best else None


def _normalize_lrclib(raw: dict) -> dict:
    synced = raw.get("syncedLyrics") or ""
    plain = raw.get("plainLyrics") or ""
    if synced:
        lines = _parse_lrc(synced)
        if lines:
            return {
                "lyrics": "\n".join(line["text"] for line in lines),
                "source": "LRCLIB",
                "hasTimestamps": True,
                "lines": lines,
            }
    if plain:
        return {
            "lyrics": plain,
            "source": "LRCLIB",
            "hasTimestamps": False,
            "lines": [],
        }
    if raw.get("instrumental"):
        return {
            "lyrics": "♪",
            "source": "LRCLIB",
            "hasTimestamps": False,
            "lines": [],
        }
    return {"lyrics": "", "source": "LRCLIB", "hasTimestamps": False, "lines": []}


def _parse_lrc(text: str) -> list[dict]:
    lines: list[dict] = []
    for raw_line in text.splitlines():
        matches = list(_TIME_RE.finditer(raw_line))
        if not matches:
            continue
        lyric = raw_line[matches[-1].end() :].strip()
        for match in matches:
            lines.append({"startMs": _timestamp_ms(match), "text": lyric})
    return sorted(lines, key=lambda line: line["startMs"])


def _timestamp_ms(match: re.Match[str]) -> int:
    minutes = int(match.group(1))
    seconds = int(match.group(2))
    fraction = (match.group(3) or "0")[:3].ljust(3, "0")
    return minutes * 60_000 + seconds * 1000 + int(fraction)


def _query_variants(title: str) -> list[str]:
    cleaned = _clean_title(title)
    variants = [title, cleaned, _FEAT_RE.sub("", cleaned).strip()]
    out: list[str] = []
    for value in variants:
        if value and value not in out:
            out.append(value)
    return out


def _artist_variants(artist: str) -> list[str]:
    first = re.split(r"\s*(?:,|&|\band\b|그리고|및)\s*", artist, maxsplit=1, flags=re.I)[0]
    variants = [artist, first.strip()]
    out: list[str] = []
    for value in variants:
        if value and value not in out:
            out.append(value)
    return out


def _clean_title(title: str) -> str:
    title = _BRACKETED_RE.sub(" ", title)
    title = re.sub(r"\s+", " ", title)
    return title.strip(" -")


def _clean_text(value: Any) -> str:
    if not value:
        return ""
    return str(value).strip()


def _key(value: Any) -> str:
    return re.sub(r"[^a-z0-9가-힣]+", "", _clean_text(value).lower())
