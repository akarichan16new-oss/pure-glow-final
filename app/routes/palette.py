# -*- coding: utf-8 -*-
"""
PureGlow AI - Colour Palette Routes
===================================

Blueprint: palette_bp
Prefix: /api

Endpoints
---------
GET /api/palette
GET /api/palette/all
GET /api/palette/undertones
GET /api/palette/compare
"""

from __future__ import annotations

import logging
import math
from typing import Any

from flask import Blueprint, current_app, jsonify, request

log = logging.getLogger(__name__)

palette_bp = Blueprint("palette", __name__)


# ============================================================================
# Static undertone metadata
# ============================================================================

UNDERTONE_META = {
    "warm": {
        "title": "Warm Undertone",
        "description": (
            "Your skin has golden, peachy, or yellow undertones. "
            "Warm shades like coral, peach, bronze, and gold usually suit you well."
        ),
        "best_metals": "Gold, rose gold, copper",
        "avoid": "Very cool silver shades or icy pinks",
        "celebrity_examples": ["Beyonce", "Jennifer Lopez", "Priyanka Chopra"],
        "signs": [
            "Your veins look green or olive",
            "Gold jewellery flatters you more than silver",
            "You tan easily and rarely burn",
            "Earthy colours suit you well",
        ],
    },
    "cool": {
        "title": "Cool Undertone",
        "description": (
            "Your skin has pink, red, or blue undertones. "
            "Cool shades like berry, plum, rose, and silver usually suit you well."
        ),
        "best_metals": "Silver, white gold, platinum",
        "avoid": "Heavy orange shades or very warm bronzes",
        "celebrity_examples": ["Lupita Nyongo", "Taylor Swift", "Zendaya"],
        "signs": [
            "Your veins look blue or purple",
            "Silver jewellery flatters you more than gold",
            "You burn easily in the sun",
            "Jewel tones suit you well",
        ],
    },
    "neutral": {
        "title": "Neutral Undertone",
        "description": (
            "Your skin has a balance of warm and cool undertones. "
            "Most shades work well, especially nude, taupe, mauve, and soft neutral colours."
        ),
        "best_metals": "Both gold and silver work well",
        "avoid": "Very extreme warm or very extreme cool shades",
        "celebrity_examples": ["Angelina Jolie", "Kim Kardashian", "Natalie Portman"],
        "signs": [
            "Your veins look blue-green",
            "Both gold and silver jewellery suit you",
            "You neither burn nor tan very easily",
            "Both warm and cool colours suit you",
        ],
    },
}


DEFAULT_UNDERTONES = ["warm", "cool", "neutral"]


# ============================================================================
# JSON helpers
# ============================================================================

def _json_safe(value: Any) -> Any:
    """
    Convert Python, pandas, or numpy values into JSON-safe values.
    """
    if value is None:
        return None

    if isinstance(value, (str, bool, int)):
        return value

    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return value

    if hasattr(value, "item"):
        try:
            return _json_safe(value.item())
        except Exception:
            pass

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


# ============================================================================
# Response helpers
# ============================================================================

def success(data: Any, status: int = 200):
    """
    Standard success response.
    """
    return jsonify(
        {
            "success": True,
            "data": _json_safe(data),
        }
    ), status


def failure(error: str, message: str, status: int = 400):
    """
    Standard error response.
    """
    log.warning("Palette API error [%d] %s: %s", status, error, message)

    return jsonify(
        {
            "success": False,
            "error": error,
            "message": message,
        }
    ), status


# ============================================================================
# Engine helpers
# ============================================================================

def _get_engine_safely() -> Any | None:
    """
    Get recommendation engine without crashing the route.
    """
    try:
        from app import get_engine

        app = current_app._get_current_object()
        return get_engine(app)

    except Exception as e:
        log.exception("Could not access recommendation engine: %s", e)
        return None


def _get_engine_or_503():
    """
    Return engine or 503 response.
    """
    engine = _get_engine_safely()

    if engine is None:
        return None, failure(
            "engine_unavailable",
            "The recommendation engine is not loaded. Check /health for details.",
            status=503,
        )

    return engine, None


def _valid_undertones(engine: Any) -> list[str]:
    """
    Safely get valid undertones from engine.
    """
    undertones = getattr(engine, "VALID_UNDERTONES", DEFAULT_UNDERTONES)

    if isinstance(undertones, (list, tuple, set)):
        return [str(u).strip().lower() for u in undertones if str(u).strip()]

    return DEFAULT_UNDERTONES


def _get_palette_method(engine: Any):
    """
    Support both British and American spelling.
    """
    method = getattr(engine, "get_colour_palette", None)

    if callable(method):
        return method

    method = getattr(engine, "get_color_palette", None)

    if callable(method):
        return method

    return None


def _get_palette(engine: Any, undertone: str) -> dict:
    """
    Safely get palette for one undertone.
    """
    method = _get_palette_method(engine)

    if method is None:
        raise AttributeError(
            "Engine method get_colour_palette() or get_color_palette() is missing."
        )

    palette = method(undertone)

    if not isinstance(palette, dict):
        raise TypeError("Palette must be returned as a dictionary.")

    return palette


