# -*- coding: utf-8 -*-
"""
PureGlow AI - Recommendation Routes
===================================

Blueprint: recommendations_bp
Prefix: /api

Endpoints
---------
POST /api/recommend
POST /api/skincare
POST /api/makeup
POST /api/routine
POST /api/explain
GET  /api/stats
GET  /api/brands
"""

from __future__ import annotations

import logging
import math
from functools import wraps
from typing import Any, Callable

from flask import Blueprint, current_app, jsonify, request

log = logging.getLogger(__name__)

recommendations_bp = Blueprint("recommendations", __name__)


# ============================================================================
# JSON helpers
# ============================================================================

def _json_safe(value: Any) -> Any:
    """
    Convert pandas/numpy/Python objects into Flask JSON-safe values.
    """
    if value is None:
        return None

    if isinstance(value, (str, bool, int)):
        return value

    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return value

    # numpy scalar support
    if hasattr(value, "item"):
        try:
            return _json_safe(value.item())
        except Exception:
            pass

    # pandas Timestamp / datetime support
    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            pass

    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}

    if isinstance(value, (list, tuple, set)):
        return [_json_safe(v) for v in value]

    return str(value)


def _records(obj: Any) -> list[dict]:
    """
    Convert a pandas DataFrame or list-like object into records.
    """
    if obj is None:
        return []

    if hasattr(obj, "to_dict"):
        try:
            return _json_safe(obj.to_dict(orient="records"))
        except TypeError:
            try:
                return _json_safe(obj.to_dict())
            except Exception:
                return []

    if isinstance(obj, list):
        return _json_safe(obj)

    return []


# ============================================================================
# Response helpers
# ============================================================================

def success(data: Any, status: int = 200):
    """
    Return a standard success response.
    """
    return jsonify(
        {
            "success": True,
            "data": _json_safe(data),
        }
    ), status


def failure(error: str, message: str, status: int = 400):
    """
    Return a standard error response.
    """
    log.warning("API error [%d] %s: %s", status, error, message)

    return jsonify(
        {
            "success": False,
            "error": error,
            "message": message,
        }
    ), status


# ============================================================================
# Request helpers
# ============================================================================

def _body() -> dict:
    """
    Safely parse JSON request body.
    """
    data = request.get_json(silent=True)

    if isinstance(data, dict):
        return data

    return {}


def _string_param(data: dict, key: str, default: str = "") -> str:
    """
    Safely read a string from request JSON.
    """
    value = data.get(key, default)

    if value is None:
        return default

    return str(value).strip()


def _optional_string_param(data: dict, key: str) -> str | None:
    """
    Read an optional string.
    """
    value = _string_param(data, key)

    return value if value else None


def _int_param(
    data: dict,
    key: str,
    default: int,
    min_val: int = 1,
    max_val: int = 100,
) -> int:
    """
    Parse and clamp integer value.
    """
    try:
        value = int(data.get(key, default))
    except (TypeError, ValueError):
        value = default

    return max(min_val, min(max_val, value))


def _float_param(data: dict, key: str) -> float | None:
    """
    Parse an optional positive float.
    """
    value = data.get(key)

    if value in (None, ""):
        return None

    try:
        result = float(value)
    except (TypeError, ValueError):
        return None

    return result if result > 0 else None


def _list_param(data: dict, key: str) -> list[str]:
    """
    Parse list or comma-separated string into a clean list.
    """
    value = data.get(key)

    if value is None:
        return []

    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]

    if isinstance(value, str):
        return [v.strip() for v in value.split(",") if v.strip()]

    return []


def _valid_values(engine: Any, attr_name: str) -> list[str]:
    """
    Safely read valid values from engine.
    """
    value = getattr(engine, attr_name, [])

    if isinstance(value, (list, tuple, set)):
        return list(value)

    return []


def _get_engine_safely() -> Any | None:
    """
    Get engine without crashing the route.
    """
    try:
        from app import get_engine

        app = current_app._get_current_object()
        return get_engine(app)

    except Exception as e:
        log.exception("Could not access recommendation engine: %s", e)
        return None


def _engine_method(engine: Any, method_name: str) -> Callable | None:
    """
    Safely get an engine method.
    """
    method = getattr(engine, method_name, None)

    if callable(method):
        return method

    return None


# ============================================================================
# Engine guard decorator
# ============================================================================

def require_engine(route_function):
    """
    Ensure engine is loaded before route runs.
    """

    @wraps(route_function)
    def wrapper(*args, **kwargs):
        engine = _get_engine_safely()

        if engine is None:
            return failure(
                "engine_unavailable",
                "The recommendation engine is not loaded. Check /health for details.",
                status=503,
            )

        return route_function(engine, *args, **kwargs)

    return wrapper


