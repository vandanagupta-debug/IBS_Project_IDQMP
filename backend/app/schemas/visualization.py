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
    data: list[NameValueOut]


class CorrelationHeatmapOut(BaseModel):
    columns: list[str]
    matrix: list[list[float]]


class VisualizationsOut(BaseModel):
    dataset_id: int
    gaugeScore: float
    missingByColumn: list[MissingByColumnOut]
    dtypeDistribution: list[NameValueOut]
    columnCompleteness: list[CompletenessByColumnOut]
    scatterOutliers: list[ScatterPointOut]
    categoryFrequency: CategoryFrequencyOut | None = None
    correlationHeatmap: CorrelationHeatmapOut | None = None
    validationBreakdown: list[NameValueOut]
