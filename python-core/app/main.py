from __future__ import annotations

import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.brain import router as brain_router
from app.api.health import router as health_router
from app.settings import settings


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="NEXO Brain MVP: financial context in, decision-ready output out.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    started_at = time.perf_counter()
    response = await call_next(request)
    response.headers["x-nexo-core-duration-ms"] = str(
        round((time.perf_counter() - started_at) * 1000, 2)
    )
    return response


app.include_router(health_router)
app.include_router(brain_router)
