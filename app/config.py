# -*- coding: utf-8 -*-
"""
PureGlow AI - Flask Configuration
=================================

Clean class-based configuration for development, testing, and production.

Environment selection:
    APP_ENV=development
    APP_ENV=testing
    APP_ENV=production

Legacy fallback is also supported:
    FLASK_CONFIG=production
    FLASK_ENV=production

Example .env values:
    SECRET_KEY=change-this-secret
    APP_ENV=development
    PORT=5000
    MODELS_DIR=./models
    SRC_DIR=./src
    CORS_ORIGINS=http://localhost:5173,http://localhost:3000
    LOG_LEVEL=INFO
"""

from __future__ import annotations

import logging
import os
from logging.config import dictConfig
from pathlib import Path
from typing import Any, ClassVar, Iterable


# ============================================================================
# Project paths
# ============================================================================

BASE_DIR: Path = Path(__file__).resolve().parent.parent

DEFAULT_MODELS_DIR: Path = BASE_DIR / "models"
DEFAULT_SRC_DIR: Path = BASE_DIR / "src"
DEFAULT_LOG_DIR: Path = BASE_DIR / "logs"


# ============================================================================
# Optional .env loading
# ============================================================================

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args: Any, **kwargs: Any) -> bool:
        return False

load_dotenv(BASE_DIR / ".env")


# ============================================================================
# Environment helpers
# ============================================================================

_TRUE_VALUES = {"1", "true", "yes", "y", "on"}
_FALSE_VALUES = {"0", "false", "no", "n", "off"}
_VALID_LOG_LEVELS = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}


def _env_str(name: str, default: str) -> str:
    """Read a string environment variable."""
    value = os.getenv(name)
    return default if value is None or value.strip() == "" else value.strip()


def _env_bool(name: str, default: bool = False) -> bool:
    """Read a boolean environment variable safely."""
    raw = os.getenv(name)

    if raw is None or raw.strip() == "":
        return default

    value = raw.strip().lower()

    if value in _TRUE_VALUES:
        return True

    if value in _FALSE_VALUES:
        return False

    raise ValueError(
        f"Invalid boolean value for {name}: {raw!r}. "
        f"Use one of: {sorted(_TRUE_VALUES | _FALSE_VALUES)}"
    )


def _env_int(
    name: str,
    default: int,
    *,
    minimum: int | None = None,
    maximum: int | None = None,
) -> int:
    """Read an integer environment variable with optional range checks."""
    raw = os.getenv(name)

    if raw is None or raw.strip() == "":
        value = default
    else:
        try:
            value = int(raw.strip())
        except ValueError as exc:
            raise ValueError(f"Invalid integer value for {name}: {raw!r}") from exc

    if minimum is not None and value < minimum:
        raise ValueError(f"{name} must be >= {minimum}. Current value: {value}")

    if maximum is not None and value > maximum:
        raise ValueError(f"{name} must be <= {maximum}. Current value: {value}")

    return value


def _env_path(name: str, default: Path) -> Path:
    """Read a filesystem path environment variable."""
    raw = os.getenv(name)
    value = Path(raw.strip()) if raw and raw.strip() else default
    return value.expanduser().resolve()


def _env_list(name: str, default: Iterable[str]) -> list[str]:
    """Read a comma-separated environment variable into a clean unique list."""
    raw = os.getenv(name)

    if raw is None or raw.strip() == "":
        return list(default)

    values: list[str] = []
    seen: set[str] = set()

    for item in raw.split(","):
        cleaned = item.strip().rstrip("/")

        if cleaned and cleaned not in seen:
            values.append(cleaned)
            seen.add(cleaned)

    return values


def _clean_log_level(value: str) -> str:
    """Normalise and validate a logging level."""
    level = value.strip().upper()
    return level if level in _VALID_LOG_LEVELS else "INFO"


# ============================================================================
# Base config
# ============================================================================

