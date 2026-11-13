import pytest

from bonfire.errors import AppError


def test_app_error_cannot_be_raised_directly() -> None:
    with pytest.raises(TypeError):
        AppError()


def test_subclass_without_status_is_rejected() -> None:
    with pytest.raises(TypeError):

        class NoStatus(AppError):
            pass
