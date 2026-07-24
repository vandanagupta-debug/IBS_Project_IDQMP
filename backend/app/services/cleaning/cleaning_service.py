"""
Phase 3 — Automated Data Cleaning.

Runs a fixed, transparent cleaning pipeline against the uploaded dataset
and writes the result as a new dataset (so it can be downloaded through the
existing /datasets/{id}/download endpoint). Nothing here touches a sample
or hardcoded file.
"""

from __future__ import annotations

import os
import uuid

import pandas as pd
from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.schemas.cleaning import (
    CleaningOperationOut,
    CleaningResultOut,
    CleaningSnapshotOut,
)
from app.services.datasets.dataframe_loader import (
    categorical_columns,
    load_dataframe,
    numeric_columns,
)
from app.services.datasets.dataset_service import UPLOAD_ROOT, ensure_upload_dir


def _quality_for_df(dataset_id: int, df: pd.DataFrame) -> float:
    """Reuses the quality dimension math without re-reading from disk."""
    from app.services.quality import quality_service as qs

    completeness = qs._completeness(df)
    uniqueness = qs._uniqueness(df)
    validity = qs._validity(df)
    consistency = qs._consistency(df)
    accuracy = qs._accuracy(df)
    freshness, _ = qs._freshness(df)
    return round(
        (completeness + uniqueness + validity + consistency + accuracy + freshness) / 6,
        1,
    )


def run_cleaning_pipeline(dataset: Dataset, db: Session) -> CleaningResultOut:
    df = load_dataframe(dataset)
    before_rows = len(df)
    before_score = _quality_for_df(dataset.id, df)

    cleaned = df.copy()
    operations: list[CleaningOperationOut] = []

    # 1) Missing values
    missing_before = int(cleaned.isna().sum().sum())
    for col in numeric_columns(cleaned):
        if cleaned[col].isna().any():
            cleaned[col] = cleaned[col].fillna(cleaned[col].median())
    for col in categorical_columns(cleaned):
        if cleaned[col].isna().any():
            mode = cleaned[col].mode(dropna=True)
            fill_value = mode.iloc[0] if not mode.empty else ""
            cleaned[col] = cleaned[col].fillna(fill_value)
    operations.append(
        CleaningOperationOut(name="Missing values handled", count=missing_before)
    )

    # 2) Duplicates
    dup_count = int(cleaned.duplicated().sum())
    cleaned = cleaned.drop_duplicates()
    operations.append(CleaningOperationOut(name="Duplicates removed", count=dup_count))

    # 3) Type corrections — numeric-looking text columns coerced to numeric
    type_fixes = 0
    for col in categorical_columns(cleaned):
        as_str = cleaned[col].astype(str)
        looks_numeric = as_str.str.match(r"^-?\d+(\.\d+)?$")
        if looks_numeric.mean() > 0.95 and looks_numeric.sum() > 0:
            coerced = pd.to_numeric(cleaned[col], errors="coerce")
            type_fixes += int(coerced.notna().sum())
            cleaned[col] = coerced
    operations.append(
        CleaningOperationOut(name="Data type corrections", count=type_fixes)
    )

    # 4) Outliers — clip numeric columns to their IQR bounds
    outliers_treated = 0
    for col in numeric_columns(cleaned):
        series = cleaned[col].dropna()
        if len(series) < 5:
            continue
        q1, q3 = series.quantile(0.25), series.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        mask = (cleaned[col] < lower) | (cleaned[col] > upper)
        outliers_treated += int(mask.sum())
        cleaned[col] = cleaned[col].clip(lower, upper)
    operations.append(
        CleaningOperationOut(name="Outliers treated", count=outliers_treated)
    )

    after_score = _quality_for_df(dataset.id, cleaned)

    # Persist the cleaned dataset as a new, downloadable Dataset row.
    ensure_upload_dir()
    stored_filename = f"{uuid.uuid4().hex}.csv"
    absolute_path = os.path.join(UPLOAD_ROOT, stored_filename)
    cleaned.to_csv(absolute_path, index=False)

    base_name = os.path.splitext(dataset.original_filename)[0]
    new_dataset = Dataset(
        original_filename=f"{base_name}_cleaned.csv",
        stored_filename=stored_filename,
        file_path=absolute_path,
        file_type="csv",
        file_size_bytes=os.path.getsize(absolute_path),
        rows=len(cleaned),
        columns=len(cleaned.columns),
        status="processed",
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    return CleaningResultOut(
        datasetId=dataset.id,
        cleanedDatasetId=new_dataset.id,
        operations=operations,
        before=CleaningSnapshotOut(rows=before_rows, qualityScore=before_score),
        after=CleaningSnapshotOut(rows=len(cleaned), qualityScore=after_score),
    )
