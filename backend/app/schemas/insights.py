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
    topMissingColumns: list[ColumnInsightOut]
    correlatedFeatures: list[CorrelatedPairOut]
    skewedColumns: list[ColumnInsightOut]
    constantColumns: list[ColumnInsightOut]
    highCardinalityColumns: list[ColumnInsightOut]
    outlierColumns: list[ColumnInsightOut]
    suspiciousPatterns: list[ColumnInsightOut]


class RecommendationOut(BaseModel):
    id: str
    text: str
    severity: str  # "low" | "medium" | "high"
    confidence: int
