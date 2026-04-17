from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from ..normalize import normalize_home
from ..ytmusic_client import get_client

router = APIRouter()
log = logging.getLogger(__name__)


@router.get("/home")
def home(limit: int = 6) -> list[dict]:
    yt = get_client()
    try:
        raw = yt.get_home(limit=limit)
    except Exception as exc:
        log.exception("get_home failed")
        raise HTTPException(status_code=502, detail=str(exc))
    return normalize_home(raw)
