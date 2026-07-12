"""
Phase 3 — Data Validation.

Runs a set of rule-based checks derived from the uploaded dataset's own
columns and types (no assumption of any fixed schema like TransactionID,
Amount, etc.).
"""
from __future__ import annotations

import re
import pandas as pd

from app.models.dataset import Dataset
from app.schemas.validation import BreakdownItemOut, ValidationDetailOut, ValidationSummaryOut
from app.services.datasets.dataframe_loader import load_dataframe, numeric_columns

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?[0-9()\-.\s]{7,15}$")


def build_validation_summary(dataset: Dataset) -> ValidationSummaryOut:
    df = load_dataframe(dataset)
    details: list[ValidationDetailOut] = []
    breakdown: dict[str, int] = {}
    check_id = 0

    def record(rule: str, column: str, failed: bool, affected: int, category: str):
        nonlocal check_id
        check_id += 1
        status = "Failed" if failed else "Passed"
        details.append(ValidationDetailOut(id=f"v{check_id}", rule=rule, column=column, status=status, affectedRows=affected))
        if failed:
            breakdown[category] = breakdown.get(category, 0) + affected

    # 1) Missing values — one check per column that has any missing values
    missing = df.isna().sum()
    for col, count in missing.items():
        if count > 0:
            record("Missing Values Check", str(col), True, int(count), "Missing Values")
    if missing.sum() == 0:
        record("Missing Values Check", "(all columns)", False, 0, "Missing Values")

    # 2) Duplicate detection
    dup_count = int(df.duplicated().sum())
    record("Duplicate Detection", "(all columns)", dup_count > 0, dup_count, "Duplicates")

    # 3) Schema / type consistency for object columns (mixed numeric+text values)
    for col in df.columns:
        series = df[col].dropna()
        if series.empty or pd.api.types.is_numeric_dtype(series) or pd.api.types.is_bool_dtype(series):
            continue
        as_str = series.astype(str)
        looks_numeric = as_str.str.match(r"^-?\d+(\.\d+)?$")
        # Flag as inconsistent only if it's a *mix* of numeric-looking and non-numeric text.
        if 0 < looks_numeric.mean() < 1:
            affected = int((~looks_numeric).sum())
            record("Schema / Type Consistency", str(col), True, affected, "Schema Errors")

    # 4) Range validation via IQR on numeric columns
    for col in numeric_columns(df):
        series = df[col].dropna()
        if len(series) < 5:
            continue
        q1, q3 = series.quantile(0.25), series.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        affected = int(((series < lower) | (series > upper)).sum())
        record("Range Validation", str(col), affected > 0, affected, "Range Violations")

    # 5) Format validation for columns that look like emails / phone numbers
    for col in df.columns:
        col_lower = str(col).lower()
        series = df[col].dropna().astype(str)
        if series.empty:
            continue
        if "email" in col_lower:
            invalid = int((~series.str.match(EMAIL_RE)).sum())
            record("Regex Validation (email)", str(col), invalid > 0, invalid, "Regex Failures")
        elif "phone" in col_lower or "mobile" in col_lower:
            invalid = int((~series.str.match(PHONE_RE)).sum())
            record("Regex Validation (phone)", str(col), invalid > 0, invalid, "Regex Failures")

    # 6) Freshness — flag any date/time column with future-dated values
    date_cols = [c for c in df.columns if re.search(r"date|time|_at$|_dt$", str(c), re.IGNORECASE)]
    now = pd.Timestamp.now()
    for col in date_cols:
        parsed = pd.to_datetime(df[col], errors="coerce", format="mixed")
        future = int((parsed.dropna() > now).sum())
        record("Freshness Validation", str(col), future > 0, future, "Freshness Violations")

    total = len(details)
    passed = sum(1 for d in details if d.status == "Passed")
    failed = total - passed

    breakdown_out = [BreakdownItemOut(name=k, value=v) for k, v in sorted(breakdown.items(), key=lambda kv: -kv[1])]

    return ValidationSummaryOut(
        dataset_id=dataset.id,
        totalChecks=total,
        passed=passed,
        failed=failed,
        breakdown=breakdown_out,
        details=details,
    )
