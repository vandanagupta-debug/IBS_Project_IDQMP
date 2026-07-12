from typing import List, Optional
from pydantic import BaseModel


class NameValueOut(BaseModel):
    name: str
    value: float


class MissingByColumnOut(BaseModel):
    column: str
    missing: int


class CompletenessByColumnOut(BaseModel):
    column: str
    completeness: float


class ScatterPointOut(BaseModel):
    x: float
    y: float
    outlier: bool


class CategoryFrequencyOut(BaseModel):
    column: str
    data: List[NameValueOut]


class CorrelationHeatmapOut(BaseModel):
    columns: List[str]
    matrix: List[List[float]]


class VisualizationsOut(BaseModel):
    dataset_id: int
    gaugeScore: float
    missingByColumn: List[MissingByColumnOut]
    dtypeDistribution: List[NameValueOut]
    columnCompleteness: List[CompletenessByColumnOut]
    scatterOutliers: List[ScatterPointOut]
    categoryFrequency: Optional[CategoryFrequencyOut] = None
    correlationHeatmap: Optional[CorrelationHeatmapOut] = None
    validationBreakdown: List[NameValueOut]
