from typing import List

from pydantic import BaseModel


class QualityDimensionOut(BaseModel):
    name: str
    score: float
    description: str


class QualityScoreOut(BaseModel):
    dataset_id: int
    overall: float
    dimensions: List[QualityDimensionOut]
