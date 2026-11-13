from bonfire.errors.base import AppError


class DatabaseUnavailableError(AppError):
    status = 503
    default_detail = "Database unavailable"
