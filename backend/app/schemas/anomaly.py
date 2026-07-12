from typing import List, Optional
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
    algorithms: List[AlgorithmSummaryOut]
    totalOutliers: int
    scatter: List[ScatterPointOut]
    outlierRows: List[OutlierRowOut]
    message: Optional[str] = None