def _include_meta_value() -> bool:
    """
    Parse include_meta query parameter.
    """
    value = request.args.get("include_meta", "true").strip().lower()
    return value not in {"false", "0", "no", "off"}


def _palette_payload(undertone: str, palette: dict, include_meta: bool = True) -> dict:
    """
    Build response payload for one palette.
    """
    payload = {
        "undertone": undertone,
        "palette": palette,
    }

    if include_meta:
        meta = UNDERTONE_META.get(undertone, {})

        payload.update(
            {
                "title": meta.get("title", undertone.title()),
                "description": meta.get("description", ""),
                "best_metals": meta.get("best_metals", ""),
                "avoid": meta.get("avoid", ""),
                "celebrity_examples": meta.get("celebrity_examples", []),
            }
        )

    return payload


# ============================================================================
# GET /api/palette
# ============================================================================

@palette_bp.route("/palette", methods=["GET"])
def get_palette():
    """
    Return colour palette for one undertone.

    Example:
        /api/palette?undertone=warm
        /api/palette?undertone=cool&include_meta=false
    """
    engine, err = _get_engine_or_503()

    if err:
        return err

    undertone = request.args.get("undertone", "").strip().lower()
    include_meta = _include_meta_value()

    valid_undertones = _valid_undertones(engine)

    if not undertone:
        return failure(
            "missing_field",
            f"undertone query parameter is required. Valid values: {valid_undertones}. "
            "Example: /api/palette?undertone=warm",
        )

    if undertone not in valid_undertones:
        return failure(
            "invalid_undertone",
            f"Invalid undertone '{undertone}'. Valid values: {valid_undertones}",
        )

    try:
        palette = _get_palette(engine, undertone)

    except ValueError as e:
        return failure("invalid_input", str(e))

    except AttributeError as e:
        return failure("method_missing", str(e), status=501)

    except Exception as e:
        log.exception("Unexpected error in /api/palette")
        return failure("engine_error", str(e), status=500)

    return success(_palette_payload(undertone, palette, include_meta))


# ============================================================================
# GET /api/palette/all
# ============================================================================

@palette_bp.route("/palette/all", methods=["GET"])
def get_all_palettes():
    """
    Return all undertone palettes.
    """
    engine, err = _get_engine_or_503()

    if err:
        return err

    valid_undertones = _valid_undertones(engine)
    palettes = {}

    for undertone in valid_undertones:
        try:
            palette = _get_palette(engine, undertone)
            palettes[undertone] = _palette_payload(
                undertone,
                palette,
                include_meta=True,
            )

        except Exception as e:
            log.exception("Failed to load palette for %s", undertone)
            palettes[undertone] = {
                "undertone": undertone,
                "error": str(e),
            }

    return success(
        {
            "undertones": valid_undertones,
            "palettes": palettes,
        }
    )


# ============================================================================
# GET /api/palette/undertones
# ============================================================================

@palette_bp.route("/palette/undertones", methods=["GET"])
def list_undertones():
    """
    List valid undertones with descriptions and quiz signs.
    """
    engine, err = _get_engine_or_503()

    if err:
        return err

    valid_undertones = _valid_undertones(engine)

    undertones = []

    for value in valid_undertones:
        meta = UNDERTONE_META.get(value, {})

        undertones.append(
            {
                "value": value,
                "title": meta.get("title", value.title()),
                "description": meta.get("description", ""),
                "best_metals": meta.get("best_metals", ""),
                "avoid": meta.get("avoid", ""),
                "celebrity_examples": meta.get("celebrity_examples", []),
                "signs": meta.get("signs", []),
            }
        )

    return success(
        {
            "undertones": undertones,
        }
    )


# ============================================================================
# GET /api/palette/compare
# ============================================================================

@palette_bp.route("/palette/compare", methods=["GET"])
def compare_palettes():
    """
    Compare one product type across all undertones.

    Example:
        /api/palette/compare?product_type=lipstick
    """
    engine, err = _get_engine_or_503()

    if err:
        return err

    product_type = request.args.get("product_type", "").strip().lower()

    if not product_type:
        return failure(
            "missing_field",
            "product_type query parameter is required. "
            "Example: /api/palette/compare?product_type=lipstick",
        )

    valid_undertones = _valid_undertones(engine)
    comparison = {}
    available_types = set()

    try:
        for undertone in valid_undertones:
            palette = _get_palette(engine, undertone)

            available_types.update(palette.keys())

            if product_type not in palette:
                return failure(
                    "invalid_product_type",
                    f"Product type '{product_type}' not found. "
                    f"Available types: {sorted(available_types)}",
                )

            comparison[undertone] = palette[product_type]

    except AttributeError as e:
        return failure("method_missing", str(e), status=501)

    except ValueError as e:
        return failure("invalid_input", str(e))

    except Exception as e:
        log.exception("Unexpected error in /api/palette/compare")
        return failure("engine_error", str(e), status=500)

    return success(
        {
            "product_type": product_type,
            "comparison": comparison,
            "undertones": valid_undertones,
        }
    )