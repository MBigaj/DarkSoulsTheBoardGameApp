"""Every error the API can return (error catalog). Import from here, not submodules.

base.py      AppError, the abstract base, and _problem_json() (package-internal)
handlers.py  register_error_handlers(): AppError + FastAPI's 404/405/422/500
<feature>.py that feature's errors, each a direct AppError subclass
"""

from bonfire.errors.base import AppError
from bonfire.errors.handlers import register_error_handlers
from bonfire.errors.health import DatabaseUnavailableError

__all__ = ["AppError", "DatabaseUnavailableError", "register_error_handlers"]
