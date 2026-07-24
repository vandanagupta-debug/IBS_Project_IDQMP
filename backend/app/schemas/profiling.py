from pydantic import BaseModel


class NumericStatsOut(BaseModel):
    column: str
    mean: float
    median: float
    mode: float | None = None
    std_dev: float
    min: float
    max: float


class ColumnProfileOut(BaseModel):
    column: str
    type: str  # "integer" | "float" | "datetime" | "category" | "string" | "boolean"
    missing: int
    unique: int


class ProfilingSummaryOut(BaseModel):
    dataset_id: int
    dataset_name: str
    rows: int
    columns: int
    missing_values: int
    duplicate_records: int
    unique_values: int
    memory_usage_bytes: int
    numeric_stats: NumericStatsOut | None = None
    column_breakdown: list[ColumnProfileOut]