class Config:
    """Base configuration inherited by all environments."""

    # Flask core
    SECRET_KEY: ClassVar[str] = _env_str(
        "SECRET_KEY",
        "dev-key-change-me-in-production",
    )
    JSON_SORT_KEYS: ClassVar[bool] = False

    # Server
    HOST: ClassVar[str] = _env_str("HOST", "0.0.0.0")
    PORT: ClassVar[int] = _env_int("PORT", 5000, minimum=1, maximum=65535)

    # Project folders
    BASE_DIR: ClassVar[Path] = BASE_DIR
    MODELS_DIR: ClassVar[Path] = _env_path("MODELS_DIR", DEFAULT_MODELS_DIR)
    SRC_DIR: ClassVar[Path] = _env_path("SRC_DIR", DEFAULT_SRC_DIR)

    # Recommendation engine
    ENGINE_PRELOAD: ClassVar[bool] = _env_bool("ENGINE_PRELOAD", True)
    DEFAULT_TOP_N: ClassVar[int] = _env_int(
        "DEFAULT_TOP_N",
        5,
        minimum=1,
        maximum=100,
    )
    MAX_TOP_N: ClassVar[int] = _env_int(
        "MAX_TOP_N",
        100,
        minimum=1,
        maximum=500,
    )

    # CORS
    CORS_ORIGINS: ClassVar[list[str]] = _env_list(
        "CORS_ORIGINS",
        ["http://localhost:5173", "http://localhost:3000"],
    )

    # Logging
    LOG_LEVEL: ClassVar[str] = _clean_log_level(_env_str("LOG_LEVEL", "INFO"))
    LOG_DIR: ClassVar[Path] = _env_path("LOG_DIR", DEFAULT_LOG_DIR)
    LOG_TO_FILE: ClassVar[bool] = _env_bool("LOG_TO_FILE", False)
    LOG_FILE_NAME: ClassVar[str] = _env_str("LOG_FILE_NAME", "pureglow.log")
    LOG_MAX_BYTES: ClassVar[int] = _env_int(
        "LOG_MAX_BYTES",
        1_000_000,
        minimum=10_000,
    )
    LOG_BACKUP_COUNT: ClassVar[int] = _env_int(
        "LOG_BACKUP_COUNT",
        3,
        minimum=1,
        maximum=20,
    )

    # API metadata
    API_TITLE: ClassVar[str] = "PureGlow AI API"
    API_VERSION: ClassVar[str] = "1.0.0"
    API_DESCRIPTION: ClassVar[str] = (
        "Skincare and makeup recommendation engine."
    )

    # Future extension
    RATE_LIMIT_ENABLED: ClassVar[bool] = _env_bool("RATE_LIMIT_ENABLED", False)
    RATE_LIMIT: ClassVar[str] = _env_str("RATE_LIMIT", "60 per minute")

    @classmethod
    def validate(cls) -> None:
        """Validate config values that depend on each other."""
        if cls.DEFAULT_TOP_N > cls.MAX_TOP_N:
            raise ValueError(
                f"DEFAULT_TOP_N ({cls.DEFAULT_TOP_N}) cannot be greater than "
                f"MAX_TOP_N ({cls.MAX_TOP_N})."
            )

    @classmethod
    def init_app(cls, app: Any) -> None:
        """
        Called by the Flask app factory after app.config.from_object(...).
        """
        cls.validate()

        # Keep JSON key order stable for nicer API responses.
        if hasattr(app, "json"):
            app.json.sort_keys = False

        if cls.LOG_TO_FILE:
            cls.LOG_DIR.mkdir(parents=True, exist_ok=True)

        if not cls.MODELS_DIR.exists():
            app.logger.warning("Models directory does not exist: %s", cls.MODELS_DIR)

        if not cls.SRC_DIR.exists():
            app.logger.warning("Source directory does not exist: %s", cls.SRC_DIR)


# ============================================================================
# Development config
# ============================================================================

class DevelopmentConfig(Config):
    """Local development configuration."""

    DEBUG: ClassVar[bool] = True
    TESTING: ClassVar[bool] = False

    LOG_LEVEL: ClassVar[str] = _clean_log_level(_env_str("LOG_LEVEL", "DEBUG"))
    ENGINE_PRELOAD: ClassVar[bool] = _env_bool("ENGINE_PRELOAD", False)

    CORS_ORIGINS: ClassVar[list[str]] = _env_list(
        "CORS_ORIGINS",
        [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ],
    )


# ============================================================================
# Testing config
# ============================================================================

