from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api._common import get_processed_dataset_or_404
from app.database.deps import get_db
from app.schemas.insights import InsightsSummaryOut, RecommendationOut
from app.services.datasets.dataframe_loader import DatasetNotReadyError
from app.services.insights.insights_service import build_insights
from app.services.recommendation.recommendation_service import build_recommendations

router = APIRouter(prefix="/datasets", tags=["insights"])


@router.get("/{dataset_id}/insights", response_model=InsightsSummaryOut)
def get_insights(dataset_id: int, db: Session = Depends(get_db)):
    dataset = get_processed_dataset_or_404(dataset_id, db)
    try:
        return build_insights(dataset)
    except DatasetNotReadyError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{dataset_id}/recommendations", response_model=List[RecommendationOut])
def get_recommendations(dataset_id: int, db: Session = Depends(get_db)):
    dataset = get_processed_dataset_or_404(dataset_id, db)
    try:
        return build_recommendations(dataset)
    except DatasetNotReadyError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
