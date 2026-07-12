"""
Phase 3 — AI Insights.

Generates statistical insights purely from the uploaded dataframe: missing
value leaders, correlated numeric features, skewed columns, constant
columns, high-cardinality columns, IQR-based outlier columns, and a few
suspicious-pattern heuristics. No precomputed/sample insights are used.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from app.models.dataset import Dataset
from app.schemas.insights import (
    ColumnInsightOut, CorrelatedPairOut, InsightsSummaryOut,
)
from app.services.datasets.dataframe_loader import (
    load_dataframe,
    numeric_columns,
    categorical_columns,
    duplicate_row_count,
)

NEGATIVE_SUSPECT_PATTERN = r"amount|price|cost|qty|quantity|age|balance|salary|revenue|score|count"


def _top_missing_columns(df: pd.DataFrame, limit: int = 5) -> list[ColumnInsightOut]:
    missing = df.isna().sum()
    missing = missing[missing > 0].sort_values(ascending=False).head(limit)
    total = len(df)
    return [
        ColumnInsightOut(column=str(c), detail=f"{int(v)} missing ({v / total:.1%})")
        for c, v in missing.items()
    ]


def _correlated_features(df: pd.DataFrame, threshold: float = 0.7, limit: int = 8) -> list[CorrelatedPairOut]:
    num_cols = numeric_columns(df)
    if len(num_cols) < 2:
        return []
    corr = df[num_cols].corr(numeric_only=True).abs()
    pairs = []
    for i, a in enumerate(num_cols):
        for b in num_cols[i + 1:]:
            val = corr.loc[a, b]
            if pd.notna(val) and val >= threshold:
                pairs.append(CorrelatedPairOut(columnA=a, columnB=b, correlation=round(float(val), 2)))
    pairs.sort(key=lambda p: -p.correlation)
    return pairs[:limit]


def _skewed_columns(df: pd.DataFrame, limit: int = 6) -> list[ColumnInsightOut]:
    num_cols = numeric_columns(df)
    results = []
    for c in num_cols:
        series = df[c].dropna()
        if len(series) < 5 or series.std() == 0:
            continue
        skew = series.skew()
        if abs(skew) > 1:
            direction = "right" if skew > 0 else "left"
            results.append(ColumnInsightOut(column=str(c), detail=f"Skew {skew:.2f} ({direction}-skewed)"))
    results.sort(key=lambda r: -abs(float(r.detail.split()[1])))
    return results[:limit]


def _constant_columns(df: pd.DataFrame) -> list[ColumnInsightOut]:
    results = []
    for c in df.columns:
        non_null = df[c].dropna()
        if len(non_null) > 0 and non_null.nunique() == 1:
            results.append(ColumnInsightOut(column=str(c), detail=f"Only one distinct value: '{non_null.iloc[0]}'"))
    return results


def _high_cardinality_columns(df: pd.DataFrame, limit: int = 6) -> list[ColumnInsightOut]:
    results = []
    for c in categorical_columns(df):
        non_null = df[c].dropna()
        if len(non_null) == 0:
            continue
        ratio = non_null.nunique() / len(non_null)
        if non_null.nunique() > 50 and ratio > 0.9:
            results.append(ColumnInsightOut(column=str(c), detail=f"{non_null.nunique()} unique values ({ratio:.0%} of rows) — likely an identifier"))
    results.sort(key=lambda r: -int(r.detail.split()[0]))
    return results[:limit]


def _outlier_columns(df: pd.DataFrame, limit: int = 6) -> list[ColumnInsightOut]:
    results = []
    for c in numeric_columns(df):
        series = df[c].dropna()
        if len(series) < 5:
            continue
        q1, q3 = series.quantile(0.25), series.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        count = int(((series < lower) | (series > upper)).sum())
        if count > 0:
            results.append(ColumnInsightOut(column=str(c), detail=f"{count} IQR outlier(s) ({count / len(series):.1%})"))
    results.sort(key=lambda r: -int(r.detail.split()[0]))
    return results[:limit]


def _suspicious_patterns(df: pd.DataFrame, limit: int = 6) -> list[ColumnInsightOut]:
    results = []
    for c in numeric_columns(df):
        if pd.Series([c]).str.contains(NEGATIVE_SUSPECT_PATTERN, case=False, regex=True).iloc[0]:
            series = df[c].dropna()
            neg = int((series < 0).sum())
            if neg > 0:
                results.append(ColumnInsightOut(column=str(c), detail=f"{neg} negative value(s) in a column that should likely be non-negative"))

    dup_count = duplicate_row_count(df)
    if dup_count > 0:
        results.append(ColumnInsightOut(column="(all columns)", detail=f"{dup_count} exact duplicate row(s) detected"))

    return results[:limit]


def build_insights(dataset: Dataset) -> InsightsSummaryOut:
    df = load_dataframe(dataset)

    return InsightsSummaryOut(
        dataset_id=dataset.id,
        topMissingColumns=_top_missing_columns(df),
        correlatedFeatures=_correlated_features(df),
        skewedColumns=_skewed_columns(df),
        constantColumns=_constant_columns(df),
        highCardinalityColumns=_high_cardinality_columns(df),
        outlierColumns=_outlier_columns(df),
        suspiciousPatterns=_suspicious_patterns(df),
    )
