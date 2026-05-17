# -*- coding: utf-8 -*-
"""
PureGlow AI - Health Check Routes
=================================

Endpoints
---------
GET  /health
GET  /health/ping
GET  /api/info
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from flask import Blueprint, current_app, jsonify

log = logging.getLogger(__name__)

health_bp = Blueprint("health", __name__)


# ============================================================================
# Helpers
# ============================================================================

def _utc_now() -> str:
    """Return current UTC time in ISO format."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _get_engine_safely() -> Any | None:
    """
    Safely get the recommendation engine from the Flask app.

    This avoids crashing the health route if the engine failed to load.
    """
    try:
        from app import get_engine

        app = current_app._get_current_object()
        return get_engine(app)

    except Exception as e:
        log.exception("Could not get recommendation engine: %s", e)
        return None


def _safe_list_attr(obj: Any, attr_name: str) -> list:
    """
    Safely read a list attribute from the engine.

    Example:
        engine.VALID_SKIN_TYPES
    """
    value = getattr(obj, attr_name, [])

    if value is None:
        return []

    if isinstance(value, (list, tuple, set)):
        return list(value)

    return []


def _build_health_payload(engine: Any | None) -> dict:
    """
    Build full health-check payload.
    """
    if engine is None:
        return {
            "status": "unhealthy",
            "issues": ["Recommendation engine failed to load."],
            "engine": None,
            "stats": {},
        }

    if not hasattr(engine, "health_check"):
        return {
            "status": "degraded",
            "issues": ["Engine loaded, but health_check() method is missing."],
            "engine": {
                "version": getattr(engine, "version", "unknown"),
            },
            "stats": {
                "skincare_products": len(getattr(engine, "skincare_df", [])),
                "makeup_products": len(getattr(engine, "makeup_df", [])),
            },
        }

    try:
        health = engine.health_check()

        return {
            "status": health.get("status", "unknown"),
            "issues": health.get("issues", []),
            "engine": {
                "version": health.get(
                    "engine_version",
                    getattr(engine, "version", "unknown"),
                ),
            },
            "stats": health.get("stats", {}),
        }

    except Exception as e:
        log.exception("Engine health_check() failed: %s", e)

        return {
            "status": "unhealthy",
            "issues": [f"Engine health_check() failed: {str(e)}"],
            "engine": {
                "version": getattr(engine, "version", "unknown"),
            },
            "stats": {},
        }


def _http_status(status: str) -> int:
    """
    Convert health status to HTTP status code.
    """
    status = str(status).lower()

    if status in {"healthy", "degraded"}:
        return 200

    return 503


def _get_environment_name() -> str:
    """
    Get current app environment name.
    """
    return (
        current_app.config.get("APP_ENV")
        or current_app.config.get("FLASK_CONFIG")
        or current_app.config.get("FLASK_ENV")
        or "development"
    )


# ============================================================================
# GET /health
# ============================================================================

@health_bp.route("/health", methods=["GET"])
def health():
    """
    Full health report.
    """
    engine = _get_engine_safely()

    payload = _build_health_payload(engine)
    payload["timestamp"] = _utc_now()
    payload["environment"] = _get_environment_name()

    http_code = _http_status(payload.get("status", "unknown"))

    if http_code == 503:
        log.error("Health check unhealthy: %s", payload.get("issues", []))
    elif payload.get("status") == "degraded":
        log.warning("Health check degraded: %s", payload.get("issues", []))
    else:
        log.debug("Health check OK")

    return jsonify(payload), http_code


# ============================================================================
# GET /health/ping
# ============================================================================

@health_bp.route("/health/ping", methods=["GET"])
def ping():
    """
    Lightweight liveness probe.
    """
    return jsonify(
        {
            "ping": "pong",
            "timestamp": _utc_now(),
        }
    ), 200


# ============================================================================
# GET /api/info
# ============================================================================

@health_bp.route("/api/info", methods=["GET"])
def api_info():
    """
    API metadata.
    """
    engine = _get_engine_safely()

    valid_inputs = {
        "skin_types": [],
        "concerns": [],
        "undertones": [],
    }

    if engine is not None:
        valid_inputs = {
            "skin_types": _safe_list_attr(engine, "VALID_SKIN_TYPES"),
            "concerns": _safe_list_attr(engine, "VALID_CONCERNS"),
            "undertones": _safe_list_attr(engine, "VALID_UNDERTONES"),
        }

    return jsonify(
        {
            "name": current_app.config.get("API_TITLE", "PureGlow AI API"),
            "version": current_app.config.get("API_VERSION", "1.0.0"),
            "description": current_app.config.get(
                "API_DESCRIPTION",
                "Skincare and makeup recommendation engine.",
            ),
            "environment": _get_environment_name(),
            "engine_loaded": engine is not None,
            "endpoints": {
                "GET /": "API homepage",
                "GET /health": "Full engine health report",
                "GET /health/ping": "Lightweight liveness probe",
                "GET /api/info": "API metadata",
                "POST /api/recommend": "Skincare + makeup recommendations",
                "POST /api/skincare": "Skincare-only recommendations",
                "POST /api/makeup": "Makeup-only recommendations",
                "GET /api/palette": "Colour palette for undertone",
                "GET /api/stats": "Engine and catalogue statistics",
            },
            "valid_inputs": valid_inputs,
        }
    ), 200