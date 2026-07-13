"""
Phase 3 — Data Quality Assessment.

Computes six weighted quality dimensions directly from the uploaded
dataset. No sample/reference data is used anywhere in this module; every
score is derived from the dataframe itself.
"""
from __future__ import annotations

import re

import pandas as pd

from app.models.dataset import Dataset
from app.schemas.quality import QualityDimensionOut, QualityScoreOut
from app.services.datasets.dataframe_loader import (
    load_dataframe,
    numeric_columns,
    categorical_columns,
    duplicate_row_count,
)

_EMPTY_LIKE = {"", "na", "n/a", "null", "none", "nan", "-", "?"}


def _completeness(df: pd.DataFrame) -> float:
    total = df.shape[0] * df.shape[1]
    if total == 0:
        return 100.0
    missing = int(df.isna().sum().sum())
    return round(100 * (1 - missing / total), 1)


def _uniqueness(df: pd.DataFrame) -> float:
    if len(df) == 0:
        return 100.0
    dup = duplicate_row_count(df)
    return round(100 * (1 - dup / len(df)), 1)


def _validity(df: pd.DataFrame) -> float:
    """Fraction of non-null values that look well-formed for their column."""
    scores = []
    for col in df.columns:
        series = df[col].dropna()
        if series.empty:
            continue
        if pd.api.types.is_numeric_dtype(series) or pd.api.types.is_bool_dtype(series):
            scores.append(1.0)  # already parsed as numeric/bool -> structurally valid
            continue

        as_str = series.astype(str).str.strip()
        blank_like = as_str.str.lower().isin(_EMPTY_LIKE)

        # Columns that look like dates get validated by parseability instead.
        if re.search(r"date|time|_at$|_dt$", str(col), re.IGNORECASE):
            parsed = pd.to_datetime(series, errors="coerce", format="mixed")
            valid_ratio = parsed.notna().mean()
        else:
            valid_ratio = 1 - blank_like.mean()

        scores.append(max(0.0, min(1.0, valid_ratio)))

    if not scores:
        return 100.0
    return round(100 * (sum(scores) / len(scores)), 1)


def _consistency(df: pd.DataFrame) -> float:
    """Penalizes categorical columns whose values differ only by case/whitespace."""
    cat_cols = [
        c for c in categorical_columns(df)
        if 1 < df[c].nunique(dropna=True) <= max(50, int(len(df) * 0.5))
    ]
    if not cat_cols:
        return 100.0

    ratios = []
    for col in cat_cols:
        series = df[col].dropna().astype(str)
        if series.empty:
            continue
        raw_unique = series.nunique()
        normalized_unique = series.str.strip().str.lower().nunique()
        if raw_unique == 0:
            continue
        ratios.append(normalized_unique / raw_unique)

    if not ratios:
        return 100.0
    return round(100 * (sum(ratios) / len(ratios)), 1)


def _accuracy(df: pd.DataFrame) -> float:
    """Proxy: share of numeric values that fall within the IQR-based expected range."""
    num_cols = numeric_columns(df)
    if not num_cols:
        return 100.0

    ratios = []
    for col in num_cols:
        series = df[col].dropna()
        if len(series) < 5:
            continue
        q1, q3 = series.quantile(0.25), series.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            ratios.append(1.0)
            continue
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        within = ((series >= lower) & (series <= upper)).mean()
        ratios.append(within)

    if not ratios:
        return 100.0
    return round(100 * (sum(ratios) / len(ratios)), 1)


def _freshness(df: pd.DataFrame) -> tuple[float, str]:
    """Looks for a datetime-like column and scores recency of its most recent value."""
    date_cols = [c for c in df.columns if re.search(r"date|time|_at$|_dt$", str(c), re.IGNORECASE)]
    best_max = None
    best_col = None
    for col in date_cols:
        parsed = pd.to_datetime(df[col], errors="coerce", format="mixed")
        if parsed.notna().sum() == 0:
            continue
        col_max = parsed.max()
        if best_max is None or col_max > best_max:
            best_max = col_max
            best_col = col

    if best_max is None:
        return 100.0, "No date/time column detected — freshness assumed neutral."

    if best_max.tzinfo is not None:
        now = pd.Timestamp.now(tz=best_max.tzinfo)
    else:
        now = pd.Timestamp.now()
    age_days = max(0, (now - best_max).days)

    # 100 at 0 days old, decaying to 40 by 2 years, floor at 20.
    score = max(20.0, 100 - (age_days / 730) * 60)
    return round(score, 1), f"Most recent value in '{best_col}' is {age_days} day(s) old."


def build_quality_score(dataset: Dataset) -> QualityScoreOut:
    df = load_dataframe(dataset)

    completeness = _completeness(df)
    uniqueness = _uniqueness(df)
    validity = _validity(df)
    consistency = _consistency(df)
    accuracy = _accuracy(df)
    freshness, freshness_note = _freshness(df)

    dimensions = [
        QualityDimensionOut(name="Completeness", score=completeness, description="Share of non-missing values across all columns."),
        QualityDimensionOut(name="Validity", score=validity, description="Values conforming to their column's expected format and type."),
        QualityDimensionOut(name="Consistency", score=consistency, description="Agreement of categorical values after normalizing case and whitespace."),
        QualityDimensionOut(name="Accuracy", score=accuracy, description="Share of numeric values within the expected (IQR-based) range."),
        QualityDimensionOut(name="Freshness", score=freshness, description=freshness_note),
        QualityDimensionOut(name="Uniqueness", score=uniqueness, description="Absence of exact duplicate rows."),
    ]

    overall = round(sum(d.score for d in dimensions) / len(dimensions), 1)

    return QualityScoreOut(dataset_id=dataset.id, overall=overall, dimensions=dimensions)