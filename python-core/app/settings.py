from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the NEXO Python Core.

    Keep this service independent from the existing Node gateway. The gateway
    may call it over HTTP, but the Python Core should never depend on frontend
    state or browser-only assumptions.
    """

    model_config = SettingsConfigDict(env_prefix="NEXO_CORE_", extra="ignore")

    app_name: str = "NEXO Python Core"
    version: str = "0.1.0"
    environment: str = Field(default="development")


settings = Settings()

