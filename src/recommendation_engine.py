# -*- coding: utf-8 -*-
"""
PureGlow AI - Recommendation Engine
===================================

Recommendation engine for skincare and makeup products.

Required files inside models/:
    - skincare_products.csv
    - makeup_products.csv
    - colour_config.json

Public API:
    - PureGlowRecommendationEngine
    - load_engine()
    - score_skincare()
    - score_makeup()
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd


# ============================================================================
# Module configuration
# ============================================================================

__version__ = "1.0.0"

MODELS_DIR: Path = Path(__file__).resolve().parent.parent / "models"

logger = logging.getLogger("pureglow.recommendation_engine")

if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter(
            "[%(asctime)s] %(name)s %(levelname)s: %(message)s",
            datefmt="%H:%M:%S",
        )
    )
    logger.addHandler(handler)

logger.setLevel(logging.INFO)


# ============================================================================
# Tunable configuration
# ============================================================================

WEIGHTS: Dict[str, Dict[str, float]] = {
    "skincare": {
        "skin_type": 0.40,
        "concerns": 0.40,
        "rating": 0.20,
    },
    "makeup": {
        "undertone": 0.60,
        "product_type": 0.20,
        "rating": 0.20,
    },
}

DEFAULT_TOP_N = 10
MAX_TOP_N = 100

SKIN_TONE_BUCKETS: Dict[str, int] = {
    "fair": 1,
    "light": 2,
    "medium": 3,
    "tan": 4,
    "dark": 5,
    "deep": 6,
}


# ============================================================================
# Keyword maps
# ============================================================================

SKIN_TYPE_KEYWORDS: Dict[str, List[str]] = {
    "oily": ["oily", "oil control", "oil-free", "mattify", "matte"],
    "dry": [
        "dry",
        "hydrating",
        "hydration",
        "moisture",
        "moisturising",
        "moisturizing",
        "nourishing",
    ],
    "combination": ["combination", "balanced", "normal"],
    "sensitive": [
        "sensitive",
        "gentle",
        "soothing",
        "calming",
        "fragrance-free",
        "hypoallergenic",
    ],
}

CONCERN_KEYWORDS: Dict[str, List[str]] = {
    "acne": [
        "acne",
        "breakout",
        "blemish",
        "pore",
        "salicylic",
        "benzoyl",
        "anti-acne",
        "spot",
    ],
    "dark_spots": [
        "dark spot",
        "brightening",
        "vitamin c",
        "niacinamide",
        "hyperpigmentation",
        "uneven",
        "discoloration",
        "fade",
        "kojic",
    ],
    "redness": [
        "redness",
        "rosacea",
        "anti-inflammatory",
        "centella",
        "green tea",
        "calming",
        "soothing",
        "sensitive",
    ],
    "dullness": [
        "dull",
        "glow",
        "radiant",
        "brightening",
        "exfoliat",
        "aha",
        "bha",
        "vitamin c",
        "resurfac",
    ],
    "aging": [
        "anti-aging",
        "anti-wrinkle",
        "retinol",
        "firming",
        "lifting",
        "collagen",
        "peptide",
        "fine line",
    ],
    "dryness": [
        "dry",
        "moisture",
        "hydrat",
        "hyaluronic",
        "ceramide",
        "barrier",
    ],
}

UNDERTONE_KEYWORDS: Dict[str, List[str]] = {
    "warm": [
        "warm",
        "golden",
        "peach",
        "coral",
        "bronze",
        "copper",
        "terracotta",
        "apricot",
        "gold",
        "orange",
        "amber",
        "rust",
    ],
    "cool": [
        "cool",
        "pink",
        "berry",
        "plum",
        "silver",
        "icy",
        "rose",
        "lavender",
        "mauve",
        "fuchsia",
        "burgundy",
        "navy",
    ],
    "neutral": [
        "nude",
        "natural",
        "neutral",
        "balanced",
        "classic",
        "sheer",
        "taupe",
        "beige",
        "sand",
        "soft",
        "universal",
    ],
}


# ============================================================================
# Custom exceptions
# ============================================================================

class RecommendationError(Exception):
    """Base exception for recommendation engine errors."""


class InvalidProfileError(ValueError):
    """Raised when a user profile contains invalid values."""


class ModelNotFoundError(FileNotFoundError):
    """Raised when expected model files are missing."""


# ============================================================================
# Helper functions
# ============================================================================

def _clean_token(value: Any) -> str:
    """
    Normalise user input.

    Example:
        "Dark Spots" -> "dark_spots"
    """
    if value is None:
        return ""

    return str(value).strip().lower().replace(" ", "_").replace("-", "_")


def _safe_lower(value: Any) -> str:
    """Safely convert a value to lowercase text."""
    if value is None:
        return ""

    try:
        if pd.isna(value):
            return ""
    except Exception:
        pass

    return str(value).strip().lower()


def _truthy(value: Any) -> bool:
    """Convert CSV boolean-like values into real bool."""
    if value is None:
        return False

    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):
        if pd.isna(value):
            return False
        return float(value) != 0.0

    text = str(value).strip().lower()

    return text in {"true", "1", "yes", "y", "on"}


def _tag_as_float(series: pd.Series) -> pd.Series:
    """
    Convert tag columns to float scores.

    Handles:
        True/False
        1/0
        "True"/"False"
        "yes"/"no"
    """
    if series.empty:
        return pd.Series(dtype=float)

    if pd.api.types.is_bool_dtype(series):
        return series.fillna(False).astype(float)

    if pd.api.types.is_numeric_dtype(series):
        return pd.to_numeric(series, errors="coerce").fillna(0).clip(0, 1)

    return series.apply(_truthy).astype(float)


def _normalise_rating(rating_series: pd.Series) -> pd.Series:
    """Normalise rating column to [0, 1]."""
    ratings = pd.to_numeric(rating_series, errors="coerce").fillna(0)

    max_rating = ratings.max()

    if pd.isna(max_rating) or max_rating <= 0:
        return pd.Series(0.0, index=rating_series.index)

    return ratings / float(max_rating)


def _json_safe(value: Any) -> Any:
    """
    Convert pandas/numpy objects into JSON-safe Python values.
    """
    if value is None:
        return None

    if isinstance(value, (str, bool, int)):
        return value

    if isinstance(value, float):
        if np.isnan(value) or np.isinf(value):
            return None
        return value

    if isinstance(value, (np.integer,)):
        return int(value)

    if isinstance(value, (np.floating,)):
        value = float(value)
        if np.isnan(value) or np.isinf(value):
            return None
        return value

    if isinstance(value, (np.bool_,)):
        return bool(value)

    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}

    if isinstance(value, (list, tuple, set)):
        return [_json_safe(v) for v in value]

    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            pass

    try:
        if pd.isna(value):
            return None
    except Exception:
        pass

    return str(value)


def _df_to_records(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Convert DataFrame to JSON-safe records."""
    if df is None or df.empty:
        return []

    records = df.to_dict(orient="records")

    return _json_safe(records)


