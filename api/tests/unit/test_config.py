import pytest

from bonfire.core.config import Settings


def test_cors_origins_accepts_comma_separated_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("API_CORS_ORIGINS", "http://localhost:5173, http://localhost:8080")

    assert Settings(_env_file=None).cors_origins == [
        "http://localhost:5173",
        "http://localhost:8080",
    ]
