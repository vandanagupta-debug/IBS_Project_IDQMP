"""
Phase 2 profiling engine.

Computes structural and statistical profile information for a stored dataset
on demand. Nothing here is persisted — the caller (app/api/profiling.py)
re-reads the file with pandas every request, which is fine for the CSV/XLSX
file sizes this MVP targets. A caching layer can be added later without
changing the response contract.
"""
import os
from typing import Optional

import pandas as pd

from app.models.dataset import Dataset
from app.schemas.profiling import ColumnProfileOut, NumericStatsOut, ProfilingSummaryOut
from app.services.datasets.dataframe_loader import duplicate_row_count


class ProfilingError(Exception):
    """Raised when a dataset can't be profiled (missing file, unreadable, etc.)."""


def _read_dataframe(dataset: Dataset) -> pd.DataFrame:
    if not os.path.exists(dataset.file_path):
        raise ProfilingError("Stored file is missing from disk.")

    try:
        if dataset.file_type == "csv":
            return pd.read_csv(dataset.file_path)
        return pd.read_excel(dataset.file_path)
    except Exception as exc:  # noqa: BLE001 - surface as a profiling-specific error
        raise ProfilingError(f"Could not parse dataset: {exc}") from exc


def _infer_friendly_type(series: pd.Series) -> str:
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if pd.api.types.is_integer_dtype(series):
        return "integer"
    if pd.api.types.is_float_dtype(series):
        return "float"
    if pd.api.types.is_object_dtype(series) or isinstance(series.dtype, pd.CategoricalDtype):
        non_null = series.dropna()
        if len(non_null) == 0:
            return "string"
        unique_ratio = series.nunique() / max(len(non_null), 1)
        if series.nunique() <= 50 and unique_ratio < 0.05:
            return "category"
        return "string"
    return "string"


def _build_numeric_stats(df: pd.DataFrame) -> Optional[NumericStatsOut]:
    numeric_df = df.select_dtypes(include="number")
    if numeric_df.shape[1] == 0:
        return None

    column = numeric_df.columns[0]
    series = numeric_df[column].dropna()
    if series.empty:
        return None

    mode_series = series.mode()
    mode_value = float(mode_series.iloc[0]) if not mode_series.empty else None

    return NumericStatsOut(
        column=str(column),
        mean=float(series.mean()),
        median=float(series.median()),
        mode=mode_value,
        std_dev=float(series.std()) if len(series) > 1 else 0.0,
        min=float(series.min()),
        max=float(series.max()),
    )


def _build_column_breakdown(df: pd.DataFrame) -> list[ColumnProfileOut]:
    breakdown = []
    for column in df.columns:
        series = df[column]
        breakdown.append(
            ColumnProfileOut(
                column=str(column),
                type=_infer_friendly_type(series),
                missing=int(series.isna().sum()),
                unique=int(series.nunique(dropna=True)),
            )
        )
    return breakdown


def build_profile(dataset: Dataset) -> ProfilingSummaryOut:
    df = _read_dataframe(dataset)

    return ProfilingSummaryOut(
        dataset_id=dataset.id,
        dataset_name=dataset.original_filename,
        rows=len(df),
        columns=len(df.columns),
        missing_values=int(df.isna().sum().sum()),
        duplicate_records=duplicate_row_count(df),
        unique_values=int(df.nunique(dropna=True).sum()),
        memory_usage_bytes=int(df.memory_usage(deep=True).sum()),
        numeric_stats=_build_numeric_stats(df),
        column_breakdown=_build_column_breakdown(df),
    )