# ============================================================================
# POST /api/recommend
# ============================================================================

@recommendations_bp.route("/recommend", methods=["POST"])
@require_engine
def recommend(engine):
    """
    Full recommendation bundle.
    """
    method = _engine_method(engine, "recommend")

    if method is None:
        return failure(
            "method_missing",
            "Engine method recommend() is missing.",
            status=501,
        )

    data = _body()

    skin_type = _string_param(data, "skin_type")
    concerns = _list_param(data, "concerns")
    undertone = _optional_string_param(data, "undertone")
    skin_tone = _optional_string_param(data, "skin_tone")

    top_n = _int_param(
        data,
        "top_n",
        default=current_app.config.get("DEFAULT_TOP_N", 5),
        max_val=current_app.config.get("MAX_TOP_N", 100),
    )

    max_price = _float_param(data, "max_price")
    product_types = _list_param(data, "product_types")

    if not skin_type:
        return failure(
            "missing_field",
            f"skin_type is required. Valid values: {_valid_values(engine, 'VALID_SKIN_TYPES')}",
        )

    try:
        result = method(
            skin_type=skin_type,
            concerns=concerns or None,
            undertone=undertone,
            skin_tone=skin_tone,
            top_n=top_n,
            max_price=max_price,
            product_types=product_types or None,
        )

    except ValueError as e:
        return failure("invalid_input", str(e))

    except Exception as e:
        log.exception("Unexpected error in /api/recommend")
        return failure("engine_error", str(e), status=500)

    return success(result)


# ============================================================================
# POST /api/skincare
# ============================================================================

@recommendations_bp.route("/skincare", methods=["POST"])
@require_engine
def skincare_only(engine):
    """
    Skincare-only recommendations.
    """
    method = _engine_method(engine, "get_skincare")

    if method is None:
        return failure(
            "method_missing",
            "Engine method get_skincare() is missing.",
            status=501,
        )

    data = _body()

    skin_type = _string_param(data, "skin_type")
    concerns = _list_param(data, "concerns")

    top_n = _int_param(
        data,
        "top_n",
        default=10,
        max_val=current_app.config.get("MAX_TOP_N", 100),
    )

    max_price = _float_param(data, "max_price")
    brands = _list_param(data, "brands")
    exclude_brands = _list_param(data, "exclude_brands")

    if not skin_type:
        return failure(
            "missing_field",
            f"skin_type is required. Valid values: {_valid_values(engine, 'VALID_SKIN_TYPES')}",
        )

    try:
        df = method(
            skin_type=skin_type,
            concerns=concerns or None,
            top_n=top_n,
            max_price=max_price,
            brands=brands or None,
            exclude_brands=exclude_brands or None,
        )

    except ValueError as e:
        return failure("invalid_input", str(e))

    except Exception as e:
        log.exception("Unexpected error in /api/skincare")
        return failure("engine_error", str(e), status=500)

    products = _records(df)

    return success(
        {
            "skin_type": skin_type,
            "concerns": concerns,
            "total": len(products),
            "products": products,
        }
    )


# ============================================================================
# POST /api/makeup
# ============================================================================

@recommendations_bp.route("/makeup", methods=["POST"])
@require_engine
def makeup_only(engine):
    """
    Makeup-only recommendations.
    """
    method = _engine_method(engine, "get_makeup")

    if method is None:
        return failure(
            "method_missing",
            "Engine method get_makeup() is missing.",
            status=501,
        )

    data = _body()

    undertone = _string_param(data, "undertone")
    product_types = _list_param(data, "product_types")

    top_n = _int_param(
        data,
        "top_n",
        default=10,
        max_val=current_app.config.get("MAX_TOP_N", 100),
    )

    max_price = _float_param(data, "max_price")
    brands = _list_param(data, "brands")

    if not undertone:
        return failure(
            "missing_field",
            f"undertone is required. Valid values: {_valid_values(engine, 'VALID_UNDERTONES')}",
        )

    try:
        df = method(
            undertone=undertone,
            product_types=product_types or None,
            top_n=top_n,
            max_price=max_price,
            brands=brands or None,
        )

    except ValueError as e:
        return failure("invalid_input", str(e))

    except Exception as e:
        log.exception("Unexpected error in /api/makeup")
        return failure("engine_error", str(e), status=500)

    products = _records(df)

    return success(
        {
            "undertone": undertone,
            "product_types": product_types,
            "total": len(products),
            "products": products,
        }
    )


# ============================================================================
# POST /api/routine
# ============================================================================