def tag_column(series: pd.Series, keyword_map: Dict[str, List[str]]) -> Dict[str, pd.Series]:
    """
    Tag a text Series using a keyword map.
    """
    text = series.fillna("").astype(str).str.lower()

    return {
        tag: text.apply(lambda t: any(keyword in t for keyword in keywords))
        for tag, keywords in keyword_map.items()
    }


# ============================================================================
# Scoring functions
# ============================================================================

def score_skincare(
    df: pd.DataFrame,
    skin_type: str,
    concerns: Optional[List[str]],
) -> pd.DataFrame:
    """
    Score skincare products using skin type, concerns, and rating.
    """
    if df is None or df.empty:
        return pd.DataFrame()

    skin_type = _clean_token(skin_type)
    concerns = [_clean_token(c) for c in concerns or [] if _clean_token(c)]

    weights = WEIGHTS["skincare"]
    scores = pd.Series(0.0, index=df.index)

    skin_col = f"skin_{skin_type}"

    if skin_col in df.columns:
        scores += _tag_as_float(df[skin_col]) * weights["skin_type"]

    if concerns:
        per_concern = weights["concerns"] / len(concerns)

        for concern in concerns:
            concern_col = f"concern_{concern}"

            if concern_col in df.columns:
                scores += _tag_as_float(df[concern_col]) * per_concern

    if "rating" in df.columns:
        scores += _normalise_rating(df["rating"]) * weights["rating"]

    result = df.copy()
    result["relevance_score"] = scores.round(4)

    return result.sort_values("relevance_score", ascending=False)


