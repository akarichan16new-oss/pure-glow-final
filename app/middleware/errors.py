# -*- coding: utf-8 -*-
"""
PureGlow AI - Error Handlers
==============================

Registers error handlers on the Flask app so EVERY possible failure
always returns clean JSON -- never HTML, never a Python traceback.

Every error response follows the same envelope:
    {
        "success"    : false,
        "error"      : "error_code",
        "message"    : "Human-readable description",
        "status_code": 404,
        "request_id" : "abc123"   (optional, if X-Request-ID header sent)
    }

Handled error types
-------------------
HTTP 400   Bad Request            malformed JSON, missing Content-Type
HTTP 404   Not Found              unknown endpoint
HTTP 405   Method Not Allowed     wrong HTTP verb
HTTP 415   Unsupported Media Type non-JSON body sent to a JSON endpoint
HTTP 422   Unprocessable Entity   valid JSON but semantically invalid
HTTP 429   Too Many Requests      rate limit hit (future use)
HTTP 500   Internal Server Error  unhandled exception in a route
HTTP 503   Service Unavailable    engine not loaded
ValueError                        invalid profile inputs from the engine
RecommendationError               base engine exception
Any other Exception               catch-all (details hidden in production)

Usage
-----
    from app.middleware.errors import register_error_handlers
    register_error_handlers(app)
"""

import logging
import traceback
from typing import Tuple

from flask import Flask, Response, jsonify, request
from werkzeug.exceptions import (
    BadRequest,
    Forbidden,
    HTTPException,
    MethodNotAllowed,
    NotFound,
    ServiceUnavailable,
    TooManyRequests,
    UnprocessableEntity,
    UnsupportedMediaType,
)

log = logging.getLogger(__name__)


# ============================================================================
# Response builder
# ============================================================================

def _error_response(
    error_code: str,
    message: str,
    status: int,
    extra: dict = None,
) -> Tuple[Response, int]:
    """
    Build a standardised JSON error response.

    Parameters
    ----------
    error_code : str   Short machine-readable code  e.g. 'not_found'
    message    : str   Human-readable explanation
    status     : int   HTTP status code
    extra      : dict  Optional extra fields merged into the response body

    Returns
    -------
    (flask.Response, int)  ready to return from a handler
    """
    body = {
        'success':     False,
        'error':       error_code,
        'message':     message,
        'status_code': status,
    }

    # Echo back the X-Request-ID header if the client sent one
    # (useful for correlating API errors with frontend logs)
    request_id = request.headers.get('X-Request-ID')
    if request_id:
        body['request_id'] = request_id

    if extra:
        body.update(extra)

    return jsonify(body), status


# ============================================================================
# HTTP exception handlers
# ============================================================================

def _handle_400(e: BadRequest) -> Tuple[Response, int]:
    """
    400 Bad Request

    Common causes:
    - Body is not valid JSON
    - Content-Type header missing when JSON is expected
    """
    log.warning('400 Bad Request | path=%s | %s', request.path, str(e))
    return _error_response(
        error_code='bad_request',
        message=(
            'Request body is malformed. '
            'Make sure you are sending valid JSON and that '
            'Content-Type: application/json is set.'
        ),
        status=400,
    )


def _handle_404(e: NotFound) -> Tuple[Response, int]:
    """
    404 Not Found

    Common causes:
    - Typo in endpoint URL
    - Correct path but wrong url_prefix
    """
    log.info('404 Not Found | path=%s', request.path)
    return _error_response(
        error_code='not_found',
        message=(
            "Endpoint '{}' does not exist. "
            "Call GET / to see all available endpoints.".format(request.path)
        ),
        status=404,
    )


def _handle_405(e: MethodNotAllowed) -> Tuple[Response, int]:
    """
    405 Method Not Allowed

    Common causes:
    - Calling POST /api/stats instead of GET /api/stats
    - Calling GET  /api/recommend instead of POST /api/recommend
    """
    allowed = ', '.join(e.valid_methods) if hasattr(e, 'valid_methods') and e.valid_methods else 'unknown'
    log.info('405 Method Not Allowed | %s %s | allowed: %s',
             request.method, request.path, allowed)
    return _error_response(
        error_code='method_not_allowed',
        message=(
            '{} is not allowed on {}. '
            'Allowed methods: {}.'.format(request.method, request.path, allowed)
        ),
        status=405,
        extra={'allowed_methods': allowed},
    )


def _handle_415(e: UnsupportedMediaType) -> Tuple[Response, int]:
    """
    415 Unsupported Media Type

    Cause: POST endpoint received a body without Content-Type: application/json
    """
    log.warning('415 Unsupported Media Type | %s %s', request.method, request.path)
    return _error_response(
        error_code='unsupported_media_type',
        message=(
            'This endpoint expects JSON. '
            'Add the header: Content-Type: application/json'
        ),
        status=415,
    )


def _handle_422(e: UnprocessableEntity) -> Tuple[Response, int]:
    """
    422 Unprocessable Entity

    Cause: JSON is syntactically valid but semantically wrong
    (e.g. a required field is the wrong type)
    """
    log.warning('422 Unprocessable Entity | %s', str(e))
    return _error_response(
        error_code='unprocessable_entity',
        message='Request JSON is valid but contains invalid field values.',
        status=422,
    )


