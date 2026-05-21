from __future__ import annotations

import importlib.metadata
import logging
import time
from pathlib import Path
from threading import RLock
from typing import Any, Callable, TypeVar

from ytmusicapi import YTMusic
from ytmusicapi.exceptions import YTMusicServerError, YTMusicUserError

try:
    from ytmusicapi import OAuthCredentials
except ImportError:  # ytmusicapi < 1.10 compatibility
    OAuthCredentials = None  # type: ignore[assignment]

from .settings import settings

log = logging.getLogger(__name__)

T = TypeVar("T")

_client: YTMusic | None = None
_public_client: YTMusic | None = None
_client_has_auth: bool = False
_client_auth_type: str = "UNAUTHORIZED"
_client_auth_path: Path | None = None
_auth_fingerprint: tuple[str, int, int] | None = None
_last_error: str = ""
_init_lock = RLock()
_call_lock = RLock()


class YTMusicCallError(RuntimeError):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def get_client() -> YTMusic:
    """Return the auth-aware client, rebuilding when browser.json/oauth.json changes."""
    global _client, _client_has_auth, _client_auth_type, _client_auth_path, _auth_fingerprint, _last_error
    auth_path = settings.auth_path
    fingerprint = _fingerprint(auth_path)

    if _client is not None and fingerprint == _auth_fingerprint:
        return _client

    with _init_lock:
        auth_path = settings.auth_path
        fingerprint = _fingerprint(auth_path)
        if _client is not None and fingerprint == _auth_fingerprint:
            return _client

        _client_auth_path = auth_path
        _auth_fingerprint = fingerprint
        _last_error = ""
        try:
            if auth_path is not None:
                log.info("[ytmusic] using auth file: %s", auth_path)
                _client = _build_client(auth_path)
                _client_has_auth = True
                _client_auth_type = _auth_type_name(_client)
            else:
                log.warning(
                    "[ytmusic] no auth file found — running unauthenticated. "
                    "Playlists and liked songs will return 401."
                )
                _client = YTMusic()
                _client_has_auth = False
                _client_auth_type = "UNAUTHORIZED"
        except Exception as exc:
            log.exception("[ytmusic] failed to initialize: %s", exc)
            # Fall back to unauth'd so search/home still work.
            _client = YTMusic()
            _client_has_auth = False
            _client_auth_type = "UNAUTHORIZED"
            _last_error = str(exc)
        return _client


def get_public_client() -> YTMusic:
    """Unauthenticated client for public endpoints when stored auth is stale."""
    global _public_client
    if _public_client is not None:
        return _public_client
    with _init_lock:
        if _public_client is None:
            _public_client = YTMusic()
        return _public_client


def has_auth() -> bool:
    get_client()  # ensure init
    return _client_has_auth


def status() -> dict[str, Any]:
    get_client()
    return {
        "connected": _client_has_auth,
        "authFile": str(_client_auth_path) if _client_auth_path else "",
        "authType": _client_auth_type,
        "authError": _last_error,
        "version": _version(),
        "oauthClientConfigured": bool(
            settings.ytmusic_oauth_client_id and settings.ytmusic_oauth_client_secret
        ),
    }


def safe_call(fn: Callable[..., T], *args, retries: int = 1, **kwargs) -> T:
    """Wrap ytmusicapi calls with small retries and normalized error messages."""
    last_exc: Exception | None = None
    for attempt in range(max(0, retries) + 1):
        try:
            # ytmusicapi mutates client context for a few calls (notably lyrics with
            # timestamps). Serializing access keeps one shared FastAPI process stable.
            with _call_lock:
                return fn(*args, **kwargs)
        except Exception as exc:  # noqa: BLE001 - upstream raises broad exceptions
            last_exc = exc
            if _is_auth_error(exc):
                _mark_auth_error(exc)
                raise YTMusicCallError(
                    401,
                    "YouTube Music auth is missing or expired. Refresh backend/browser.json or oauth.json.",
                ) from exc
            if isinstance(exc, YTMusicUserError):
                raise YTMusicCallError(400, str(exc)) from exc
            if attempt < retries and _is_transient(exc):
                time.sleep(0.25 * (attempt + 1))
                continue
            break

    detail = str(last_exc) if last_exc else "Unknown YouTube Music error"
    raise YTMusicCallError(502, f"YouTube Music request failed: {detail}") from last_exc


def _build_client(auth_path: Path) -> YTMusic:
    if (
        auth_path.name == "oauth.json"
        and OAuthCredentials is not None
        and settings.ytmusic_oauth_client_id
        and settings.ytmusic_oauth_client_secret
    ):
        return YTMusic(
            str(auth_path),
            oauth_credentials=OAuthCredentials(
                client_id=settings.ytmusic_oauth_client_id,
                client_secret=settings.ytmusic_oauth_client_secret,
            ),
        )
    return YTMusic(str(auth_path))


def _fingerprint(path: Path | None) -> tuple[str, int, int] | None:
    if path is None:
        return None
    try:
        stat = path.stat()
    except OSError:
        return None
    return (str(path), stat.st_mtime_ns, stat.st_size)


def _auth_type_name(client: YTMusic) -> str:
    value = getattr(client, "auth_type", "")
    return getattr(value, "name", str(value)) or "UNKNOWN"


def _is_auth_error(exc: Exception) -> bool:
    message = str(exc).lower()
    if isinstance(exc, YTMusicUserError) and "provide authentication" in message:
        return True
    return any(
        marker in message
        for marker in (
            "http 401",
            "unauthorized",
            "login required",
            "authentication",
            "auth is missing",
            "cookie is missing",
            "sapisid",
            "oauth",
        )
    )


def _is_transient(exc: Exception) -> bool:
    message = str(exc).lower()
    return isinstance(exc, YTMusicServerError) or any(
        marker in message
        for marker in (
            "timeout",
            "temporarily",
            "try again",
            "http 429",
            "http 500",
            "http 502",
            "http 503",
            "http 504",
            "connection",
        )
    )


def _mark_auth_error(exc: Exception) -> None:
    global _client_has_auth, _last_error
    _client_has_auth = False
    _last_error = str(exc)


def _version() -> str:
    try:
        return importlib.metadata.version("ytmusicapi")
    except importlib.metadata.PackageNotFoundError:
        return ""
