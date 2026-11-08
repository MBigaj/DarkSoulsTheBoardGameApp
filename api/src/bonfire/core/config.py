"""Typed settings, read from environment variables (prefix API_) or a .env file."""

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="API_", env_file=".env", extra="ignore")

    # In Docker, compose builds this from MONGO_INITDB_ROOT_*; never commit credentials.
    mongo_uri: SecretStr = SecretStr("mongodb://localhost:27017")
    mongo_db: str = "bonfire"
    mongo_timeout_ms: int = Field(default=2000, gt=0)

    # Card data store (read by the seed job).
    data_dir: Path = Path("../data")

    # Comma-separated in .env: API_CORS_ORIGINS=http://localhost:5173
    cors_origins: Annotated[list[str], NoDecode] = []

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
