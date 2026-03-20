from __future__ import annotations


class AppError(Exception):
    status_code: int = 500
    detail: str = "Internal Server Error"

    def __init__(self, detail: str | None = None) -> None:
        super().__init__(detail or self.detail)
        if detail:
            self.detail = detail


class BadRequestError(AppError):
    status_code = 400
    detail = "Bad Request"


class UnauthorizedError(AppError):
    status_code = 401
    detail = "Unauthorized"


class NotFoundError(AppError):
    status_code = 404
    detail = "Not Found"


class ConfigError(AppError):
    status_code = 500
    detail = "Server configuration error"


class UpstreamServiceError(AppError):
    status_code = 502
    detail = "Upstream service error"


class ServiceUnavailableError(AppError):
    status_code = 503
    detail = "Service unavailable"
