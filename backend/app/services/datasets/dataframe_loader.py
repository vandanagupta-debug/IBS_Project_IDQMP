"""
Single source of truth for turning a stored Dataset row into a pandas
DataFrame. Every analysis module (quality, anomaly, insights, visualizations,
recommendations, validation, cleaning, reports) reads through this function
instead of loading any sample/hardcoded CSV, so they all operate on exactly
the dataset the user uploaded.
"""

import os

import pandas as pd

from app.models.dataset import Dataset


class DatasetNotReadyError(Exception):
    """Raised when a dataset can't currently be loaded for analysis."""


def load_dataframe(dataset: Dataset) -> pd.DataFrame:
    if dataset.status != "processed":
        raise DatasetNotReadyError(
            f"Dataset is not ready for analysis (status: {dataset.status})."
        )

    if not dataset.file_path or not os.path.exists(dataset.file_path):
        raise DatasetNotReadyError("Stored file is missing from disk.")

    try:
        if dataset.file_type == "csv":
            df = pd.read_csv(dataset.file_path)
        else:
            df = pd.read_excel(dataset.file_path)
    except Exception as exc:  # noqa: BLE001
        raise DatasetNotReadyError(f"Could not parse dataset: {exc}") from exc

    if df.shape[1] == 0:
        raise DatasetNotReadyError("Dataset has no columns.")
    if df.shape[0] == 0:
        raise DatasetNotReadyError("Dataset is empty.")

    return df


def numeric_columns(df: pd.DataFrame) -> list[str]:
    return list(df.select_dtypes(include="number").columns)


def categorical_columns(df: pd.DataFrame) -> list[str]:
    return [c for c in df.columns if c not in numeric_columns(df)]


def duplicate_row_count(df: pd.DataFrame) -> int:
    """Counts exact duplicate rows, ignoring identifier-like columns (e.g. an
    auto-increment 'id') since those make every row look unique even when
    the actual business data is duplicated."""
    id_like = {
        c
        for c in df.columns
        if str(c).strip().lower() in {"id", "index", "_id"}
        or str(c).strip().lower().endswith("_id")
    }
    compare_df = df.drop(columns=list(id_like)) if id_like else df
    return int(compare_df.duplicated().sum())
