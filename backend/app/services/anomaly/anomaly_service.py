"""
Phase 3 — Anomaly Detection.

Runs an ensemble of unsupervised outlier detectors against the numeric
columns of the uploaded dataset: Isolation Forest, Local Outlier Factor,
Z-score, and IQR. Nothing here reads from a sample dataset — every score is
computed against `load_dataframe(dataset)`.
"""
from __future__ import annotations

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.impute import SimpleImputer
from sklearn.decomposition import PCA
from sklearn.preprocessing import MinMaxScaler

from app.models.dataset import Dataset
from app.schemas.anomaly import (
    AlgorithmSummaryOut, AnomalySummaryOut, ScatterPointOut, OutlierRowOut,
)
from app.services.datasets.dataframe_loader import load_dataframe, numeric_columns

MAX_ROWS_FOR_MODELS = 20000  # keep interactive response times on very large files
MAX_FLAGGED_ROWS_RETURNED = 25


def build_anomaly_summary(dataset: Dataset) -> AnomalySummaryOut:
    df = load_dataframe(dataset)
    num_cols = numeric_columns(df)

    if not num_cols:
        return AnomalySummaryOut(
            dataset_id=dataset.id,
            algorithms=[],
            totalOutliers=0,
            scatter=[],
            outlierRows=[],
            message="This dataset has no numeric columns, so model-based anomaly detection could not run.",
        )

    work = df[num_cols]
    if len(work) > MAX_ROWS_FOR_MODELS:
        work = work.sample(MAX_ROWS_FOR_MODELS, random_state=42).sort_index()

    imputer = SimpleImputer(strategy="median")
    X = imputer.fit_transform(work)

    n = X.shape[0]
    flags = {}

    # Isolation Forest
    iso = IsolationForest(contamination="auto", random_state=42)
    flags["Isolation Forest"] = iso.fit_predict(X) == -1

    # Local Outlier Factor
    n_neighbors = min(20, max(2, n - 1))
    lof = LocalOutlierFactor(n_neighbors=n_neighbors)
    flags["Local Outlier Factor"] = lof.fit_predict(X) == -1

    # Z-score (|z| > 3 on any column)
    means, stds = X.mean(axis=0), X.std(axis=0)
    stds_safe = np.where(stds == 0, 1, stds)
    z = np.abs((X - means) / stds_safe)
    flags["Z-Score"] = (z > 3).any(axis=1)

    # IQR (outside 1.5*IQR on any column)
    q1, q3 = np.percentile(X, 25, axis=0), np.percentile(X, 75, axis=0)
    iqr = q3 - q1
    iqr_safe = np.where(iqr == 0, 1, iqr)
    lower, upper = q1 - 1.5 * iqr_safe, q3 + 1.5 * iqr_safe
    flags["IQR"] = ((X < lower) | (X > upper)).any(axis=1)

    descriptions = {
        "Isolation Forest": "Tree-based ensemble isolating anomalies via random partitioning.",
        "Local Outlier Factor": "Density-based method comparing local reachability of neighbors.",
        "Z-Score": "Flags values more than 3 standard deviations from the column mean.",
        "IQR": "Flags values outside 1.5x the interquartile range for their column.",
    }

    algorithms = [
        AlgorithmSummaryOut(name=name, outliers=int(mask.sum()), description=descriptions[name])
        for name, mask in flags.items()
    ]

    ensemble_votes = np.sum([m.astype(int) for m in flags.values()], axis=0)
    combined_outlier = ensemble_votes > 0
    total_outliers = int(combined_outlier.sum())

    # --- Scatter plot (2D projection) ---
    if X.shape[1] >= 2:
        coords = X[:, :2]
    else:
        pca = PCA(n_components=1)
        coords = np.column_stack([pca.fit_transform(X).ravel(), np.zeros(n)])

    scaler = MinMaxScaler(feature_range=(0, 100))
    coords_scaled = scaler.fit_transform(coords)
    scatter = [
        ScatterPointOut(x=round(float(px), 2), y=round(float(py), 2), outlier=bool(combined_outlier[i]))
        for i, (px, py) in enumerate(coords_scaled)
    ]

    # --- Flagged rows table ---
    original_index = work.index
    flagged_positions = np.where(combined_outlier)[0]
    flagged_positions = sorted(flagged_positions, key=lambda p: -ensemble_votes[p])[:MAX_FLAGGED_ROWS_RETURNED]

    outlier_rows = []
    for pos in flagged_positions:
        row_idx = original_index[pos]
        votes = ensemble_votes[pos]
        methods = [name for name, mask in flags.items() if mask[pos]]
        # Pick the numeric column with the largest |z| as the "cause" column.
        z_row = z[pos]
        worst_col_i = int(np.argmax(z_row)) if len(z_row) else 0
        col_name = num_cols[worst_col_i]
        value = df.loc[row_idx, col_name]
        col_series = df[col_name].dropna()
        expected_range = f"{col_series.quantile(0.05):.2f} - {col_series.quantile(0.95):.2f}"

        severity = "high" if votes >= 3 else "medium" if votes == 2 else "low"

        outlier_rows.append(
            OutlierRowOut(
                id=f"row_{row_idx}",
                column=str(col_name),
                value=f"{value}",
                expectedRange=expected_range,
                method=", ".join(methods),
                severity=severity,
            )
        )

    return AnomalySummaryOut(
        dataset_id=dataset.id,
        algorithms=algorithms,
        totalOutliers=total_outliers,
        scatter=scatter,
        outlierRows=outlier_rows,
    )