from __future__ import annotations

from dataclasses import dataclass
import os


def _parse_bool(value: str | None, fallback: bool = False) -> bool:
    if value is None or value == "":
        return fallback

    return value.lower() in {"1", "true", "yes", "on"}


def _parse_int(value: str | None, fallback: int) -> int:
    if value is None or value == "":
        return fallback

    try:
        return int(value)
    except ValueError:
        return fallback


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("PY_AI_APP_NAME", "nexo-ai-python")
    version: str = os.getenv("PY_AI_VERSION", "0.1.0")
    enable_prophet: bool = _parse_bool(os.getenv("PY_AI_ENABLE_PROPHET"), False)
    request_timeout_ms: int = _parse_int(os.getenv("PY_AI_TIMEOUT_MS"), 2500)


settings = Settings()
