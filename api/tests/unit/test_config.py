import pytest

from bonfire.core.config import Settings


def test_cors_origins_accepts_comma_separated_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("API_CORS_ORIGINS", "http://localhost:5173, http://localhost:8080")

    assert Settings(_env_file=None).cors_origins == [
        "http://localhost:5173",
        "http://localhost:8080",
    ]


def test_username_without_password_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("API_MONGO_USERNAME", "bonfire")

    with pytest.raises(ValueError, match="API_MONGO_PASSWORD"):
        Settings(_env_file=None)


def test_blank_env_values_count_as_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    # compose passes an unset .env entry on as "" (e.g. API_MONGO_DB: ${MONGO_INITDB_DATABASE})
    monkeypatch.setenv("API_MONGO_USERNAME", "")
    monkeypatch.setenv("API_MONGO_PASSWORD", "")
    monkeypatch.setenv("API_MONGO_DB", "")

    settings = Settings(_env_file=None)

    assert settings.mongo_username is None
    assert settings.mongo_db == "bonfire"
