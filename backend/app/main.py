from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import home, playlists, search, track
from .settings import settings
from .ytmusic_client import has_auth

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = FastAPI(title="TuneBoard API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "authed": has_auth()}


app.include_router(playlists.router, prefix="/api", tags=["playlists"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(home.router, prefix="/api", tags=["home"])
app.include_router(track.router, prefix="/api", tags=["track"])