@recommendations_bp.route("/routine", methods=["POST"])
@require_engine
def routine(engine):
    """
    Build a skincare routine.
    """
    method = _engine_method(engine, "get_routine")

    if method is None:
        return failure(
            "method_missing",
            "Engine method get_routine() is missing.",
            status=501,
        )

    data = _body()

    skin_type = _string_param(data, "skin_type")
    concerns = _list_param(data, "concerns")
    max_budget = _float_param(data, "max_budget")

    if not skin_type:
        return failure(
            "missing_field",
            f"skin_type is required. Valid values: {_valid_values(engine, 'VALID_SKIN_TYPES')}",
        )

    try:
        routine_result = method(
            skin_type=skin_type,
            concerns=concerns or None,
            max_budget=max_budget,
        )

    except ValueError as e:
        return failure("invalid_input", str(e))

    except Exception as e:
        log.exception("Unexpected error in /api/routine")
        return failure("engine_error", str(e), status=500)

    if isinstance(routine_result, dict):
        routine_data = dict(routine_result)
        total_cost = routine_data.pop("_total_cost", 0.0)
    else:
        routine_data = routine_result
        total_cost = 0.0

    return success(
        {
            "skin_type": skin_type,
            "concerns": concerns,
            "max_budget": max_budget,
            "total_cost": total_cost,
            "routine": routine_data,
        }
    )


# ============================================================================
# POST /api/explain
# ============================================================================

@recommendations_bp.route("/explain", methods=["POST"])
@require_engine
def explain(engine):
    """
    Explain why a product was recommended.
    """
    method = _engine_method(engine, "explain")

    if method is None:
        return failure(
            "method_missing",
            "Engine method explain() is missing.",
            status=501,
        )

    data = _body()

    product_id = _string_param(data, "product_id")
    skin_type = _string_param(data, "skin_type")
    concerns = _list_param(data, "concerns")

    if not product_id:
        return failure("missing_field", "product_id is required.")

    if not skin_type:
        return failure(
            "missing_field",
            f"skin_type is required. Valid values: {_valid_values(engine, 'VALID_SKIN_TYPES')}",
        )

    try:
        explanation = method(
            product_id=product_id,
            skin_type=skin_type,
            concerns=concerns or None,
        )

    except ValueError as e:
        return failure("invalid_input", str(e))

    except Exception as e:
        log.exception("Unexpected error in /api/explain")
        return failure("engine_error", str(e), status=500)

    if isinstance(explanation, dict) and "error" in explanation:
        return failure("not_found", str(explanation["error"]), status=404)

    return success(explanation)


# ============================================================================
# GET /api/stats
# ============================================================================

@recommendations_bp.route("/stats", methods=["GET"])
@require_engine
def stats(engine):
    """
    Engine and catalogue statistics.
    """
    method = _engine_method(engine, "get_stats")

    if method is None:
        return failure(
            "method_missing",
            "Engine method get_stats() is missing.",
            status=501,
        )

    try:
        engine_stats = method()

    except Exception as e:
        log.exception("Unexpected error in /api/stats")
        return failure("engine_error", str(e), status=500)

    return success(engine_stats)


# ============================================================================
# GET /api/brands
# ============================================================================

@recommendations_bp.route("/brands", methods=["GET"])
@require_engine
def top_brands(engine):
    """
    Top brands for a given skin profile.

    Example:
        /api/brands?skin_type=oily&concerns=acne,dark_spots&top_n=10
    """
    method = _engine_method(engine, "get_top_brands")

    if method is None:
        return failure(
            "method_missing",
            "Engine method get_top_brands() is missing.",
            status=501,
        )

    skin_type = request.args.get("skin_type", "").strip()

    concerns_raw = request.args.get("concerns", "").strip()
    concerns = [c.strip() for c in concerns_raw.split(",") if c.strip()]

    try:
        top_n = int(request.args.get("top_n", 10))
    except (TypeError, ValueError):
        top_n = 10

    top_n = max(1, min(top_n, 50))

    if not skin_type:
        return failure(
            "missing_field",
            "skin_type query parameter is required. Example: /api/brands?skin_type=oily&concerns=acne",
        )

    try:
        brands_df = method(
            skin_type=skin_type,
            concerns=concerns or None,
            top_n=top_n,
        )

    except ValueError as e:
        return failure("invalid_input", str(e))

    except Exception as e:
        log.exception("Unexpected error in /api/brands")
        return failure("engine_error", str(e), status=500)

    brands = _records(brands_df)

    return success(
        {
            "skin_type": skin_type,
            "concerns": concerns,
            "brands": brands,
        }
    )