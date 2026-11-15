"""Typed settings, read from environment variables (prefix API_) or a .env file."""

from functools import lru_cache
from pathlib import Path
from typing import Annotated, Self

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    # env_ignore_empty: a blank value (e.g. an unset .env entry passed on by compose)
    # counts as unset, so the default applies instead of "".
    model_config = SettingsConfigDict(
        env_prefix="API_", env_file=".env", env_ignore_empty=True, extra="ignore"
    )

    # Credentials stay separate fields, never one URI: the driver combines them, so no
    # connection string with a password exists anywhere and special characters need
    # no percent-encoding.
    mongo_host: str = "localhost"
    mongo_port: int = Field(default=27017, gt=0, lt=65536)
    mongo_username: str | None = None
    mongo_password: SecretStr | None = None
    mongo_auth_source: str = "admin"
    mongo_db: str = "bonfire"
    mongo_timeout_ms: int = Field(default=2000, gt=0)

    # Card data store (read by the seed job). Docker sets /data; outside Docker the
    # default is the DSTBG_DATA folder next to the repo, seen from api/.
    data_dir: Path = Path("../../DSTBG_DATA")

    # Comma-separated in .env: API_CORS_ORIGINS=http://localhost:5173
    cors_origins: Annotated[list[str], NoDecode] = []

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def credentials_come_in_pairs(self) -> Self:
        """Fail at startup, with a clear message, instead of at the first query."""
        if (self.mongo_username is None) != (self.mongo_password is None):
            raise ValueError("Set both API_MONGO_USERNAME and API_MONGO_PASSWORD, or neither")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
