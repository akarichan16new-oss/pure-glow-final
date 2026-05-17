# -*- coding: utf-8 -*-
"""
PureGlow AI - Flask App Factory
===============================

Creates and configures the Flask application.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any, Optional

from flask import Flask, jsonify, request
from flask_cors import CORS

from app.config import get_config, configure_logging


# ============================================================================
# Recommendation engine loader
# ============================================================================

def _add_src_to_path(app: Flask) -> Path:
    """
    Add SRC_DIR to Python path so recommendation_engine.py can be imported.
    """
    src_dir = Path(app.config.get("SRC_DIR", "src")).resolve()

    if not src_dir.exists():
        app.logger.warning("SRC_DIR does not exist: %s", src_dir)

    src_dir_str = str(src_dir)

    if src_dir_str not in sys.path:
        sys.path.insert(0, src_dir_str)

    return src_dir


def _load_recommendation_engine(app: Flask) -> Optional[Any]:
    """
    Load the PureGlow recommendation engine.
    """
    src_dir = _add_src_to_path(app)

    try:
        from recommendation_engine import load_engine

    except ModuleNotFoundError as e:
        app.extensions["pureglow_engine_error"] = str(e)
        app.logger.error(
            "Cannot find recommendation_engine.py inside SRC_DIR: %s | Error: %s",
            src_dir,
            e,
        )
        return None

    except Exception as e:
        app.extensions["pureglow_engine_error"] = str(e)
        app.logger.exception("Error importing recommendation_engine.py: %s", e)
        return None

    try:
        models_dir = Path(app.config.get("MODELS_DIR", "models")).resolve()
        engine = load_engine(models_dir=models_dir)

        skincare_count = len(getattr(engine, "skincare_df", []))
        makeup_count = len(getattr(engine, "makeup_df", []))

        app.extensions["pureglow_engine_error"] = None

        app.logger.info(
            "Recommendation engine loaded successfully: %d skincare products, %d makeup products",
            skincare_count,
            makeup_count,
        )

        return engine

    except FileNotFoundError as e:
        app.extensions["pureglow_engine_error"] = str(e)
        app.logger.error("Model/data files are missing: %s", e)
        return None

    except Exception as e:
        app.extensions["pureglow_engine_error"] = str(e)
        app.logger.exception("Unexpected error loading recommendation engine: %s", e)
        return None


def get_engine(app: Flask) -> Optional[Any]:
    """
    Return the recommendation engine.

    If the engine is not cached, try loading it again.
    """
    engine = app.extensions.get("pureglow_engine")

    if engine is not None:
        return engine

    app.logger.info("Engine not cached. Trying to load recommendation engine again...")

    engine = _load_recommendation_engine(app)
    app.extensions["pureglow_engine"] = engine

    return engine


# ============================================================================
# CORS setup
# ============================================================================

def _setup_cors(app: Flask) -> None:
    """
    Enable CORS for frontend access.
    """
    origins = app.config.get("CORS_ORIGINS", [])

    if not origins:
        app.logger.warning(
            "No CORS_ORIGINS configured. Frontend browser requests may be blocked."
        )
        return

    CORS(
        app,
        resources={
            r"/api/*": {"origins": origins},
            r"/health": {"origins": origins},
            r"/health/*": {"origins": origins},
            r"/": {"origins": origins},
        },
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    app.logger.info("CORS enabled for origins: %s", origins)


# ============================================================================
# Root endpoint
# ============================================================================

def _register_root(app: Flask) -> None:
    """
    Register the homepage API route.
    """

    @app.route("/", methods=["GET"])
    def index():
        engine = get_engine(app)

        return jsonify(
            {
                "name": app.config.get("API_TITLE", "PureGlow AI API"),
                "version": app.config.get("API_VERSION", "1.0.0"),
                "description": app.config.get(
                    "API_DESCRIPTION",
                    "Skincare and makeup recommendation engine.",
                ),
                "status": "running",
                "engine_loaded": engine is not None,
                "engine_error": app.extensions.get("pureglow_engine_error"),
                "endpoints": {
                    "health": "/health",
                    "ping": "/health/ping",
                    "info": "/api/info",
                    "recommend": "/api/recommend [POST]",
                    "skincare": "/api/skincare [POST]",
                    "makeup": "/api/makeup [POST]",
                    "routine": "/api/routine [POST]",
                    "explain": "/api/explain [POST]",
                    "colour_palette": "/api/palette [GET]",
                    "all_palettes": "/api/palette/all [GET]",
                    "undertones": "/api/palette/undertones [GET]",
                    "palette_compare": "/api/palette/compare [GET]",
                    "engine_stats": "/api/stats [GET]",
                    "brands": "/api/brands [GET]",
                },
            }
        ), 200


# ============================================================================
# Blueprint registration
# ============================================================================

def _register_blueprints(app: Flask) -> None:
    """
    Register all route blueprints.
    """

    try:
        from app.routes.health import health_bp

        app.register_blueprint(health_bp)
        app.logger.debug("Registered blueprint: health")

    except Exception as e:
        app.logger.exception("Failed to register health blueprint: %s", e)

    try:
        from app.routes.recommendations import recommendations_bp

        app.register_blueprint(recommendations_bp, url_prefix="/api")
        app.logger.debug("Registered blueprint: recommendations")

    except Exception as e:
        app.logger.exception("Failed to register recommendations blueprint: %s", e)

    try:
        from app.routes.palette import palette_bp

        app.register_blueprint(palette_bp, url_prefix="/api")
        app.logger.debug("Registered blueprint: palette")

    except Exception as e:
        app.logger.exception("Failed to register palette blueprint: %s", e)


# ============================================================================
# Error handlers
# ============================================================================

def _register_error_handlers(app: Flask) -> None:
    """
    Register JSON error handlers.
    """

    try:
        from app.middleware.errors import register_error_handlers

        register_error_handlers(app)
        app.logger.debug("Registered custom error handlers from app.middleware.errors")
        return

    except Exception as e:
        app.logger.warning(
            "Could not register custom error handlers. Using fallback handlers. Error: %s",
            e,
        )

    @app.errorhandler(404)
    def not_found(e):
        return jsonify(
            {
                "success": False,
                "error": "not_found",
                "message": "Endpoint does not exist.",
                "path": request.path,
            }
        ), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify(
            {
                "success": False,
                "error": "method_not_allowed",
                "message": "HTTP method not allowed on this endpoint.",
                "path": request.path,
            }
        ), 405

    @app.errorhandler(ValueError)
    def value_error(e):
        return jsonify(
            {
                "success": False,
                "error": "invalid_input",
                "message": str(e),
            }
        ), 400

    @app.errorhandler(Exception)
    def internal_error(e):
        app.logger.exception("Internal server error: %s", e)
        return jsonify(
            {
                "success": False,
                "error": "internal_server_error",
                "message": "An unexpected error occurred.",
            }
        ), 500


# ============================================================================
# Main app factory
# ============================================================================

def create_app(config_name: Optional[str] = None) -> Flask:
    """
    Create and return the Flask app.
    """
    config_cls = get_config(config_name)

    configure_logging(config_cls)

    log = logging.getLogger(__name__)
    log.info("Creating Flask app with config: %s", config_cls.__name__)

    app = Flask(__name__)
    app.config.from_object(config_cls)

    config_cls.init_app(app)

    _setup_cors(app)

    # Load engine once at startup.
    engine = _load_recommendation_engine(app)
    app.extensions["pureglow_engine"] = engine

    if engine is None:
        app.logger.error(
            "Engine failed to load at startup. Check /health and terminal logs."
        )

    _register_root(app)
    _register_blueprints(app)
    _register_error_handlers(app)

    log.info(
        "Flask app ready: %s v%s",
        app.config.get("API_TITLE", "PureGlow AI API"),
        app.config.get("API_VERSION", "1.0.0"),
    )

    return app


# ============================================================================
# Public exports
# ============================================================================

__all__ = ["create_app", "get_engine"]