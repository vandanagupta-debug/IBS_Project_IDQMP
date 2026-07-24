"""
Phase 3 — Visualizations.

Assembles chart-ready JSON (consumed directly by recharts on the frontend)
from the uploaded dataset. Chart types are chosen automatically based on
each column's inferred type.
"""

from __future__ import annotations

import pandas as pd
from sklearn.preprocessing import MinMaxScaler

from app.models.dataset import Dataset
from app.schemas.visualization import (
    CategoryFrequencyOut,
    CompletenessByColumnOut,
    CorrelationHeatmapOut,
    MissingByColumnOut,
    NameValueOut,
    ScatterPointOut,
    VisualizationsOut,
)
from app.services.datasets.dataframe_loader import (
    categorical_columns,
    load_dataframe,
    numeric_columns,
)
from app.services.quality.quality_service import build_quality_score
from app.services.validation.validation_service import build_validation_summary

MAX_COLUMNS_SHOWN = 12


def _dtype_distribution(df: pd.DataFrame) -> list[NameValueOut]:
    num = len(numeric_columns(df))
    counts: dict[str, int] = {"Numeric": num}
    for c in categorical_columns(df):
        if pd.api.types.is_bool_dtype(df[c]):
            key = "Boolean"
        elif pd.api.types.is_datetime64_any_dtype(df[c]):
            key = "Datetime"
        else:
            key = "Categorical / Text"
        counts[key] = counts.get(key, 0) + 1
    return [NameValueOut(name=k, value=v) for k, v in counts.items() if v > 0]


def _scatter_outliers(df: pd.DataFrame) -> list[ScatterPointOut]:
    num_cols = numeric_columns(df)
    if len(num_cols) < 1:
        return []
    cols = num_cols[:2] if len(num_cols) >= 2 else [num_cols[0], num_cols[0]]
    work = df[num_cols].dropna()
    if work.empty:
        return []
    if len(work) > 500:
        work = work.sample(500, random_state=42)

    q1, q3 = work.quantile(0.25), work.quantile(0.75)
    iqr = q3 - q1
    iqr_safe = iqr.replace(0, 1)
    lower, upper = q1 - 1.5 * iqr_safe, q3 + 1.5 * iqr_safe
    outlier_mask = ((work < lower) | (work > upper)).any(axis=1)

    coords = work[cols].to_numpy()
    scaler = MinMaxScaler(feature_range=(0, 100))
    coords_scaled = scaler.fit_transform(coords)

    return [
        ScatterPointOut(x=round(float(x), 2), y=round(float(y), 2), outlier=bool(o))
        for (x, y), o in zip(coords_scaled, outlier_mask.to_numpy())
    ]


def _category_frequency(df: pd.DataFrame) -> CategoryFrequencyOut | None:
    best_col = None
    best_series = None
    for c in categorical_columns(df):
        series = df[c].dropna()
        if series.empty:
            continue
        nunique = series.nunique()
        if 1 < nunique <= 30 and (best_series is None or nunique > best_series.nunique()):
            best_col, best_series = c, series
    if best_col is None:
        return None
    counts = best_series.value_counts().head(10)
    return CategoryFrequencyOut(
        column=str(best_col),
        data=[NameValueOut(name=str(k), value=float(v)) for k, v in counts.items()],
    )


def _correlation_heatmap(df: pd.DataFrame) -> CorrelationHeatmapOut | None:
    num_cols = numeric_columns(df)[:MAX_COLUMNS_SHOWN]
    if len(num_cols) < 2:
        return None
    corr = df[num_cols].corr(numeric_only=True).round(2).fillna(0)
    return CorrelationHeatmapOut(
        columns=[str(c) for c in corr.columns],
        matrix=[[float(v) for v in row] for row in corr.to_numpy()],
    )


def build_visualizations(dataset: Dataset) -> VisualizationsOut:
    df = load_dataframe(dataset)

    quality = build_quality_score(dataset)
    validation = build_validation_summary(dataset)

    missing = df.isna().sum()
    missing_by_column = [
        MissingByColumnOut(column=str(c), missing=int(v))
        for c, v in missing.sort_values(ascending=False).head(MAX_COLUMNS_SHOWN).items()
    ]

    total = len(df)
    completeness = [
        CompletenessByColumnOut(
            column=str(c), completeness=round(100 * (1 - int(v) / total), 1)
        )
        for c, v in missing.items()
    ][:MAX_COLUMNS_SHOWN]

    return VisualizationsOut(
        dataset_id=dataset.id,
        gaugeScore=quality.overall,
        missingByColumn=missing_by_column,
        dtypeDistribution=_dtype_distribution(df),
        columnCompleteness=completeness,
        scatterOutliers=_scatter_outliers(df),
        categoryFrequency=_category_frequency(df),
        correlationHeatmap=_correlation_heatmap(df),
        validationBreakdown=[
            NameValueOut(name=b.name, value=b.value) for b in validation.breakdown
        ],
    )
