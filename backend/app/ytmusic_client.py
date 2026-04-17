from __future__ import annotations

import logging
from threading import Lock
from typing import Any

from ytmusicapi import YTMusic

from .settings import settings

log = logging.getLogger(__name__)

_client: YTMusic | None = None
_client_has_auth: bool = False
_lock = Lock()


def get_client() -> YTMusic:
    global _client, _client_has_auth
    if _client is not None:
        return _client
    with _lock:
        if _client is not None:
            return _client
        auth_path = settings.auth_path
        try:
            if auth_path is not None:
                log.info("[ytmusic] using auth file: %s", auth_path)
                _client = YTMusic(str(auth_path))
                _client_has_auth = True
            else:
                log.warning(
                    "[ytmusic] no auth file found — running unauthenticated. "
                    "Playlists and liked songs will return 401."
                )
                _client = YTMusic()
                _client_has_auth = False
        except Exception as exc:
            log.exception("[ytmusic] failed to initialize: %s", exc)
            # Fall back to unauth'd so search/home still work.
            _client = YTMusic()
            _client_has_auth = False
        return _client


def has_auth() -> bool:
    get_client()  # ensure init
    return _client_has_auth


def safe_call(fn, *args, **kwargs) -> Any:
    """Wrap ytmusicapi calls — upstream library raises bare Exceptions often."""
    return fn(*args, **kwargs)