class TestingConfig(Config):
    """Testing configuration used by pytest."""

    DEBUG: ClassVar[bool] = False
    TESTING: ClassVar[bool] = True

    LOG_LEVEL: ClassVar[str] = _clean_log_level(_env_str("LOG_LEVEL", "WARNING"))
    ENGINE_PRELOAD: ClassVar[bool] = False
    LOG_TO_FILE: ClassVar[bool] = False

    MODELS_DIR: ClassVar[Path] = _env_path(
        "TEST_MODELS_DIR",
        BASE_DIR / "tests" / "fixtures" / "models",
    )


# ============================================================================
# Production config
# ============================================================================

class ProductionConfig(Config):
    """Production configuration with safer defaults."""

    DEBUG: ClassVar[bool] = False
    TESTING: ClassVar[bool] = False

    LOG_LEVEL: ClassVar[str] = _clean_log_level(_env_str("LOG_LEVEL", "INFO"))
    LOG_TO_FILE: ClassVar[bool] = _env_bool("LOG_TO_FILE", True)
    ENGINE_PRELOAD: ClassVar[bool] = _env_bool("ENGINE_PRELOAD", True)

    # In production, require explicit frontend domains.
    CORS_ORIGINS: ClassVar[list[str]] = _env_list("CORS_ORIGINS", [])

    @classmethod
    def init_app(cls, app: Any) -> None:
        super().init_app(app)

        if cls.SECRET_KEY in {"", "dev-key-change-me-in-production"}:
            raise RuntimeError("SECRET_KEY must be set in production.")

        if "*" in cls.CORS_ORIGINS:
            raise RuntimeError("Do not use '*' in CORS_ORIGINS in production.")

        if not cls.CORS_ORIGINS:
            app.logger.warning(
                "No CORS_ORIGINS configured. Browser requests from a frontend "
                "will be blocked until allowed origins are added."
            )


# ============================================================================
# Config registry
# ============================================================================

CONFIG_BY_NAME: dict[str, type[Config]] = {
    "development": DevelopmentConfig,
    "dev": DevelopmentConfig,
    "local": DevelopmentConfig,
    "testing": TestingConfig,
    "test": TestingConfig,
    "production": ProductionConfig,
    "prod": ProductionConfig,
}


def get_config(name: str | None = None) -> type[Config]:
    """
    Return the correct config class.

    Priority:
        1. explicit name argument
        2. APP_ENV
        3. FLASK_CONFIG
        4. FLASK_ENV
        5. development
    """
    env_name = (
        name
        or os.getenv("APP_ENV")
        or os.getenv("FLASK_CONFIG")
        or os.getenv("FLASK_ENV")
        or "development"
    )

    env_name = env_name.strip().lower()
    return CONFIG_BY_NAME.get(env_name, DevelopmentConfig)


# ============================================================================
# Logging setup
# ============================================================================

def configure_logging(config_cls: type[Config]) -> None:
    """
    Configure Python logging.

    Call this before creating/accessing app.logger when possible.
    """
    log_level = _clean_log_level(config_cls.LOG_LEVEL)

    handlers: dict[str, dict[str, Any]] = {
        "console": {
            "class": "logging.StreamHandler",
            "level": log_level,
            "formatter": "standard",
        }
    }

    root_handlers = ["console"]

    if config_cls.LOG_TO_FILE:
        config_cls.LOG_DIR.mkdir(parents=True, exist_ok=True)
        log_path = config_cls.LOG_DIR / config_cls.LOG_FILE_NAME

        handlers["file"] = {
            "class": "logging.handlers.RotatingFileHandler",
            "level": log_level,
            "formatter": "standard",
            "filename": str(log_path),
            "maxBytes": config_cls.LOG_MAX_BYTES,
            "backupCount": config_cls.LOG_BACKUP_COUNT,
            "encoding": "utf-8",
        }

        root_handlers.append("file")

    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "standard": {
                    "format": "[%(asctime)s] %(levelname)s in %(name)s: %(message)s",
                    "datefmt": "%Y-%m-%d %H:%M:%S",
                }
            },
            "handlers": handlers,
            "root": {
                "level": log_level,
                "handlers": root_handlers,
            },
            "loggers": {
                "werkzeug": {
                    "level": "WARNING",
                    "propagate": True,
                }
            },
        }
    )

    logging.getLogger(__name__).debug("Logging configured with level %s", log_level)