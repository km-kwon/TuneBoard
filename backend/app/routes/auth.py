from __future__ import annotations

import secrets
import time
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from .. import youtube_data_client
from ..settings import settings
from ..ytmusic_client import has_auth

router = APIRouter()

_STATE_TTL_SEC = 10 * 60
_pending_states: dict[str, float] = {}


@router.get("/auth/status")
def auth_status() -> dict:
    auth_path = settings.auth_path
    return {
        "youtube": youtube_data_client.status(),
        "ytmusic": {
            "connected": has_auth(),
            "authFile": str(auth_path) if auth_path else "",
        },
    }


@router.get("/auth/google/start")
def google_auth_start() -> dict[str, str]:
    if not youtube_data_client.is_configured():
        raise HTTPException(
            status_code=400,
            detail="Set TUNEBOARD_GOOGLE_CLIENT_ID and TUNEBOARD_GOOGLE_CLIENT_SECRET first.",
        )
    _cleanup_states()
    state = secrets.token_urlsafe(24)
    _pending_states[state] = time.time() + _STATE_TTL_SEC
    return {"authUrl": youtube_data_client.build_auth_url(state)}


@router.get("/auth/google/callback")
def google_auth_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    if error:
        return _redirect("error", error)
    if not code or not state:
        return _redirect("error", "Missing OAuth code or state.")
    if not _consume_state(state):
        return _redirect("error", "OAuth state expired. Please try connecting again.")
    try:
        youtube_data_client.exchange_code(code)
    except Exception as exc:
        return _redirect("error", str(exc))
    return _redirect("connected", "Google account connected.")


@router.delete("/auth/google")
def google_auth_disconnect() -> dict[str, bool]:
    youtube_data_client.disconnect()
    return {"ok": True}


def _consume_state(state: str) -> bool:
    expires_at = _pending_states.pop(state, 0)
    return expires_at >= time.time()


def _cleanup_states() -> None:
    now = time.time()
    expired = [state for state, expires_at in _pending_states.items() if expires_at < now]
    for state in expired:
        _pending_states.pop(state, None)


def _redirect(status: str, message: str) -> RedirectResponse:
    query = urlencode({"auth": "google", "status": status, "message": message})
    return RedirectResponse(f"{settings.frontend_origin}/?{query}")
