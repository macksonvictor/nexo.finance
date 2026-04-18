from __future__ import annotations

import time

from fastapi import FastAPI, Request

from app.config import settings
from app.routes.health import router as health_router
from app.routes.patterns import router as patterns_router
from app.routes.predict import router as predict_router
from app.routes.risk import router as risk_router
from app.services.logging import configure_logging, get_logger


configure_logging()
logger = get_logger()

app = FastAPI(title=settings.app_name, version=settings.version)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    started_at = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
    logger.info(
        "request path=%s method=%s status=%s durationMs=%s",
        request.url.path,
        request.method,
        response.status_code,
        duration_ms,
    )
    return response


app.include_router(health_router)
app.include_router(patterns_router)
app.include_router(risk_router)
app.include_router(predict_router)
