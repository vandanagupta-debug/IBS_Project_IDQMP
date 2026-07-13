from typing import List
from pydantic import BaseModel


class CorrelatedPairOut(BaseModel):
    columnA: str
    columnB: str
    correlation: float


class ColumnInsightOut(BaseModel):
    column: str
    detail: str


class InsightsSummaryOut(BaseModel):
    dataset_id: int
    topMissingColumns: List[ColumnInsightOut]
    correlatedFeatures: List[CorrelatedPairOut]
    skewedColumns: List[ColumnInsightOut]
    constantColumns: List[ColumnInsightOut]
    highCardinalityColumns: List[ColumnInsightOut]
    outlierColumns: List[ColumnInsightOut]
    suspiciousPatterns: List[ColumnInsightOut]


class RecommendationOut(BaseModel):
    id: str
    text: str
    severity: str  # "low" | "medium" | "high"
    confidence: int
