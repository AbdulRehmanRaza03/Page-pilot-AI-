from __future__ import annotations

from http import HTTPStatus

from fastapi import HTTPException


class AppError(HTTPException):
    """Base application error, serialized to a consistent envelope."""

    status_code = HTTPStatus.BAD_REQUEST
    code = "bad_request"

    def __init__(self, message: str = "", *, code: str | None = None, details: dict | None = None):
        self.detail = message
        self.code = code or self.__class__.code
        self.details = details
        super().__init__(status_code=self.status_code, detail=self.to_dict())

    def to_dict(self) -> dict:
        body: dict = {"code": self.code, "message": self.detail}
        if self.details:
            body["details"] = self.details
        return body


class UnauthorizedError(AppError):
    status_code = HTTPStatus.UNAUTHORIZED
    code = "unauthorized"


class ForbiddenError(AppError):
    status_code = HTTPStatus.FORBIDDEN
    code = "forbidden"


class NotFoundError(AppError):
    status_code = HTTPStatus.NOT_FOUND
    code = "not_found"


class ConflictError(AppError):
    status_code = HTTPStatus.CONFLICT
    code = "conflict"


class ValidationError(AppError):
    status_code = HTTPStatus.UNPROCESSABLE_ENTITY
    code = "validation_error"


class RateLimitError(AppError):
    status_code = HTTPStatus.TOO_MANY_REQUESTS
    code = "rate_limited"


class MetaApiError(AppError):
    status_code = HTTPStatus.BAD_GATEWAY
    code = "meta_api_error"


class TokenError(AppError):
    status_code = HTTPStatus.UNAUTHORIZED
    code = "token_error"
