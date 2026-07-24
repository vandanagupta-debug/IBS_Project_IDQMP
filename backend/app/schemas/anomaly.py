from pydantic import BaseModel


class AlgorithmSummaryOut(BaseModel):
    name: str
    outliers: int
    description: str


class ScatterPointOut(BaseModel):
    x: float
    y: float
    outlier: bool


class OutlierRowOut(BaseModel):
    id: str
    column: str
    value: str
    expectedRange: str
    method: str
    severity: str  # "low" | "medium" | "high"


class AnomalySummaryOut(BaseModel):
    dataset_id: int
    algorithms: list[AlgorithmSummaryOut]
    totalOutliers: int
    scatter: list[ScatterPointOut]
    outlierRows: list[OutlierRowOut]
    message: str | None = None