def score_makeup(
    df: pd.DataFrame,
    undertone: str,
    product_types: Optional[List[str]] = None,
) -> pd.DataFrame:
    """
    Score makeup products using undertone, product type, and rating.
    """
    if df is None or df.empty:
        return pd.DataFrame()

    undertone = _clean_token(undertone)
    product_types = [_clean_token(p) for p in product_types or [] if _clean_token(p)]

    weights = WEIGHTS["makeup"]
    scores = pd.Series(0.0, index=df.index)

    undertone_col = f"undertone_{undertone}"

    if undertone_col in df.columns:
        scores += _tag_as_float(df[undertone_col]) * weights["undertone"]

    if product_types and "product_type" in df.columns:
        wanted = set(product_types)

        type_match = df["product_type"].apply(
            lambda item: any(product_type in _clean_token(item) for product_type in wanted)
        )

        scores += type_match.astype(float) * weights["product_type"]

    if "rating" in df.columns:
        scores += _normalise_rating(df["rating"]) * weights["rating"]

    result = df.copy()
    result["relevance_score"] = scores.round(4)

    return result.sort_values("relevance_score", ascending=False)


# ============================================================================
# Main engine class
# ============================================================================

class PureGlowRecommendationEngine:
    """
    Core recommendation engine for PureGlow AI.
    """

    VALID_SKIN_TYPES: List[str] = ["oily", "dry", "combination", "sensitive"]
    VALID_CONCERNS: List[str] = [
        "acne",
        "dark_spots",
        "redness",
        "dullness",
        "aging",
        "dryness",
    ]
    VALID_UNDERTONES: List[str] = ["warm", "cool", "neutral"]

    OUTPUT_COLS_SKINCARE: List[str] = [
        "product_id",
        "name",
        "brand",
        "category",
        "price",
        "rating",
        "relevance_score",
        "url",
    ]

    OUTPUT_COLS_MAKEUP: List[str] = [
        "product_id",
        "name",
        "brand",
        "product_type",
        "price",
        "rating",
        "hex_color",
        "color_name",
        "relevance_score",
        "url",
    ]

    def __init__(
        self,
        skincare_df: pd.DataFrame,
        makeup_df: pd.DataFrame,
        colour_config: Dict[str, Dict[str, Any]],
    ) -> None:
        if not isinstance(skincare_df, pd.DataFrame):
            raise TypeError("skincare_df must be a pandas DataFrame")

        if not isinstance(makeup_df, pd.DataFrame):
            raise TypeError("makeup_df must be a pandas DataFrame")

        if not isinstance(colour_config, dict):
            raise TypeError("colour_config must be a dictionary")

        self.skincare_df = skincare_df.copy()
        self.makeup_df = makeup_df.copy()
        self.colour_config = dict(colour_config)

        logger.info(
            "Engine ready: %d skincare products, %d makeup products, %d undertones",
            len(self.skincare_df),
            len(self.makeup_df),
            len(self.colour_config),
        )

    def __repr__(self) -> str:
        return (
            "PureGlowRecommendationEngine("
            "skincare={skincare}, makeup={makeup}, undertones={undertones})"
        ).format(
            skincare=len(self.skincare_df),
            makeup=len(self.makeup_df),
            undertones=len(self.colour_config),
        )

    # ---------------------------------------------------------------------
    # Validation
    # ---------------------------------------------------------------------

    def _validate(
        self,
        skin_type: Optional[str] = None,
        concerns: Optional[List[str]] = None,
        undertone: Optional[str] = None,
    ) -> None:
        errors: List[str] = []

        skin_type = _clean_token(skin_type) if skin_type else None
        concerns = [_clean_token(c) for c in concerns or [] if _clean_token(c)]
        undertone = _clean_token(undertone) if undertone else None

        if skin_type and skin_type not in self.VALID_SKIN_TYPES:
            errors.append(
                f"Invalid skin_type '{skin_type}'. Choose from: {self.VALID_SKIN_TYPES}"
            )

        invalid_concerns = [c for c in concerns if c not in self.VALID_CONCERNS]

        if invalid_concerns:
            errors.append(
                f"Invalid concerns {invalid_concerns}. Choose from: {self.VALID_CONCERNS}"
            )

        if undertone and undertone not in self.VALID_UNDERTONES:
            errors.append(
                f"Invalid undertone '{undertone}'. Choose from: {self.VALID_UNDERTONES}"
            )

        if errors:
            raise InvalidProfileError("; ".join(errors))

    @staticmethod
    def _clamp_top_n(top_n: int) -> int:
        try:
            value = int(top_n)
        except (TypeError, ValueError):
            value = DEFAULT_TOP_N

        return max(1, min(value, MAX_TOP_N))

    # ---------------------------------------------------------------------
    # Skincare
    # ---------------------------------------------------------------------

    def get_skincare(
        self,
        skin_type: str,
        concerns: Optional[List[str]] = None,
        top_n: int = DEFAULT_TOP_N,
        min_score: float = 0.0,
        max_price: Optional[float] = None,
        brands: Optional[List[str]] = None,
        exclude_brands: Optional[List[str]] = None,
    ) -> pd.DataFrame:
        skin_type = _clean_token(skin_type)
        concerns = [_clean_token(c) for c in concerns or [] if _clean_token(c)]

        self._validate(skin_type=skin_type, concerns=concerns)

        if self.skincare_df.empty:
            return pd.DataFrame(columns=self.OUTPUT_COLS_SKINCARE)

        top_n = self._clamp_top_n(top_n)

        scored = score_skincare(self.skincare_df, skin_type, concerns)
        scored = scored[scored["relevance_score"] > float(min_score)]

        if max_price is not None and "price" in scored.columns:
            price = pd.to_numeric(scored["price"], errors="coerce")
            scored = scored[price.fillna(np.inf) <= float(max_price)]

        if brands and "brand" in scored.columns:
            wanted = {_safe_lower(brand) for brand in brands}
            scored = scored[scored["brand"].apply(_safe_lower).isin(wanted)]

        if exclude_brands and "brand" in scored.columns:
            blocked = {_safe_lower(brand) for brand in exclude_brands}
            scored = scored[~scored["brand"].apply(_safe_lower).isin(blocked)]

        result = scored.head(top_n)

        keep = [col for col in self.OUTPUT_COLS_SKINCARE if col in result.columns]

        return result[keep].reset_index(drop=True)

    # ---------------------------------------------------------------------
    # Makeup
    # ---------------------------------------------------------------------

    def get_makeup(
        self,
        undertone: str,
        product_types: Optional[List[str]] = None,
        top_n: int = DEFAULT_TOP_N,
        min_score: float = 0.0,
        max_price: Optional[float] = None,
        brands: Optional[List[str]] = None,
    ) -> pd.DataFrame:
        undertone = _clean_token(undertone)
        product_types = [_clean_token(p) for p in product_types or [] if _clean_token(p)]

        self._validate(undertone=undertone)

        if self.makeup_df.empty:
            return pd.DataFrame(columns=self.OUTPUT_COLS_MAKEUP)

        top_n = self._clamp_top_n(top_n)

        scored = score_makeup(self.makeup_df, undertone, product_types)
        scored = scored[scored["relevance_score"] > float(min_score)]

        if max_price is not None and "price" in scored.columns:
            price = pd.to_numeric(scored["price"], errors="coerce")
            scored = scored[price.fillna(np.inf) <= float(max_price)]

        if brands and "brand" in scored.columns:
            wanted = {_safe_lower(brand) for brand in brands}
            scored = scored[scored["brand"].apply(_safe_lower).isin(wanted)]

        result = scored.head(top_n)

        keep = [col for col in self.OUTPUT_COLS_MAKEUP if col in result.columns]

        return result[keep].reset_index(drop=True)

    # ---------------------------------------------------------------------
    # Colour palette
    # ---------------------------------------------------------------------

    def get_colour_palette(self, undertone: str) -> Dict[str, List[str]]:
        undertone = _clean_token(undertone)
        self._validate(undertone=undertone)

        palette = self.colour_config.get(undertone, {})

        if not isinstance(palette, dict):
            return {}

        cleaned: Dict[str, List[str]] = {}

        for key, value in palette.items():
            if key == "description":
                continue

            if isinstance(value, list):
                cleaned[key] = [str(item) for item in value]
            elif isinstance(value, tuple):
                cleaned[key] = [str(item) for item in value]
            elif isinstance(value, str):
                cleaned[key] = [value]
            else:
                cleaned[key] = [str(value)]

        return cleaned

    def get_color_palette(self, undertone: str) -> Dict[str, List[str]]:
        """
        American spelling alias.
        """
        return self.get_colour_palette(undertone)

    # ---------------------------------------------------------------------
    # Brands
    # ---------------------------------------------------------------------

    def get_top_brands(
        self,
        skin_type: str,
        concerns: Optional[List[str]] = None,
        top_n: int = 10,
    ) -> pd.DataFrame:
        skin_type = _clean_token(skin_type)
        concerns = [_clean_token(c) for c in concerns or [] if _clean_token(c)]

        self._validate(skin_type=skin_type, concerns=concerns)

        if self.skincare_df.empty or "brand" not in self.skincare_df.columns:
            return pd.DataFrame(columns=["brand", "mean_score", "n_products"])

        scored = score_skincare(self.skincare_df, skin_type, concerns)

        grouped = (
            scored.groupby("brand")
            .agg(
                mean_score=("relevance_score", "mean"),
                n_products=("relevance_score", "size"),
            )
            .reset_index()
            .sort_values("mean_score", ascending=False)
        )

        grouped = grouped[grouped["n_products"] >= 3].head(self._clamp_top_n(top_n))
        grouped["mean_score"] = grouped["mean_score"].round(4)

        return grouped.reset_index(drop=True)

    # ---------------------------------------------------------------------
    # Routine
    # ---------------------------------------------------------------------

    def get_routine(
        self,
        skin_type: str,
        concerns: Optional[List[str]] = None,
        max_budget: Optional[float] = None,
    ) -> Dict[str, Any]:
        skin_type = _clean_token(skin_type)
        concerns = [_clean_token(c) for c in concerns or [] if _clean_token(c)]

        self._validate(skin_type=skin_type, concerns=concerns)

        routine_slots: Dict[str, List[str]] = {
            "cleanser": ["cleanser", "wash", "foam"],
            "treatment": ["treatment", "serum", "essence", "ampoule"],
            "moisturiser": ["moisturizer", "moisturiser", "cream", "lotion"],
            "eye_care": ["eye"],
        }

        routine: Dict[str, Any] = {
            "cleanser": None,
            "treatment": None,
            "moisturiser": None,
            "eye_care": None,
        }

        if self.skincare_df.empty:
            routine["_total_cost"] = 0.0
            return routine

        scored = score_skincare(self.skincare_df, skin_type, concerns)

        running_total = 0.0

        for slot, keywords in routine_slots.items():
            candidates = scored[
                scored.apply(
                    lambda row: any(
                        keyword in _safe_lower(row.get("category", ""))
                        or keyword in _safe_lower(row.get("name", ""))
                        for keyword in keywords
                    ),
                    axis=1,
                )
            ]

            if candidates.empty:
                continue

            chosen_row = None

            for _, row in candidates.iterrows():
                price = pd.to_numeric(row.get("price"), errors="coerce")
                price = 0.0 if pd.isna(price) else float(price)

                if max_budget is None or running_total + price <= float(max_budget):
                    chosen_row = row
                    running_total += price
                    break

            if chosen_row is not None:
                keep = [
                    col for col in self.OUTPUT_COLS_SKINCARE
                    if col in chosen_row.index
                ]
                routine[slot] = _json_safe(chosen_row[keep].to_dict())

        routine["_total_cost"] = round(running_total, 2)

        return routine

    # ---------------------------------------------------------------------
    # Explanation
    # ---------------------------------------------------------------------

    def explain(
        self,
        product_id: str,
        skin_type: str,
        concerns: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        skin_type = _clean_token(skin_type)
        concerns = [_clean_token(c) for c in concerns or [] if _clean_token(c)]

        self._validate(skin_type=skin_type, concerns=concerns)

        if self.skincare_df.empty:
            return {"error": "engine has no skincare data"}

        if "product_id" not in self.skincare_df.columns:
            return {"error": "product_id column is missing from skincare data"}

        product_id = str(product_id).strip()

        match = self.skincare_df[
            self.skincare_df["product_id"].astype(str) == product_id
        ]

        if match.empty:
            return {"error": f"product_id '{product_id}' not found"}

        row = match.iloc[0]
        weights = WEIGHTS["skincare"]

        skin_col = f"skin_{skin_type}"
        skin_match = _truthy(row.get(skin_col, False))
        skin_contribution = weights["skin_type"] if skin_match else 0.0

        concern_breakdown = []
        concern_contribution = 0.0

        if concerns:
            per_concern = weights["concerns"] / len(concerns)

            for concern in concerns:
                concern_col = f"concern_{concern}"
                matched = _truthy(row.get(concern_col, False))
                contribution = per_concern if matched else 0.0
                concern_contribution += contribution

                concern_breakdown.append(
                    {
                        "concern": concern,
                        "matched": matched,
                        "contribution": round(contribution, 4),
                    }
                )

        rating = pd.to_numeric(row.get("rating"), errors="coerce")

        rating_contribution = 0.0

        if "rating" in self.skincare_df.columns:
            max_rating = pd.to_numeric(
                self.skincare_df["rating"],
                errors="coerce",
            ).max()

            if not pd.isna(rating) and not pd.isna(max_rating) and max_rating > 0:
                rating_contribution = (
                    float(rating) / float(max_rating)
                ) * weights["rating"]

        total_score = round(
            skin_contribution + concern_contribution + rating_contribution,
            4,
        )

        tags_matched = [
            col for col in row.index
            if col.startswith(("skin_", "concern_", "undertone_"))
            and _truthy(row[col])
        ]

        return _json_safe(
            {
                "product_id": product_id,
                "name": row.get("name", ""),
                "brand": row.get("brand", ""),
                "total_score": total_score,
                "components": {
                    "skin_type": {
                        "matched": skin_match,
                        "contribution": round(skin_contribution, 4),
                    },
                    "concerns": concern_breakdown,
                    "rating": {
                        "value": None if pd.isna(rating) else float(rating),
                        "contribution": round(rating_contribution, 4),
                    },
                },
                "tags_matched": tags_matched,
            }
        )

    # ---------------------------------------------------------------------
    # Full recommendation bundle
    # ---------------------------------------------------------------------

    def recommend(
        self,
        skin_type: str,
        concerns: Optional[List[str]] = None,
        undertone: Optional[str] = None,
        skin_tone: Optional[str] = None,
        top_n: int = 5,
        max_price: Optional[float] = None,
        product_types: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        from datetime import datetime

        skin_type = _clean_token(skin_type)
        concerns = [_clean_token(c) for c in concerns or [] if _clean_token(c)]
        undertone = _clean_token(undertone) if undertone else None

        self._validate(
            skin_type=skin_type,
            concerns=concerns,
            undertone=undertone,
        )

        top_n = self._clamp_top_n(top_n)

        skincare_df = self.get_skincare(
            skin_type=skin_type,
            concerns=concerns,
            top_n=top_n,
            max_price=max_price,
        )

        makeup_records: List[Dict[str, Any]] = []
        colour_palette: Dict[str, List[str]] = {}

        if undertone:
            makeup_df = self.get_makeup(
                undertone=undertone,
                product_types=product_types,
                top_n=top_n,
                max_price=max_price,
            )

            makeup_records = _df_to_records(makeup_df)
            colour_palette = self.get_colour_palette(undertone)

        return _json_safe(
            {
                "user_profile": {
                    "skin_type": skin_type,
                    "concerns": concerns,
                    "undertone": undertone,
                    "skin_tone": skin_tone,
                },
                "skincare_recommendations": _df_to_records(skincare_df),
                "makeup_recommendations": makeup_records,
                "colour_palette": colour_palette,
                "metadata": {
                    "engine_version": __version__,
                    "generated_at": datetime.utcnow().isoformat() + "Z",
                    "top_n": top_n,
                },
            }
        )

    # ---------------------------------------------------------------------
    # Stats
    # ---------------------------------------------------------------------

    def get_stats(self) -> Dict[str, Any]:
        skincare = self.skincare_df
        makeup = self.makeup_df

        def safe_unique(df: pd.DataFrame, column: str) -> int:
            if column not in df.columns:
                return 0
            return int(df[column].nunique())

        return _json_safe(
            {
                "engine_version": __version__,
                "skincare": {
                    "n_products": int(len(skincare)),
                    "n_brands": safe_unique(skincare, "brand"),
                    "n_categories": safe_unique(skincare, "category"),
                    "price_range": self._price_range(skincare),
                    "mean_rating": self._mean_rating(skincare),
                },
                "makeup": {
                    "n_products": int(len(makeup)),
                    "n_brands": safe_unique(makeup, "brand"),
                    "n_product_types": safe_unique(makeup, "product_type"),
                    "price_range": self._price_range(makeup),
                    "mean_rating": self._mean_rating(makeup),
                },
                "undertones_supported": list(self.colour_config.keys()),
            }
        )

    @staticmethod
    def _price_range(df: pd.DataFrame) -> Dict[str, Optional[float]]:
        if df.empty or "price" not in df.columns:
            return {"min": None, "max": None, "median": None}

        prices = pd.to_numeric(df["price"], errors="coerce").dropna()

        if prices.empty:
            return {"min": None, "max": None, "median": None}

        return {
            "min": round(float(prices.min()), 2),
            "max": round(float(prices.max()), 2),
            "median": round(float(prices.median()), 2),
        }

    @staticmethod
    def _mean_rating(df: pd.DataFrame) -> Optional[float]:
        if df.empty or "rating" not in df.columns:
            return None

        ratings = pd.to_numeric(df["rating"], errors="coerce").dropna()

        if ratings.empty:
            return None

        return round(float(ratings.mean()), 2)

    def coverage_report(self) -> pd.DataFrame:
        rows = []

        for col in self.skincare_df.columns:
            if col.startswith(("skin_", "concern_")):
                values = _tag_as_float(self.skincare_df[col])
                count = int(values.sum())
                percentage = round(count / max(len(self.skincare_df), 1) * 100, 2)

                rows.append(
                    {
                        "tag": col,
                        "n_products": count,
                        "coverage_pct": percentage,
                    }
                )

        if not rows:
            return pd.DataFrame(columns=["tag", "n_products", "coverage_pct"])

        return pd.DataFrame(rows).sort_values(
            "coverage_pct",
            ascending=False,
        )

    def health_check(self) -> Dict[str, Any]:
        issues = []

        if self.skincare_df.empty:
            issues.append("skincare catalogue is empty")

        if self.makeup_df.empty:
            issues.append("makeup catalogue is empty")

        if not self.colour_config:
            issues.append("colour_config is empty")

        for undertone in self.VALID_UNDERTONES:
            if undertone not in self.colour_config:
                issues.append(f"missing palette for undertone '{undertone}'")

        if not issues:
            status = "healthy"
        elif self.skincare_df.empty and self.makeup_df.empty:
            status = "unhealthy"
        else:
            status = "degraded"

        return {
            "status": status,
            "engine_version": __version__,
            "issues": issues,
            "stats": self.get_stats(),
        }


# ============================================================================
# Loader
# ============================================================================

def load_engine(
    models_dir: Optional[Union[str, Path]] = None,
) -> PureGlowRecommendationEngine:
    """
    Load model files and return the ready engine.
    """
    base = Path(models_dir).expanduser().resolve() if models_dir else MODELS_DIR

    skincare_path = base / "skincare_products.csv"
    makeup_path = base / "makeup_products.csv"
    colour_path = base / "colour_config.json"

    if skincare_path.exists():
        skincare_df = pd.read_csv(skincare_path)
        logger.info(
            "Loaded skincare: %d products from %s",
            len(skincare_df),
            skincare_path,
        )
    else:
        logger.warning("skincare_products.csv not found. Using empty DataFrame.")
        skincare_df = pd.DataFrame()

    if makeup_path.exists():
        makeup_df = pd.read_csv(makeup_path)
        logger.info(
            "Loaded makeup: %d products from %s",
            len(makeup_df),
            makeup_path,
        )
    else:
        logger.warning("makeup_products.csv not found. Using empty DataFrame.")
        makeup_df = pd.DataFrame()

    if not colour_path.exists():
        raise ModelNotFoundError(
            f"colour_config.json not found at {colour_path}. "
            "Run 03_recommendation_model.ipynb first."
        )

    with open(colour_path, "r", encoding="utf-8") as file:
        colour_config = json.load(file)

    return PureGlowRecommendationEngine(
        skincare_df=skincare_df,
        makeup_df=makeup_df,
        colour_config=colour_config,
    )


# ============================================================================
# CLI test
# ============================================================================

def _cli_demo() -> None:
    print(f"PureGlow AI Recommendation Engine v{__version__}")
    print("=" * 60)

    try:
        engine = load_engine()
    except Exception as exc:
        print(f"ERROR: {exc}")
        return

    print(engine)
    print()

    health = engine.health_check()
    print(f"Health: {health['status']}")

    if health["issues"]:
        print("Issues:")
        for issue in health["issues"]:
            print(f"  - {issue}")

    print()
    print("Stats:")
    print(json.dumps(engine.get_stats(), indent=2))

    print()
    print("Sample recommendation: oily + acne + warm")
    print("-" * 60)

    result = engine.recommend(
        skin_type="oily",
        concerns=["acne"],
        undertone="warm",
        top_n=3,
    )

    for index, product in enumerate(result["skincare_recommendations"], start=1):
        print(
            "{index}. {name} -- {brand} | score={score}".format(
                index=index,
                name=str(product.get("name", "?"))[:50],
                brand=str(product.get("brand", "?"))[:25],
                score=product.get("relevance_score", 0),
            )
        )


if __name__ == "__main__":
    _cli_demo()
    