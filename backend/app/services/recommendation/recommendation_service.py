"""
Phase 3 — Recommendations ("AI Suggestion Engine").

Turns the dataset's own computed insights + quality dimensions into
actionable, ranked recommendations. Every recommendation is generated from
the uploaded dataset — nothing is hardcoded.
"""
from __future__ import annotations

from app.models.dataset import Dataset
from app.schemas.insights import RecommendationOut
from app.services.datasets.dataframe_loader import load_dataframe, numeric_columns, categorical_columns
from app.services.insights.insights_service import build_insights


def build_recommendations(dataset: Dataset) -> list[RecommendationOut]:
    df = load_dataframe(dataset)
    insights = build_insights(dataset)

    recs: list[RecommendationOut] = []
    n = 0

    def add(text: str, severity: str, confidence: int):
        nonlocal n
        n += 1
        recs.append(RecommendationOut(id=f"rec_{n}", text=text, severity=severity, confidence=confidence))

    # Missing values
    for item in insights.topMissingColumns:
        col = item.column
        is_numeric = col in numeric_columns(df)
        pct = df[col].isna().mean()
        strategy = "median" if is_numeric else "mode (most frequent value)"
        severity = "high" if pct > 0.3 else "medium" if pct > 0.1 else "low"
        confidence = min(99, 70 + int(pct * 80))
        add(f"Fill missing values in '{col}' using the column {strategy} ({pct:.1%} missing).", severity, confidence)

    # Duplicates
    dup_count = int(df.duplicated().sum())
    if dup_count > 0:
        pct = dup_count / len(df)
        severity = "high" if pct > 0.1 else "medium" if pct > 0.02 else "low"
        add(f"Remove {dup_count} exact-duplicate row(s) ({pct:.1%} of the dataset).", severity, min(99, 85 + int(pct * 50)))

    # Categorical imbalance
    for col in categorical_columns(df):
        counts = df[col].dropna().value_counts(normalize=True)
        if len(counts) >= 2 and counts.iloc[0] > 0.9:
            add(
                f"'{col}' is heavily imbalanced — '{counts.index[0]}' makes up {counts.iloc[0]:.1%} of values. "
                f"Consider rebalancing or excluding it from predictive features.",
                "medium", 80,
            )

    # Outliers
    for item in insights.outlierColumns:
        add(f"Review extreme values in '{item.column}' — {item.detail}.", "medium", 78)

    # Skewed columns
    for item in insights.skewedColumns:
        add(f"'{item.column}' is heavily skewed ({item.detail}) — consider a log or Box-Cox transform before modeling.", "low", 70)

    # Constant columns
    for item in insights.constantColumns:
        add(f"'{item.column}' has a single constant value and carries no information — consider dropping it.", "low", 88)

    # High cardinality
    for item in insights.highCardinalityColumns:
        add(f"'{item.column}' looks like an identifier ({item.detail}) rather than a modeling feature.", "low", 75)

    # Correlated features
    for pair in insights.correlatedFeatures[:3]:
        add(
            f"'{pair.columnA}' and '{pair.columnB}' are highly correlated (r={pair.correlation}) — "
            f"consider dropping one to reduce redundancy.",
            "low", 72,
        )

    if not recs:
        add("No significant data quality issues were detected in this dataset.", "low", 95)

    recs.sort(key=lambda r: (-{"high": 2, "medium": 1, "low": 0}[r.severity], -r.confidence))
    return recs