def _handle_429(e: TooManyRequests) -> Tuple[Response, int]:
    """
    429 Too Many Requests  (rate limiting -- future use)
    """
    log.warning('429 Too Many Requests | path=%s', request.path)
    return _error_response(
        error_code='rate_limit_exceeded',
        message='Too many requests. Please slow down and try again later.',
        status=429,
    )


def _handle_503(e: ServiceUnavailable) -> Tuple[Response, int]:
    """
    503 Service Unavailable

    Cause: engine not loaded at startup (file missing, corrupt CSV, etc.)
    """
    log.error('503 Service Unavailable | %s', str(e))
    return _error_response(
        error_code='service_unavailable',
        message='The service is temporarily unavailable. Check /health for details.',
        status=503,
    )


def _handle_http_exception(e: HTTPException) -> Tuple[Response, int]:
    """
    Catch-all for any other werkzeug HTTP exception not handled above.
    Ensures HTML is never returned even for rare 4xx/5xx codes.
    """
    log.warning('HTTP %d | %s %s | %s',
                e.code, request.method, request.path, str(e))
    return _error_response(
        error_code='http_error',
        message=e.description or str(e),
        status=e.code or 500,
    )


# ============================================================================
# Application exception handlers
# ============================================================================

def _handle_value_error(e: ValueError) -> Tuple[Response, int]:
    """
    ValueError -- raised by the recommendation engine on invalid profile inputs.

    Example: skin_type='OILY' or undertone='pink'
    The engine's error message is safe to return directly to the client.
    """
    log.info('ValueError (invalid input) | %s', str(e))
    return _error_response(
        error_code='invalid_input',
        message=str(e),
        status=400,
    )


def _handle_recommendation_error(e: Exception) -> Tuple[Response, int]:
    """
    RecommendationError -- base engine exception.
    Returned as 400 if it looks like a client error, 500 otherwise.
    """
    log.error('RecommendationError | %s', str(e))
    return _error_response(
        error_code='recommendation_error',
        message=str(e),
        status=400,
    )


def _handle_file_not_found(e: FileNotFoundError) -> Tuple[Response, int]:
    """
    FileNotFoundError -- model CSV or JSON file is missing.
    Returned as 503 (server config issue, not client fault).
    """
    log.error('FileNotFoundError (missing model file) | %s', str(e))
    return _error_response(
        error_code='model_file_missing',
        message=(
            'A required model file is missing. '
            'Run notebook 03 to regenerate it. '
            'Check /health for details.'
        ),
        status=503,
    )


def _handle_500(e: Exception) -> Tuple[Response, int]:
    """
    Catch-all for any unhandled exception.

    In DEVELOPMENT  -- includes the traceback in the response (helpful).
    In PRODUCTION   -- hides the traceback (security) and logs it server-side.
    """
    from flask import current_app

    tb = traceback.format_exc()
    log.exception('Unhandled exception on %s %s', request.method, request.path)

    if current_app.debug:
        # Development: show the full traceback in the JSON response
        return _error_response(
            error_code='internal_server_error',
            message=str(e),
            status=500,
            extra={'traceback': tb.splitlines()},
        )

    # Production: hide details from the client, already logged above
    return _error_response(
        error_code='internal_server_error',
        message=(
            'An unexpected error occurred. '
            'Our team has been notified. '
            'Please try again later.'
        ),
        status=500,
    )


# ============================================================================
# Registration
# ============================================================================

def register_error_handlers(app: Flask) -> None:
    """
    Attach all error handlers to the given Flask app.

    Call this from the app factory after creating the Flask instance:

        from app.middleware.errors import register_error_handlers
        register_error_handlers(app)

    Parameters
    ----------
    app : Flask
    """
    # HTTP errors
    app.register_error_handler(BadRequest,           _handle_400)
    app.register_error_handler(NotFound,             _handle_404)
    app.register_error_handler(MethodNotAllowed,     _handle_405)
    app.register_error_handler(UnsupportedMediaType, _handle_415)
    app.register_error_handler(UnprocessableEntity,  _handle_422)
    app.register_error_handler(TooManyRequests,      _handle_429)
    app.register_error_handler(ServiceUnavailable,   _handle_503)
    app.register_error_handler(HTTPException,        _handle_http_exception)

    # Application errors
    app.register_error_handler(ValueError,           _handle_value_error)
    app.register_error_handler(FileNotFoundError,    _handle_file_not_found)
    app.register_error_handler(Exception,            _handle_500)

    # Engine-specific errors (imported lazily so missing src/ doesn't crash)
    try:
        import sys
        sys.path.insert(0, str(app.config.get('SRC_DIR', 'src')))
        from recommendation_engine import RecommendationError
        app.register_error_handler(RecommendationError, _handle_recommendation_error)
        app.logger.debug('Registered RecommendationError handler')
    except ImportError:
        app.logger.debug(
            'recommendation_engine not importable yet -- '
            'RecommendationError handler skipped'
        )

    app.logger.info('Error handlers registered (%d handlers)', 12)
